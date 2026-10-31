// src/audio-queue-controller.ts
/**
 * HW 2: Concurrent FIFO Audio Visualizer Queue Engine & Async FIFO Sequence Replay
 * Unified FIFO Queue managing:
 * 1. Asynchronous track fetch & Web Audio decode tasks with AbortController tokens.
 * 2. Chronological FIFO note recording ({ midi, freqHz, durationMs, deltaMs })
 *    and non-blocking variable-speed replay (0.5x, 1.0x, 2.0x) with AbortController cancellation.
 */

import { PolyphonicSynth } from './audio/PolyphonicSynth.js';
import { midiToFrequency } from './piano/piano-generator';

export type AudioTaskStatus =
    | 'queued'
    | 'downloading'
    | 'decoding'
    | 'completed'
    | 'cancelled'
    | 'error';

export interface AudioTask {
    id: string;
    trackUrl: string;
    title: string;
    controller: AbortController;
    resolve: (buffer: AudioBuffer) => void;
    reject: (reason: unknown) => void;
    status: AudioTaskStatus;
    progress: number; // 0 - 100
    errorMessage?: string;
    enqueuedAt: number;
    startedAt?: number;
    completedAt?: number;
    decodedBuffer?: AudioBuffer;
}

export interface QueueTaskCounts {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
}

export interface RecordedNoteEvent {
    midi: number;
    freqHz: number;
    durationMs: number;
    deltaMs: number;
}

export type PlaybackSpeed = 0.5 | 1.0 | 2.0;

export type SequencerState = 'idle' | 'recording' | 'replaying';

export interface SequencerSnapshot {
    state: SequencerState;
    recordedEvents: readonly RecordedNoteEvent[];
    playbackSpeed: PlaybackSpeed;
    replayingIndex: number | null;
    totalDurationMs: number;
}

export type QueueSubscriber = (snapshot: SequencerSnapshot) => void;

interface PendingActiveNote {
    startTime: number;
    deltaMs: number;
    freqHz: number;
}

export class AudioTaskQueue {
    private queue: AudioTask[] = [];
    private runningTasks = new Set<AudioTask>();
    private maxConcurrency = 1;
    private history: AudioTask[] = [];
    private audioContext: AudioContext | null = null;
    private bufferCache = new Map<string, AudioBuffer>();
    private subscribers = new Set<QueueSubscriber>();

    // Atomic telemetry counters
    private completedCount = 0;
    private failedCount = 0;
    private cancelledCount = 0;

    // FIFO Note Recording & Variable-Speed Sequence Replay state
    private synth: PolyphonicSynth | null = null;
    private recordedEvents: RecordedNoteEvent[] = [];
    private state: SequencerState = 'idle';
    private playbackSpeed: PlaybackSpeed = 1.0;
    private replayingIndex: number | null = null;
    private lastEventStartTime = 0;
    private activeRecordingNotes = new Map<number, PendingActiveNote>();
    private abortController: AbortController | null = null;
    private activeTimers = new Set<ReturnType<typeof setTimeout>>();

    constructor(audioContextOrSynth?: AudioContext | PolyphonicSynth, maxConcurrency = 1) {
        if (audioContextOrSynth) {
            if (typeof (audioContextOrSynth as PolyphonicSynth).noteOn === 'function') {
                this.synth = audioContextOrSynth as PolyphonicSynth;
            } else {
                this.audioContext = audioContextOrSynth as AudioContext;
            }
        }
        this.maxConcurrency = Math.max(1, maxConcurrency);
    }

    public setAudioContext(ctx: AudioContext): void {
        this.audioContext = ctx;
    }

    public setSynth(synth: PolyphonicSynth): void {
        this.synth = synth;
    }

    public setMaxConcurrency(limit: number): void {
        this.maxConcurrency = Math.max(1, limit);
        this.scheduleNext();
    }

    public getMaxConcurrency(): number {
        return this.maxConcurrency;
    }

    private now(): number {
        return Date.now();
    }

    // =========================================================================
    // REQUIREMENT C & D: FIFO Note Recording & Variable-Speed Async Replay
    // =========================================================================

    /**
     * Start recording incoming note events into the FIFO queue.
     */
    public startRecording(): void {
        if (this.state === 'replaying') {
            this.stopSequence();
        }

        this.state = 'recording';
        this.recordedEvents = [];
        this.activeRecordingNotes.clear();
        this.replayingIndex = null;
        this.lastEventStartTime = this.now();

        this.notify();
    }

