import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioTaskQueue } from './audio-queue-controller';

describe('M5: Concurrent FIFO AudioTaskQueue', () => {
    let mockAudioContext: any;
    let mockBuffer: any;

    beforeEach(() => {
        mockBuffer = {
            duration: 5.0,
            numberOfChannels: 2,
            sampleRate: 44100,
        };

        mockAudioContext = {
            decodeAudioData: vi.fn((_buf: ArrayBuffer) => Promise.resolve(mockBuffer)),
        };

        // Mock global fetch
        (globalThis as any).fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            const signal = init?.signal;
            if (signal?.aborted) {
                return Promise.reject(new DOMException('Aborted before fetch', 'AbortError'));
            }

            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    resolve({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: new Map([['content-length', '1024']]),
                        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
                        body: null,
                    });
                }, 20);

                if (signal) {
                    signal.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new DOMException('The operation was aborted.', 'AbortError'));
                    });
                }
            });
        });
    });

    it('M5.1: processes tasks in strict FIFO order', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);
        const executionOrder: string[] = [];

        // Track order via fetch
        ((globalThis as any).fetch as any).mockImplementation((url: string) => {
            executionOrder.push(url);
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: new Map(),
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
                body: null,
            });
        });

        const pA = queue.enqueue('https://example.com/track-A.mp3', 'Track A');
        const pB = queue.enqueue('https://example.com/track-B.mp3', 'Track B');
        const pC = queue.enqueue('https://example.com/track-C.mp3', 'Track C');

        await Promise.all([pA, pB, pC]);

        expect(executionOrder).toEqual([
            'https://example.com/track-A.mp3',
            'https://example.com/track-B.mp3',
            'https://example.com/track-C.mp3',
        ]);
        expect(queue.getTaskCounts().completed).toBe(3);
        expect(queue.getTaskCounts().pending).toBe(0);
        expect(queue.getTaskCounts().active).toBe(0);
    });

    it('M5.2: respects configured concurrency limit', async () => {
        // Concurrency limit of 2
        const queue = new AudioTaskQueue(mockAudioContext, 2);
        let activeConcurrent = 0;
        let maxObservedConcurrent = 0;

        ((globalThis as any).fetch as any).mockImplementation(() => {
            activeConcurrent++;
            maxObservedConcurrent = Math.max(maxObservedConcurrent, activeConcurrent);
            return new Promise((resolve) => {
                setTimeout(() => {
                    activeConcurrent--;
                    resolve({
                        ok: true,
                        status: 200,
                        headers: new Map(),
                        arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
                        body: null,
                    });
                }, 30);
            });
        });

        const tasks = [
            queue.enqueue('url-1'),
            queue.enqueue('url-2'),
            queue.enqueue('url-3'),
            queue.enqueue('url-4'),
        ];

        await Promise.all(tasks);

        expect(maxObservedConcurrent).toBeLessThanOrEqual(2);
        expect(queue.getTaskCounts().completed).toBe(4);
    });

    it('M5.3: cancels a pending task in queue before execution starts', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);

        // Block queue with a slow task
        ((globalThis as any).fetch as any).mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => {
            resolve({
                ok: true,
                status: 200,
                headers: new Map(),
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
                body: null,
            });
        }, 50)));

        const p1 = queue.enqueue('slow-task');
        const p2 = queue.enqueue('cancel-me-task');

        const pendingQueue = queue.getQueue();
        expect(pendingQueue.length).toBe(1);
        const task2Id = pendingQueue[0].id;

        // Cancel task 2 while pending
        const cancelled = queue.cancelTask(task2Id);
        expect(cancelled).toBe(true);

        await expect(p2).rejects.toThrow('Cancelled by user.');
        expect(queue.getTaskCounts().cancelled).toBe(1);

        await p1;
    });

    it('M5.4: cancels a running task mid-fetch using AbortController token', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);

        const p = queue.enqueue('abort-target-url', 'Abort Target');
        expect(queue.getIsProcessing()).toBe(true);

        // Cancel running task
        const cancelled = queue.cancelActive();
        expect(cancelled).toBe(true);

        let thrownError: any = null;
        try {
            await p;
        } catch (err) {
            thrownError = err;
        }
        expect(thrownError).toBeDefined();
        expect(thrownError.name).toBe('AbortError');
        expect(queue.getTaskCounts().cancelled).toBe(1);
    });

    it('M5.5: aborted tasks do not start playback or cache decoded buffer', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);
        let playbackCalled = false;

        const p = queue.enqueue('abort-playback-url', 'Playback Abort Test')
            .then(() => {
                playbackCalled = true;
            })
            .catch((err) => {
                expect(err.name).toBe('AbortError');
            });

        queue.cancelActive();
        await p;

        expect(playbackCalled).toBe(false);
    });

    it('M5.6: a failed task does not halt the queue; subsequent tasks complete', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);

        ((globalThis as any).fetch as any)
            .mockRejectedValueOnce(new Error('Network 500 Server Error'))
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Map(),
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
                body: null,
            });

        const p1 = queue.enqueue('bad-url', 'Failing Task');
        const p2 = queue.enqueue('good-url', 'Succeeding Task');

        await expect(p1).rejects.toThrow('Network 500 Server Error');
        const buf2 = await p2;

        expect(buf2).toBe(mockBuffer);
        expect(queue.getTaskCounts().failed).toBe(1);
        expect(queue.getTaskCounts().completed).toBe(1);
    });

    it('M5.7: buffer caching avoids redundant network requests', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);
        const fetchMock = (globalThis as any).fetch as any;

        const buf1 = await queue.enqueue('https://example.com/cache-test.mp3');
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Second enqueue of identical URL should hit cache
        const buf2 = await queue.enqueue('https://example.com/cache-test.mp3');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(buf1).toBe(buf2);
    });

    it('M5.8: clearQueue aborts all active and pending tasks cleanly', async () => {
        const queue = new AudioTaskQueue(mockAudioContext, 1);

        ((globalThis as any).fetch as any).mockImplementation((_url: string, init?: RequestInit) => {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    resolve({
                        ok: true,
                        status: 200,
                        headers: new Map(),
                        arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
                        body: null,
                    });
                }, 100);

                init?.signal?.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted by user', 'AbortError'));
                });
            });
        });

        const p1 = queue.enqueue('q1').catch((err) => err);
        const p2 = queue.enqueue('q2').catch((err) => err);
        const p3 = queue.enqueue('q3').catch((err) => err);

        // Clear queue immediately while task 1 is active and tasks 2 and 3 are pending
        queue.clearQueue();

        const [err1, err2, err3] = await Promise.all([p1, p2, p3]);

        expect(err1.name).toBe('AbortError');
        expect(err2.name).toBe('AbortError');
        expect(err3.name).toBe('AbortError');

        expect(queue.getTaskCounts().cancelled).toBe(3);
        expect(queue.getQueue().length).toBe(0);
        expect(queue.getIsProcessing()).toBe(false);
    });
});
