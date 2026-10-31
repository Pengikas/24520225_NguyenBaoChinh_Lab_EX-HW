// src/audio-engine.ts
/**
 * HW 2: Web Audio API Engine
 * Integration with Web Audio AnalyserNode (FFT 256/512 bins)
 * Explicit memory safety & lifecycle cleanup of AudioBufferSourceNodes.
 */

export type FFTSize = 256 | 512;

export interface AudioEngineMetrics {
    nodesCreated: number;
    nodesCleaned: number;
    activeSourceNode: boolean;
    contextState: AudioContextState;
    sampleRate: number;
    currentTime: number;
    duration: number;
    fftSize: FFTSize;
    frequencyBinCount: number;
}

export type PlaybackState = 'stopped' | 'playing' | 'paused' | 'loading';

export type EngineEventCallback = () => void;

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNode: GainNode | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentBuffer: AudioBuffer | null = null;

    private playbackState: PlaybackState = 'stopped';
    private startTime = 0;
    private pauseOffset = 0;
    private volume = 0.8;
    private isMuted = false;
    private currentFftSize: FFTSize = 256;

    // Memory Safety telemetry counters
    private totalNodesCreated = 0;
    private totalNodesCleaned = 0;

    private listeners = new Set<EngineEventCallback>();

    constructor(initialFftSize: FFTSize = 256) {
        this.currentFftSize = initialFftSize;
    }

    /**
     * Initializes or resumes the AudioContext on user interaction.
     * Complies with browser Autoplay policies.
     */
    public ensureContext(): AudioContext {
        if (!this.ctx || this.ctx.state === 'closed') {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioContextClass();

            // Setup AnalyserNode
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = this.currentFftSize;
            this.analyser.smoothingTimeConstant = 0.82;

            // Setup GainNode
            this.gainNode = this.ctx.createGain();
            this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

            // Connect graph: Analyser -> Gain -> Destination
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch((err) => {
                console.warn('AudioContext resume was prevented:', err);
            });
        }

        return this.ctx;
    }

    public getAudioContext(): AudioContext {
        return this.ensureContext();
    }

    public getAnalyserNode(): AnalyserNode | null {
        if (!this.analyser) {
            this.ensureContext();
        }
        return this.analyser;
    }

    /**
     * Update FFT size (256 or 512 bins) as specified in criteria.
     */
    public setFFTSize(fftSize: FFTSize): void {
        this.currentFftSize = fftSize;
        if (this.analyser) {
            this.analyser.fftSize = fftSize;
        }
        this.notify();
    }

    public getFFTSize(): FFTSize {
        return this.currentFftSize;
    }

    public getFrequencyBinCount(): number {
        return this.analyser ? this.analyser.frequencyBinCount : this.currentFftSize / 2;
    }

    /**
     * Memory Safety: Explicit cleanup of AudioBufferSourceNodes.
     * Stops, disconnects, removes event handlers and frees node reference.
     */
    public cleanupCurrentSource(): void {
        if (this.currentSource) {
            try {
                this.currentSource.onended = null;
                this.currentSource.stop();
            } catch {
                // Ignore if already stopped
            }
            try {
                this.currentSource.disconnect();
            } catch {
                // Ignore if already disconnected
            }
            this.currentSource = null;
            this.totalNodesCleaned++;
            this.notify();
        }
    }

    /**
     * Play an AudioBuffer with explicit lifecycle management.
     */
    public playBuffer(buffer: AudioBuffer, startOffset = 0): void {
        const ctx = this.ensureContext();

        // 1. Explicitly clean up any previous AudioBufferSourceNode
        this.cleanupCurrentSource();

        this.currentBuffer = buffer;

        // Bounded start offset
        const safeOffset = Math.max(0, Math.min(startOffset, buffer.duration));
        this.pauseOffset = safeOffset;

        // 2. Allocate fresh AudioBufferSourceNode (they are single-use per Web Audio spec)
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        this.totalNodesCreated++;

        // Connect source to analyser
        if (this.analyser) {
            source.connect(this.analyser);
        }

        this.startTime = ctx.currentTime - safeOffset;
        this.currentSource = source;
        this.playbackState = 'playing';

        source.onended = () => {
            // Only handle naturally finished playback if this source is still current
            if (this.currentSource === source) {
                this.cleanupCurrentSource();
                this.playbackState = 'stopped';
                this.pauseOffset = 0;
                this.notify();
            }
        };

        source.start(0, safeOffset);
        this.notify();
    }

    /**
     * Pause playback and record offset for resuming.
     */
    public pause(): void {
        if (this.playbackState !== 'playing') return;

        if (this.ctx) {
            this.pauseOffset = this.getCurrentPlaybackTime();
        }
        this.cleanupCurrentSource();
        this.playbackState = 'paused';
        this.notify();
    }

    /**
     * Resume from current paused offset.
     */
    public resume(): void {
        if (this.playbackState === 'paused' && this.currentBuffer) {
            this.playBuffer(this.currentBuffer, this.pauseOffset);
        }
    }

    /**
     * Stop playback, reset offsets, and cleanly dispose audio nodes.
     */
    public stop(): void {
        this.cleanupCurrentSource();
        this.pauseOffset = 0;
        this.playbackState = 'stopped';
        this.notify();
    }

    /**
     * Seek to a specific timestamp in seconds.
     */
    public seek(timeSeconds: number): void {
        if (!this.currentBuffer) return;
        const target = Math.max(0, Math.min(timeSeconds, this.currentBuffer.duration));
        this.pauseOffset = target;

        if (this.playbackState === 'playing') {
            this.playBuffer(this.currentBuffer, target);
        } else {
            this.notify();
        }
    }

    public setVolume(vol: number): void {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        }
        this.notify();
    }

    public getVolume(): number {
        return this.volume;
    }

    public toggleMute(): void {
        this.isMuted = !this.isMuted;
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        }
        this.notify();
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }

    public getPlaybackState(): PlaybackState {
        return this.playbackState;
    }

    public getCurrentPlaybackTime(): number {
        if (this.playbackState === 'playing' && this.ctx && this.currentBuffer) {
            const current = this.ctx.currentTime - this.startTime;
            return Math.min(current, this.currentBuffer.duration);
        }
        return this.pauseOffset;
    }

    public getDuration(): number {
        return this.currentBuffer ? this.currentBuffer.duration : 0;
    }

    public getCurrentBuffer(): AudioBuffer | null {
        return this.currentBuffer;
    }

    /**
     * Returns real-time memory and audio metrics for auditing.
     */
    public getMetrics(): AudioEngineMetrics {
        return {
            nodesCreated: this.totalNodesCreated,
            nodesCleaned: this.totalNodesCleaned,
            activeSourceNode: this.currentSource !== null,
            contextState: this.ctx ? this.ctx.state : 'suspended',
            sampleRate: this.ctx ? this.ctx.sampleRate : 44100,
            currentTime: this.getCurrentPlaybackTime(),
            duration: this.getDuration(),
            fftSize: this.currentFftSize,
            frequencyBinCount: this.getFrequencyBinCount(),
        };
    }

    public subscribe(cb: EngineEventCallback): () => void {
        this.listeners.add(cb);
        return () => {
            this.listeners.delete(cb);
        };
    }

    private notify(): void {
        for (const cb of this.listeners) {
            try {
                cb();
            } catch (e) {
                console.error('AudioEngine subscriber error', e);
            }
        }
    }

    /**
     * Full teardown of AudioContext and nodes (for component unmount).
     */
    public dispose(): void {
        this.cleanupCurrentSource();
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.close().catch(() => { });
            this.ctx = null;
        }
        this.currentBuffer = null;
        this.listeners.clear();
    }
}
