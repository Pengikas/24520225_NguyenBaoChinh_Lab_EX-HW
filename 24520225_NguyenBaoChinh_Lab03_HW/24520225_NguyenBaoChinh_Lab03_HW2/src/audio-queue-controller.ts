// src/audio-queue-controller.ts
/**
 * HW 2: Concurrent FIFO Audio Visualizer Queue Engine
 * Advanced async concurrency controller with AbortSignal cancellation tokens.
 */

export interface AudioTask {
    id: string;
    trackUrl: string;
    title: string;
    controller: AbortController;
    resolve: (buffer: AudioBuffer) => void;
    reject: (reason: unknown) => void;
    status: 'queued' | 'downloading' | 'decoding' | 'completed' | 'cancelled' | 'error';
    progress: number; // 0 - 100
    errorMessage?: string;
    enqueuedAt: number;
    completedAt?: number;
    decodedBuffer?: AudioBuffer;
}

export type QueueSubscriber = () => void;

export class AudioTaskQueue {
    private queue: AudioTask[] = [];
    private isProcessing = false;
    private activeController: AbortController | null = null;
    private activeTask: AudioTask | null = null;
    private history: AudioTask[] = [];
    private audioContext: AudioContext | null = null;
    private bufferCache = new Map<string, AudioBuffer>();
    private subscribers = new Set<QueueSubscriber>();

    constructor(audioContext?: AudioContext) {
        if (audioContext) {
            this.audioContext = audioContext;
        }
    }

    public setAudioContext(ctx: AudioContext): void {
        this.audioContext = ctx;
    }

    /**
     * Enqueue a track URL for FIFO downloading and decoding.
     * Complies with the HW 2 specification contract.
     */
    async enqueue(trackUrl: string, title?: string): Promise<AudioBuffer> {
        // Concurrency control with AbortSignal cancellation
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
            this.processNext();
        });
    }

    /**
     * Process next audio task in strict FIFO order.
     */
    private async processNext(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        if (!task) return;

        // Check if task was aborted while waiting in queue
        if (task.controller.signal.aborted) {
            task.status = 'cancelled';
            this.recordHistory(task);
            task.reject(new DOMException('Audio task was aborted before processing.', 'AbortError'));
            this.notify();
            this.processNext();
            return;
        }

        this.isProcessing = true;
        this.activeTask = task;
        this.activeController = task.controller;

        try {
            // Check cache first
            if (this.bufferCache.has(task.trackUrl)) {
                task.status = 'completed';
                task.progress = 100;
                task.completedAt = Date.now();
                const cachedBuffer = this.bufferCache.get(task.trackUrl)!;
                task.decodedBuffer = cachedBuffer;
                this.recordHistory(task);
                this.notify();
                task.resolve(cachedBuffer);
                return;
            }

            // Step 1: Download track with AbortSignal
            task.status = 'downloading';
            this.notify();

            const response = await fetch(task.trackUrl, {
                signal: task.controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
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

            // Check cancellation before decoding
            if (task.controller.signal.aborted) {
                throw new DOMException('Task aborted prior to decoding', 'AbortError');
            }

            // Step 2: Decode Audio Buffer with Web Audio API
            task.status = 'decoding';
            task.progress = 95;
            this.notify();

            const ctx = this.getOrCreateAudioContext();
            // Note: decodeAudioData may detach the ArrayBuffer, so clone if re-use is needed
            const bufferCopy = arrayBuffer.slice(0);
            const decodedBuffer = await ctx.decodeAudioData(bufferCopy);

            // Cache for instant reuse
            this.bufferCache.set(task.trackUrl, decodedBuffer);

            task.status = 'completed';
            task.progress = 100;
            task.completedAt = Date.now();
            task.decodedBuffer = decodedBuffer;
            this.recordHistory(task);
            this.notify();

            task.resolve(decodedBuffer);
        } catch (err: unknown) {
            const isAbort = (err instanceof DOMException && err.name === 'AbortError') ||
                task.controller.signal.aborted;

            if (isAbort) {
                task.status = 'cancelled';
                task.errorMessage = 'Operation aborted via AbortController.';
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
            }
            this.recordHistory(task);
            this.notify();
            task.reject(err);
        } finally {
            this.isProcessing = false;
            this.activeController = null;
            this.activeTask = null;
            this.notify();
            // Continue processing remaining queue in FIFO order
            this.processNext();
        }
    }

    /**
     * Cancel the active task currently downloading or decoding.
     */
    public cancelActive(): boolean {
        if (this.activeController) {
            this.activeController.abort();
            return true;
        }
        return false;
    }

    /**
     * Cancel a specific task by ID (either active or pending in queue).
     */
    public cancelTask(taskId: string): boolean {
        if (this.activeTask && this.activeTask.id === taskId) {
            return this.cancelActive();
        }

        const index = this.queue.findIndex(t => t.id === taskId);
        if (index !== -1) {
            const [task] = this.queue.splice(index, 1);
            task.controller.abort();
            task.status = 'cancelled';
            task.errorMessage = 'Cancelled before starting.';
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

    public getActiveTask(): AudioTask | null {
        return this.activeTask ? { ...this.activeTask } : null;
    }

    public getHistory(): readonly AudioTask[] {
        return [...this.history];
    }

    public getIsProcessing(): boolean {
        return this.isProcessing;
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
