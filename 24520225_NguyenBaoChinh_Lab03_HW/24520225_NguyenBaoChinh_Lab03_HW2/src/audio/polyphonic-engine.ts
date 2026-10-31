import { AudioEngine } from '../audio-engine';
import { midiToFrequency } from '../piano/piano-generator';

interface Voice {
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

    constructor(
        private readonly audioEngine: AudioEngine
    ) { }
    private voiceCountListener:
        ((count: number) => void) | null = null;

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

    private notifyVoiceCount(): void {
        this.voiceCountListener?.(this.voices.size);
    }
    /**
     * Start a note using Web Audio OscillatorNode.
     */
    public noteOn(midi: number): boolean {
        // Prevent invalid MIDI values.
        if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
            return false;
        }

        // Prevent duplicate note-on events.
        if (this.voices.has(midi)) {
            return false;
        }

        // M3: Reject additional notes when capacity is full.
        // M4 will replace this behavior with FIFO voice stealing.
        if (this.voices.size >= this.MAX_VOICES) {
            console.warn(
                '[Polyphony] Maximum 8 voices reached.',
                'Note rejected:',
                midi
            );

            return false;
        }

        // Resume AudioContext following user interaction.
        const ctx = this.audioEngine.ensureContext();

        const analyser = this.audioEngine.getAnalyserNode();

        if (!analyser) {
            return false;
        }

        const now = ctx.currentTime;

        // Create oscillator.
        const oscillator = ctx.createOscillator();

        oscillator.type = 'triangle';

        oscillator.frequency.setValueAtTime(
            midiToFrequency(midi),
            now
        );

        // Create per-voice GainNode.
        const gain = ctx.createGain();

        gain.gain.setValueAtTime(0.0001, now);

        gain.gain.exponentialRampToValueAtTime(
            0.18,
            now + this.ATTACK_TIME
        );

        // Audio graph:
        // Oscillator -> Voice Gain -> Analyser -> Master Gain -> Destination
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
        // Explicit lifecycle cleanup.
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
            if (this.voices.get(midi) === voice) {
                this.voices.delete(midi);
                this.notifyVoiceCount();
            }
            // Do not accidentally remove a newer voice.
            if (this.voices.get(midi) === voice) {
                this.voices.delete(midi);
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
     * Release an active note.
     */
    public noteOff(midi: number): boolean {
        const voice = this.voices.get(midi);

        if (!voice || voice.isReleasing) {
            return false;
        }

        const ctx = this.audioEngine.ensureContext();

        const now = ctx.currentTime;

        voice.isReleasing = true;

        // Smooth release envelope.
        voice.gain.gain.cancelScheduledValues(now);

        voice.gain.gain.setValueAtTime(
            Math.max(voice.gain.gain.value, 0.0001),
            now
        );

        voice.gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + this.RELEASE_TIME
        );

        // Oscillator is stopped after the release envelope.
        voice.oscillator.stop(now + this.RELEASE_TIME + 0.01);

        console.log(
            `[Polyphony] NOTE OFF: MIDI ${midi}`,
            `Releasing voice...`
        );

        return true;
    }

    /**
     * Number of currently registered voices,
     * including voices in their release phase.
     */
    public getActiveVoiceCount(): number {
        return this.voices.size;
    }

    public getMaxVoices(): number {
        return this.MAX_VOICES;
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
                // Oscillator may already have stopped.
            }

            voice.oscillator.disconnect();
            voice.gain.disconnect();
        }

        this.voices.clear();
        this.notifyVoiceCount();

        console.log('[Polyphony] All voices cleaned up.');
    }
}