    /**
     * Record a MIDI note-on event and compute deltaMs from the preceding recorded event.
     */
    public recordNoteOn(midi: number, freqHz?: number): void {
        if (this.state !== 'recording') return;
        if (this.activeRecordingNotes.has(midi)) return;

        const now = this.now();
        const deltaMs = Math.max(0, Math.round(now - this.lastEventStartTime));
        this.lastEventStartTime = now;

        const resolvedFreqHz =
            typeof freqHz === 'number' && Number.isFinite(freqHz)
                ? Number(freqHz.toFixed(2))
                : Number(midiToFrequency(midi).toFixed(2));

        this.activeRecordingNotes.set(midi, {
            startTime: now,
            deltaMs,
            freqHz: resolvedFreqHz,
        });
    }

    /**
     * Record a MIDI note-off event, computing durationMs and storing { midi, freqHz, durationMs, deltaMs }
     * in chronological FIFO order.
     */
    public recordNoteOff(midi: number): RecordedNoteEvent | null {
        if (this.state !== 'recording') return null;

        const pending = this.activeRecordingNotes.get(midi);
        if (!pending) return null;

        const now = this.now();
        const durationMs = Math.max(10, Math.round(now - pending.startTime));

        const event: RecordedNoteEvent = {
            midi,
            freqHz: pending.freqHz,
            durationMs,
            deltaMs: pending.deltaMs,
        };

        this.recordedEvents.push(event);
        this.activeRecordingNotes.delete(midi);

        this.notify();
        return event;
    }

    /**
     * Stop recording and finalize any still-held notes in FIFO insertion order.
     */
    public stopRecording(): void {
        if (this.state !== 'recording') return;

        const now = this.now();
        for (const [midi, pending] of this.activeRecordingNotes.entries()) {
            const durationMs = Math.max(10, Math.round(now - pending.startTime));
            this.recordedEvents.push({
                midi,
                freqHz: pending.freqHz,
                durationMs,
                deltaMs: pending.deltaMs,
            });
        }
        this.activeRecordingNotes.clear();

        this.state = 'idle';
        this.notify();
    }

    /**
     * Clear all recorded note events and reset recording state.
     */
    public clearRecording(): void {
        if (this.state === 'replaying') {
            this.stopSequence();
        }
        if (this.state === 'recording') {
            this.stopRecording();
        }

        this.recordedEvents = [];
        this.activeRecordingNotes.clear();
        this.replayingIndex = null;
        this.notify();
    }

    /**
     * Asynchronously replay recorded events in strict FIFO order at 0.5x, 1.0x, or 2.0x speed.
     * Creates a dedicated AbortController for each session to support immediate cancellation.
     */
    public async replay(speed?: PlaybackSpeed, synthOverride?: PolyphonicSynth): Promise<void> {
        if (this.recordedEvents.length === 0) return;

        // Cancel any previous replay session cleanly before starting a new session
        if (this.state === 'replaying' || this.abortController) {
            this.stopSequence();
        }

        if (speed === 0.5 || speed === 1.0 || speed === 2.0) {
            this.playbackSpeed = speed;
        }

        const targetSynth = synthOverride || this.synth;
        const activeSpeed = this.playbackSpeed;
        // Snapshot the recorded events so the original recording is never mutated during playback
        const eventsSnapshot = this.recordedEvents.map((ev) => ({ ...ev }));

        const controller = new AbortController();
        this.abortController = controller;
        const { signal } = controller;

        this.state = 'replaying';
        this.replayingIndex = 0;
        this.notify();

        try {
            for (let i = 0; i < eventsSnapshot.length; i++) {
                if (signal.aborted) {
                    throw new DOMException('Sequence replay aborted', 'AbortError');
                }

                const event = eventsSnapshot[i];
                this.replayingIndex = i;
                this.notify();

                const scheduledDelay = event.deltaMs / activeSpeed;
                const scheduledDuration = event.durationMs / activeSpeed;

                if (scheduledDelay > 0) {
                    await this.waitAsync(scheduledDelay, signal);
                }

                if (signal.aborted) {
                    throw new DOMException('Sequence replay aborted', 'AbortError');
                }

                if (targetSynth) {
                    targetSynth.noteOn(event.midi, event.freqHz);
                }

                this.scheduleAsyncNoteOff(
                    targetSynth,
                    event.midi,
                    Math.max(10, scheduledDuration),
                    signal
                );
            }

            const lastEvent = eventsSnapshot[eventsSnapshot.length - 1];
            if (lastEvent) {
                const finalWait = Math.max(20, lastEvent.durationMs / activeSpeed);
                await this.waitAsync(finalWait, signal);
            }

            if (!signal.aborted && this.abortController === controller) {
                this.state = 'idle';
                this.replayingIndex = null;
                this.notify();
            }
        } catch (err) {
            if ((err as Error)?.name === 'AbortError' || signal.aborted) {
                // Expected cancellation via AbortController; do not treat as application error
                console.log('[FifoSequencer] Replay session aborted safely via AbortController.');
            } else {
                console.error('[FifoSequencer] Unexpected replay error:', err);
            }
            if (this.abortController === controller) {
                this.state = 'idle';
                this.replayingIndex = null;
                this.notify();
            }
        } finally {
            if (this.abortController === controller) {
                this.abortController = null;
            }
        }
    }

