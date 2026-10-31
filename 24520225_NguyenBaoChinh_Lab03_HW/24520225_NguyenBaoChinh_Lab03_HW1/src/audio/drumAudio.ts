
import type { DrumPadDefinition } from '../data/drumPads';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as typeof window & {
                webkitAudioContext?: typeof AudioContext;
            }).webkitAudioContext;

        if (!AudioContextClass) return null;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        return audioContext;
    } catch {
        return null;
    }
}

export async function playDrumSound(
    pad: DrumPadDefinition
): Promise<boolean> {
    const context = getAudioContext();

    if (!context) return false;

    try {
        if (context.state === 'suspended') {
            await context.resume();
        }

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        const now = context.currentTime;

        const profiles = {
            kick: {
                frequency: 120,
                endFrequency: 42,
                duration: 0.35,
                waveform: 'sine' as OscillatorType,
            },
            snare: {
                frequency: 220,
                endFrequency: 130,
                duration: 0.16,
                waveform: 'triangle' as OscillatorType,
            },
            hihat: {
                frequency: 900,
                endFrequency: 500,
                duration: 0.08,
                waveform: 'square' as OscillatorType,
            },
            tom: {
                frequency: 170,
                endFrequency: 85,
                duration: 0.24,
                waveform: 'triangle' as OscillatorType,
            },
            clap: {
                frequency: 480,
                endFrequency: 240,
                duration: 0.12,
                waveform: 'sawtooth' as OscillatorType,
            },
        };

        const profile = profiles[pad.soundType];

        oscillator.type = profile.waveform;

        oscillator.frequency.setValueAtTime(
            profile.frequency,
            now
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            profile.endFrequency,
            now + profile.duration
        );

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(
            0.25,
            now + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + profile.duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(now);
        oscillator.stop(now + profile.duration + 0.02);

        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
        };

        return true;
    } catch {
        return false;
    }
}

export function closeAudioContext(): void {
    if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close();
        audioContext = null;
    }
}
