import { midiToFrequency } from '../piano/piano-generator';

/**
 * HW 2 Engine: Polyphonic Voice Pool
 * Strict O(1) Active Voice Tracking via ES6 Map (FIFO insertion order)
 * and Click-Free 40ms ADSR Envelope Release Ramp.
 */
export class PolyphonicSynth {
    constructor(maxVoices = 8) {
        this.ctx = null;
        this.maxVoices = maxVoices;
        this.voices = new Map();

        // Optional integration with AudioEngine for shared AnalyserNode visualization
        this.audioEngine = null;
        if (maxVoices && typeof maxVoices === 'object') {
            this.audioEngine = maxVoices;
            this.maxVoices = 8;
        }

        this.voiceCountListener = null;
        this.voiceChangeListener = null;
        this.lastStolenMidi = null;
    }

    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
        if (audioEngine && typeof audioEngine.ensureContext === 'function') {
            this.ctx = audioEngine.ensureContext();
        }
    }

    subscribeVoiceCount(listener) {
        this.voiceCountListener = listener;
        listener(this.voices.size);

        return () => {
            if (this.voiceCountListener === listener) {
                this.voiceCountListener = null;
            }
        };
    }

    subscribeVoices(listener) {
        this.voiceChangeListener = listener;
        listener(this.getActiveMidiNotes(), this.lastStolenMidi);

        return () => {
            if (this.voiceChangeListener === listener) {
                this.voiceChangeListener = null;
            }
        };
    }

    getLastStolenMidi() {
        return this.lastStolenMidi;
    }

    notifyVoiceCount() {
        if (this.voiceCountListener) {
            this.voiceCountListener(this.voices.size);
        }
        if (this.voiceChangeListener) {
            this.voiceChangeListener(this.getActiveMidiNotes(), this.lastStolenMidi);
        }
    }

    /**
     * Trigger a note with O(1) ES6 Map tracking and FIFO voice stealing when full.
     * @param {number} midi - MIDI note number (0..127)
     * @param {number} [freqHz] - Fundamental frequency in Hz
     * @returns {boolean}
     */
    noteOn(midi, freqHz) {
        if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
            return false;
        }

        // 1. Initialize AudioContext if it does not exist
        if (!this.ctx) {
            if (this.audioEngine && typeof this.audioEngine.ensureContext === 'function') {
                this.ctx = this.audioEngine.ensureContext();
            } else {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
        }

        if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
            this.ctx.resume().catch(() => {});
        }

        // 2. Prevent duplicate active MIDI notes
        if (this.voices.has(midi)) {
            return false;
        }

        // 3, 4, 5. Check maximum voice limit and release oldest MIDI via ES6 Map FIFO order
        if (this.voices.size >= this.maxVoices) {
            const oldestMidi = this.voices.keys().next().value;
            this.lastStolenMidi = oldestMidi;
            this.noteOff(oldestMidi);
        }

        const resolvedFreqHz =
            typeof freqHz === 'number' && Number.isFinite(freqHz)
                ? freqHz
                : midiToFrequency(midi);

        // 6. Create an OscillatorNode
        const osc = this.ctx.createOscillator();
        // 7. Create a GainNode
        const gain = this.ctx.createGain();

        // 8. Set oscillator frequency using freqHz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(resolvedFreqHz, this.ctx.currentTime);

        // 9. Initialize gain with smooth attack
        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.02);

        // 10. Connect oscillator -> gain -> destination (or shared analyser -> destination)
        osc.connect(gain);
        const analyser =
            this.audioEngine && typeof this.audioEngine.getAnalyserNode === 'function'
                ? this.audioEngine.getAnalyserNode()
                : null;
        if (analyser) {
            gain.connect(analyser);
        } else if (this.ctx.destination) {
            gain.connect(this.ctx.destination);
        }

        // Safe cleanup with object identity guard against stale onended callbacks
        osc.onended = () => {
            try {
                osc.disconnect();
            } catch {
                // Ignore disconnect errors
            }
            try {
                gain.disconnect();
            } catch {
                // Ignore disconnect errors
            }

            const currentVoice = this.voices.get(midi);
            if (currentVoice && currentVoice.osc === osc) {
                this.voices.delete(midi);
                this.notifyVoiceCount();
            }
        };

        // 11. Start oscillator
        osc.start(this.ctx.currentTime);

        // 12. Register the voice in ES6 Map preserving FIFO insertion order
        this.voices.set(midi, { osc, gain });
        this.notifyVoiceCount();

        return true;
    }

    /**
     * Release an active voice using a click-free 40ms exponential ADSR ramp before stopping.
     * @param {number} midi - MIDI note number to release
     * @returns {boolean}
     */
    noteOff(midi) {
        const voice = this.voices.get(midi);
        if (!voice || voice.isReleasing) {
            return false;
        }

        voice.isReleasing = true;
        this.voices.delete(midi);

        const ctx = this.ctx || (this.audioEngine ? this.audioEngine.ensureContext() : null);
        if (!ctx) {
            this.notifyVoiceCount();
            return false;
        }

        const { osc, gain } = voice;
        const now = ctx.currentTime;

        try {
            if (gain.gain.cancelScheduledValues) {
                gain.gain.cancelScheduledValues(now);
            }
            const safeStartGain = Math.max(gain.gain.value || 0.18, 0.0001);
            gain.gain.setValueAtTime(safeStartGain, now);

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                ctx.currentTime + 0.04
            );

            osc.stop(ctx.currentTime + 0.04);
        } catch {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch {
                // Ignore disconnect errors
            }
        }

        this.notifyVoiceCount();
        return true;
    }

    getActiveVoiceCount() {
        return this.voices.size;
    }

    getMaxVoices() {
        return this.maxVoices;
    }

    getVoice(midi) {
        return this.voices.get(midi);
    }

    getActiveMidiNotes() {
        return Array.from(this.voices.keys());
    }

    /**
     * Immediately silence and disconnect all active voices (used on Stop Sequence & Unmount).
     */
    dispose() {
        for (const voice of this.voices.values()) {
            const osc = voice.osc || voice.oscillator;
            const gain = voice.gain;

            if (osc) {
                osc.onended = null;
                try {
                    osc.stop();
                } catch {
                    // Already stopped
                }
                try {
                    osc.disconnect();
                } catch {
                    // Ignore disconnect errors
                }
            }

            if (gain) {
                try {
                    gain.disconnect();
                } catch {
                    // Ignore disconnect errors
                }
            }
        }

        this.voices.clear();
        this.lastStolenMidi = null;
        this.notifyVoiceCount();
    }
}

export default PolyphonicSynth;