    public async replaySequence(speed?: PlaybackSpeed, synthOverride?: PolyphonicSynth): Promise<void> {
        return this.replay(speed, synthOverride);
    }

    /**
     * Stop Sequence: Immediately aborts all scheduled playback promises via AbortController,
     * clears pending timers, and silences all active oscillators.
     */
    public stopSequence(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this.clearAllTimers();

        if (this.synth) {
            this.synth.dispose();
        }

        this.state = 'idle';
        this.replayingIndex = null;
        this.notify();
    }

    public stopReplay(): void {
        this.stopSequence();
    }

    public setPlaybackSpeed(speed: PlaybackSpeed): void {
        this.playbackSpeed = speed;
        this.notify();
    }

    public getEvents(): readonly RecordedNoteEvent[] {
        return this.recordedEvents;
    }

    public getState(): SequencerState {
        return this.state;
    }

    public getPlaybackSpeed(): PlaybackSpeed {
        return this.playbackSpeed;
    }

    public getReplayingIndex(): number | null {
        return this.replayingIndex;
    }

    public getTotalDurationMs(): number {
        return this.recordedEvents.reduce((acc, ev) => acc + ev.durationMs, 0);
    }

    public getSnapshot(): SequencerSnapshot {
        return {
            state: this.state,
            recordedEvents: [...this.recordedEvents],
            playbackSpeed: this.playbackSpeed,
            replayingIndex: this.replayingIndex,
            totalDurationMs: this.getTotalDurationMs(),
        };
    }

    /**
     * Component unmount cleanup: idempotently cancels active replay and clears timers.
     */
    public dispose(): void {
        this.stopSequence();
        this.clearQueue();
        this.subscribers.clear();
    }

    private waitAsync(ms: number, signal: AbortSignal): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (signal.aborted) {
                return reject(new DOMException('Aborted', 'AbortError'));
            }

            let timer: ReturnType<typeof setTimeout> | null = null;

            const onAbort = () => {
                if (timer !== null) {
                    clearTimeout(timer);
                    this.activeTimers.delete(timer);
                }
                signal.removeEventListener('abort', onAbort);
                reject(new DOMException('Aborted', 'AbortError'));
            };

            signal.addEventListener('abort', onAbort, { once: true });

            timer = setTimeout(() => {
                if (timer !== null) {
                    this.activeTimers.delete(timer);
                }
                signal.removeEventListener('abort', onAbort);
                if (signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                } else {
                    resolve();
                }
            }, ms);

