// src/audio-queue-controller.ts
/**
 * HW 2: Concurrent FIFO Audio Visualizer Queue Engine
 * Advanced async concurrency controller with AbortSignal cancellation tokens,
 * granular stream progress calculation, and AudioBuffer caching.
 */

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

export type QueueSubscriber = () => void;

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

    constructor(audioContext?: AudioContext, maxConcurrency = 1) {
        if (audioContext) {
            this.audioContext = audioContext;
        }
        this.maxConcurrency = Math.max(1, maxConcurrency);
    }

    public setAudioContext(ctx: AudioContext): void {
        this.audioContext = ctx;
    }

    public setMaxConcurrency(limit: number): void {
        this.maxConcurrency = Math.max(1, limit);
        this.scheduleNext();
    }

    public getMaxConcurrency(): number {
        return this.maxConcurrency;
    }

    /**
     * Enqueue a track URL for FIFO downloading and decoding.
     * Complies with the HW 2 specification contract.
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

            // Check if task was aborted while waiting in pending queue
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
            // Check cache first for instant zero-latency replay
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

            // Step 1: Download track with AbortSignal cancellation token
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

            // Stream download if body reader is available to provide granular progress
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

                // Concatenate chunks into a single ArrayBuffer
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

            // Check cancellation before decoding boundary
            if (task.controller.signal.aborted) {
                throw new DOMException('Task aborted prior to decoding', 'AbortError');
            }

            // Step 2: Decode Audio Buffer with Web Audio API
            task.status = 'decoding';
            task.progress = 95;
            this.notify();

            const ctx = this.getOrCreateAudioContext();
            // decodeAudioData may detach the ArrayBuffer, so clone if reuse is needed
            const bufferCopy = arrayBuffer.slice(0);
            const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

            // Check cancellation after decoding boundary
            if (task.controller.signal.aborted) {
                throw new DOMException('Task aborted during or after decoding', 'AbortError');
            }

            // Cache for instant reuse
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
            const isAbort = (err instanceof DOMException && err.name === 'AbortError') ||
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

    /**
     * Cancel all active tasks currently downloading or decoding.
     */
    public cancelActive(): boolean {
        let anyCancelled = false;
        for (const task of this.runningTasks) {
            task.controller.abort();
            anyCancelled = true;
        }
        return anyCancelled;
    }

    /**
     * Cancel a specific task by ID (either active or pending in queue).
     */
    public cancelTask(taskId: string): boolean {
        // Check running tasks
        for (const task of this.runningTasks) {
            if (task.id === taskId) {
                task.controller.abort();
                return true;
            }
        }

        // Check pending queue
        const index = this.queue.findIndex(t => t.id === taskId);
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

    /**
     * Abort all queued and active tasks.
     */
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
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        return Array.from(this.runningTasks).map(t => ({ ...t }));
    }

    /**
     * Backward-compatible helper returning the primary active task.
     */
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
            total: this.queue.length + this.runningTasks.size + this.completedCount + this.failedCount + this.cancelledCount,
        };
    }

    public subscribe(subscriber: QueueSubscriber): () => void {
        this.subscribers.add(subscriber);
        return () => {
            this.subscribers.delete(subscriber);
        };
    }

    private notify(): void {
        for (const sub of this.subscribers) {
            try {
                sub();
            } catch (e) {
                console.error('Queue notification error', e);
            }
        }
    }
}
