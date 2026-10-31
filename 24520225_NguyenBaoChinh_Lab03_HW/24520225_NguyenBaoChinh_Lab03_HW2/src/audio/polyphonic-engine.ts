import { AudioEngine } from '../audio-engine';
import { midiToFrequency } from '../piano/piano-generator';

export interface Voice {
    midi: number;
    oscillator: OscillatorNode;
    gain: GainNode;
    isReleasing: boolean;
}

export class PolyphonicEngine {
    private voices = new Map<number, Voice>();

    private readonly MAX_VOICES = 8;

    private readonly ATTACK_TIME = 0.02;

    private readonly RELEASE_TIME = 0.12;

    private readonly STEAL_FADE_TIME = 0.005; // 5ms click-free fade for stolen voices

    private voiceCountListener: ((count: number) => void) | null = null;
    private voiceChangeListener: ((activeMidis: number[], stolenMidi: number | null) => void) | null = null;
    private lastStolenMidi: number | null = null;

    constructor(
        private readonly audioEngine: AudioEngine
    ) { }

    public subscribeVoiceCount(
        listener: (count: number) => void
    ): () => void {
        this.voiceCountListener = listener;
        listener(this.voices.size);

        return () => {
            if (this.voiceCountListener === listener) {
                this.voiceCountListener = null;
            }
        };
    }

    public subscribeVoices(
        listener: (activeMidis: number[], stolenMidi: number | null) => void
    ): () => void {
        this.voiceChangeListener = listener;
        listener(this.getActiveMidiNotes(), this.lastStolenMidi);

        return () => {
            if (this.voiceChangeListener === listener) {
                this.voiceChangeListener = null;
            }
        };
    }

    public getLastStolenMidi(): number | null {
        return this.lastStolenMidi;
    }

    private notifyVoiceCount(): void {
        this.voiceCountListener?.(this.voices.size);
        this.voiceChangeListener?.(this.getActiveMidiNotes(), this.lastStolenMidi);
    }

    /**
     * Steals the oldest active voice using Map insertion order (FIFO).
     * Applies a rapid 5ms release ramp to prevent audio clicks, removes the voice from
     * the active registry immediately, and terminates the oscillator.
     */
    private stealOldestVoice(): void {
        // Map.prototype.entries() yields keys/values in chronological insertion order
        const oldestEntry = this.voices.entries().next();

        if (oldestEntry.done || !oldestEntry.value) {
            return;
        }

        const [oldestMidi, oldestVoice] = oldestEntry.value;

        console.log(`[FIFO] Stealing oldest voice: MIDI ${oldestMidi}`);
        this.lastStolenMidi = oldestMidi;

        // Mark as releasing to prevent any subsequent noteOff interference
        oldestVoice.isReleasing = true;

        // Eagerly remove from registry to guarantee capacity for the incoming voice
        this.voices.delete(oldestMidi);

        const ctx = this.audioEngine.ensureContext();
        const now = ctx.currentTime;

        try {
            // Apply rapid linear/exponential fade to prevent DC offset pop/click
            oldestVoice.gain.gain.cancelScheduledValues(now);
            oldestVoice.gain.gain.setValueAtTime(
                Math.max(oldestVoice.gain.gain.value, 0.0001),
                now
            );
            oldestVoice.gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + this.STEAL_FADE_TIME
            );

            // Schedule immediate stop after the brief fade
            oldestVoice.oscillator.stop(now + this.STEAL_FADE_TIME + 0.001);
        } catch {
            // Defensive cleanup in case node already terminated
            try {
                oldestVoice.oscillator.disconnect();
                oldestVoice.gain.disconnect();
            } catch {
                // Ignore disconnect exceptions
            }
        }
    }

    /**
     * Start a note using Web Audio OscillatorNode.
     * When all 8 voices are active, FIFO voice stealing gracefully replaces the oldest voice.
     */
    public noteOn(midi: number): boolean {
        // Prevent invalid MIDI values
        if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
            return false;
        }

        // Prevent duplicate note-on events for already sounding keys
        if (this.voices.has(midi)) {
            return false;
        }

        // M4: FIFO Voice Stealing when capacity is reached (8 voices)
        if (this.voices.size >= this.MAX_VOICES) {
            this.stealOldestVoice();
        }

        // Resume AudioContext following user interaction
        const ctx = this.audioEngine.ensureContext();
        const analyser = this.audioEngine.getAnalyserNode();

        if (!analyser) {
            return false;
        }

        const now = ctx.currentTime;

        // Create oscillator
        const oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(
            midiToFrequency(midi),
            now
        );

        // Create per-voice GainNode
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
            0.18,
            now + this.ATTACK_TIME
        );

        // Audio graph: Oscillator -> Voice Gain -> Analyser -> Master Gain -> Destination
        oscillator.connect(gain);
        gain.connect(analyser);

        const voice: Voice = {
            midi,
            oscillator,
            gain,
            isReleasing: false
        };

        this.voices.set(midi, voice);
        this.notifyVoiceCount();

        // Explicit lifecycle cleanup with object identity guard to prevent stale onended bugs
        oscillator.onended = () => {
            try {
                oscillator.disconnect();
            } catch {
                // Ignore disconnect errors
            }
            try {
                gain.disconnect();
            } catch {
                // Ignore disconnect errors
            }

            // CRITICAL IDENTITY GUARD: Only delete and notify if the registry entry
            // still points to this exact voice instance (prevents old voice onended from
            // deleting a newly re-triggered voice of the same MIDI number).
            if (this.voices.get(midi) === voice) {
                this.voices.delete(midi);
                this.notifyVoiceCount();
            }
        };

        oscillator.start(now);

        console.log(
            `[Polyphony] NOTE ON: MIDI ${midi}`,
            `Frequency: ${midiToFrequency(midi).toFixed(2)} Hz`,
            `Active voices: ${this.voices.size}/${this.MAX_VOICES}`
        );

        return true;
    }

    /**
     * Release an active note with standard ADSR release envelope.
     */
    public noteOff(midi: number): boolean {
        const voice = this.voices.get(midi);

        if (!voice || voice.isReleasing) {
            return false;
        }

        const ctx = this.audioEngine.ensureContext();
        const now = ctx.currentTime;

        voice.isReleasing = true;

        // Smooth release envelope
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(
            Math.max(voice.gain.gain.value, 0.0001),
            now
        );
        voice.gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + this.RELEASE_TIME
        );

        // Oscillator is stopped after the release envelope completes
        voice.oscillator.stop(now + this.RELEASE_TIME + 0.01);

        console.log(
            `[Polyphony] NOTE OFF: MIDI ${midi}`,
            `Releasing voice...`
        );

        return true;
    }

    /**
     * Number of currently registered voices (max 8).
     */
    public getActiveVoiceCount(): number {
        return this.voices.size;
    }

    public getMaxVoices(): number {
        return this.MAX_VOICES;
    }

    /**
     * Returns an array of active MIDI numbers in chronological FIFO order.
     */
    public getActiveMidiNotes(): number[] {
        return Array.from(this.voices.keys());
    }

    /**
     * Cleanup all oscillator and gain nodes.
     */
    public dispose(): void {
        for (const voice of this.voices.values()) {
            voice.oscillator.onended = null;

            try {
                voice.oscillator.stop();
            } catch {
                // Oscillator may already have stopped
            }

            try {
                voice.oscillator.disconnect();
                voice.gain.disconnect();
            } catch {
                // Ignore disconnect errors
            }
        }

        this.voices.clear();
        this.lastStolenMidi = null;
        this.notifyVoiceCount();

        console.log('[Polyphony] All voices cleaned up.');
    }
}
