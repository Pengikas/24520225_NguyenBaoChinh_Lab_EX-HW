import type { PianoKeyData, KeyType } from './piano-types';

const NOTE_NAMES = [
    'C', 'C#', 'D', 'D#',
    'E', 'F', 'F#', 'G',
    'G#', 'A', 'A#', 'B'
];

const BLACK_KEY_PITCHES = new Set([
    1, 3, 6, 8, 10
]);

export function midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
    const pitch = midi % 12;
    const octave = Math.floor(midi / 12) - 1;

    return `${NOTE_NAMES[pitch]}${octave}`;
}

export function generate88Keys(): PianoKeyData[] {
    const keys: PianoKeyData[] = [];

    // MIDI 21 = A0
    // MIDI 108 = C8
    for (let midi = 21; midi <= 108; midi++) {
        const pitch = midi % 12;

        const keyType: KeyType =
            BLACK_KEY_PITCHES.has(pitch)
                ? 'black'
                : 'white';

        keys.push({
            midi,
            noteName: midiToNoteName(midi),
            frequency: midiToFrequency(midi),
            keyType,
            octave: Math.floor(midi / 12) - 1
        });
    }

    return keys;
}

export const PIANO_KEYS = generate88Keys();