            this.activeTimers.add(timer);
        });
    }

    private scheduleAsyncNoteOff(
        targetSynth: PolyphonicSynth | null,
        midi: number,
        durationMs: number,
        signal: AbortSignal
    ): void {
        let timer: ReturnType<typeof setTimeout> | null = null;

        const onAbort = () => {
            if (timer !== null) {
                clearTimeout(timer);
                this.activeTimers.delete(timer);
            }
            signal.removeEventListener('abort', onAbort);
        };

        signal.addEventListener('abort', onAbort, { once: true });

        timer = setTimeout(() => {
            if (timer !== null) {
                this.activeTimers.delete(timer);
            }
            signal.removeEventListener('abort', onAbort);
            if (!signal.aborted && targetSynth) {
                targetSynth.noteOff(midi);
            }
        }, durationMs);

        this.activeTimers.add(timer);
    }

    private clearAllTimers(): void {
        for (const timer of this.activeTimers) {
            clearTimeout(timer);
        }
        this.activeTimers.clear();
    }

    // =========================================================================
    // Concurrent Audio Track Download & Decode Queue (M5)
    // =========================================================================

    /**
     * Enqueue a track URL for FIFO downloading and decoding.
     */
    async enqueue(trackUrl: string, title?: string): Promise<AudioBuffer> {
        const controller = new AbortController();
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const inferredTitle = title || trackUrl.split('/').pop()?.split('?')[0] || 'Audio Track';

        return new Promise<AudioBuffer>((resolve, reject) => {
            const task: AudioTask = {
                id: taskId,
                trackUrl,
                title: inferredTitle,
                controller,
                resolve,
                reject,
                status: 'queued',
                progress: 0,
                enqueuedAt: Date.now(),
            };

            this.queue.push(task);
            this.notify();
            this.scheduleNext();
        });
    }

    /**
     * Schedules pending tasks according to strict FIFO order and concurrency limit.
     */
    private scheduleNext(): void {
        while (this.runningTasks.size < this.maxConcurrency && this.queue.length > 0) {
            const task = this.queue.shift();
            if (!task) break;

            if (task.controller.signal.aborted) {
                task.status = 'cancelled';
                task.errorMessage = 'Audio task was aborted before processing.';
                this.cancelledCount++;
                this.recordHistory(task);
                task.reject(new DOMException('Audio task was aborted before processing.', 'AbortError'));
                this.notify();
                continue;
            }

            this.runningTasks.add(task);
            this.notify();
            this.executeTask(task);
        }
    }

    /**
     * Executes an individual audio task asynchronously.
     */
    private async executeTask(task: AudioTask): Promise<void> {
        task.startedAt = Date.now();

        try {
            if (this.bufferCache.has(task.trackUrl)) {
                task.status = 'completed';
                task.progress = 100;
                task.completedAt = Date.now();
                const cachedBuffer = this.bufferCache.get(task.trackUrl)!;
                task.decodedBuffer = cachedBuffer;
                this.completedCount++;
                this.recordHistory(task);
                this.notify();
                task.resolve(cachedBuffer);
                return;
            }

            task.status = 'downloading';
            this.notify();

            const response = await fetch(task.trackUrl, {
                signal: task.controller.signal,
            });

            if (!response || !response.ok) {
                const status = response ? response.status : 0;
                const statusText = response ? response.statusText : 'No response';
                throw new Error(`HTTP Error ${status}: ${statusText}`);
            }

            const contentLengthHeader = response.headers.get('content-length');
            const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
            let arrayBuffer: ArrayBuffer;

            if (response.body && totalBytes > 0) {
                const reader = response.body.getReader();
                let receivedBytes = 0;
                const chunks: Uint8Array[] = [];

                while (true) {
                    if (task.controller.signal.aborted) {
                        await reader.cancel();
                        throw new DOMException('Download aborted by user token', 'AbortError');
                    }

                    const { done, value } = await reader.read();
                    if (done) break;

                    if (value) {
                        chunks.push(value);
                        receivedBytes += value.length;
                        task.progress = Math.min(95, Math.round((receivedBytes / totalBytes) * 90));
                        this.notify();
                    }
                }

                const combined = new Uint8Array(receivedBytes);
                let offset = 0;
                for (const chunk of chunks) {
                    combined.set(chunk, offset);
                    offset += chunk.length;
                }
                arrayBuffer = combined.buffer;
            } else {
                arrayBuffer = await response.arrayBuffer();
                task.progress = 90;
                this.notify();
            }

            if (task.controller.signal.aborted) {
                throw new DOMException('Task aborted prior to decoding', 'AbortError');
            }

            task.status = 'decoding';
            task.progress = 95;
            this.notify();

            const ctx = this.getOrCreateAudioContext();
            const bufferCopy = arrayBuffer.slice(0);
            const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

            if (task.controller.signal.aborted) {
                throw new DOMException('Task aborted during or after decoding', 'AbortError');
            }

            this.bufferCache.set(task.trackUrl, decodedBuffer);

            task.status = 'completed';
            task.progress = 100;
            task.completedAt = Date.now();
            task.decodedBuffer = decodedBuffer;
            this.completedCount++;
            this.recordHistory(task);
            this.notify();

            task.resolve(decodedBuffer);
        } catch (err: unknown) {
            const isAbort =
                (err instanceof DOMException && err.name === 'AbortError') ||
                task.controller.signal.aborted;

            if (isAbort) {
                task.status = 'cancelled';
                task.errorMessage = 'Operation aborted via AbortController.';
                this.cancelledCount++;
                console.info(
                    '%c[AbortController Evidence]%c Task cancelled successfully via AbortSignal token!%c\n' +
                        `• Task ID: ${task.id}\n` +
                        `• Signal Aborted: ${task.controller.signal.aborted}\n` +
                        `• Error Type: ${err instanceof Error ? err.name : 'AbortError'}\n` +
                        `• Reason: ${task.errorMessage}`,
                    'background: #8a2be2; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
                    'color: #00f2ff; font-weight: bold;',
                    'color: #94a3b8;'
                );
            } else {
                task.status = 'error';
                task.errorMessage = err instanceof Error ? err.message : String(err);
                this.failedCount++;
            }
            this.recordHistory(task);
            this.notify();
            task.reject(err);
        } finally {
            this.runningTasks.delete(task);
            this.notify();
            this.scheduleNext();
        }
    }

    public cancelActive(): boolean {
        let anyCancelled = false;
        for (const task of this.runningTasks) {
            task.controller.abort();
            anyCancelled = true;
        }
        return anyCancelled;
    }

    public cancelTask(taskId: string): boolean {
        for (const task of this.runningTasks) {
            if (task.id === taskId) {
                task.controller.abort();
                return true;
            }
        }

        const index = this.queue.findIndex((t) => t.id === taskId);
        if (index !== -1) {
            const [task] = this.queue.splice(index, 1);
            task.controller.abort();
            task.status = 'cancelled';
            task.errorMessage = 'Cancelled before starting.';
            this.cancelledCount++;
            this.recordHistory(task);
            task.reject(new DOMException('Cancelled by user.', 'AbortError'));
            this.notify();
            return true;
        }

        return false;
    }

    public clearQueue(): void {
        this.cancelActive();
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                task.controller.abort();
                task.status = 'cancelled';
                task.errorMessage = 'Queue cleared.';
                this.cancelledCount++;
                this.recordHistory(task);
                task.reject(new DOMException('Queue cleared by user.', 'AbortError'));
            }
        }
        this.notify();
    }

    private getOrCreateAudioContext(): AudioContext {
        if (!this.audioContext) {
            const AudioContextClass =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.audioContext = new AudioContextClass();
        }
        return this.audioContext;
    }

    private recordHistory(task: AudioTask): void {
        this.history.unshift({ ...task });
        if (this.history.length > 30) {
            this.history.pop();
        }
    }

    public getQueue(): readonly AudioTask[] {
        return [...this.queue];
    }

    public getActiveTasks(): readonly AudioTask[] {
        return Array.from(this.runningTasks).map((t) => ({ ...t }));
    }

    public getActiveTask(): AudioTask | null {
        const first = this.runningTasks.values().next().value;
        return first ? { ...first } : null;
    }

    public getHistory(): readonly AudioTask[] {
        return [...this.history];
    }

    public getIsProcessing(): boolean {
        return this.runningTasks.size > 0;
    }

    public getCachedBufferCount(): number {
        return this.bufferCache.size;
    }

    public getTaskCounts(): QueueTaskCounts {
        return {
            pending: this.queue.length,
            active: this.runningTasks.size,
            completed: this.completedCount,
            failed: this.failedCount,
            cancelled: this.cancelledCount,
            total:
                this.queue.length +
                this.runningTasks.size +
                this.completedCount +
                this.failedCount +
                this.cancelledCount,
        };
    }

    public subscribe(subscriber: QueueSubscriber): () => void {
        this.subscribers.add(subscriber);
        subscriber(this.getSnapshot());
        return () => {
            this.subscribers.delete(subscriber);
        };
    }

    private notify(): void {
        const snapshot = this.getSnapshot();
        for (const sub of this.subscribers) {
            try {
                sub(snapshot);
            } catch (e) {
                console.error('Queue notification error', e);
            }
        }
    }
}
