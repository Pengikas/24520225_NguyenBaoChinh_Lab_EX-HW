import { describe, it, expect } from 'vitest';
import {
    PIANO_KEYS,
    generate88Keys,
    midiToFrequency,
    midiToNoteName
} from './piano-generator';

describe('Requirement B: Algorithmic 88-Key Piano Generation (A0 to C8)', () => {
    it('generates exactly 88 total keys', () => {
        expect(PIANO_KEYS).toHaveLength(88);
        expect(generate88Keys()).toHaveLength(88);
    });

    it('generates exactly 52 white keys (isBlack === false)', () => {
        const whiteKeys = PIANO_KEYS.filter((key) => !key.isBlack);
        expect(whiteKeys).toHaveLength(52);
        expect(whiteKeys.every((key) => key.keyType === 'white')).toBe(true);
    });

    it('generates exactly 36 black keys (isBlack === true)', () => {
        const blackKeys = PIANO_KEYS.filter((key) => key.isBlack);
        expect(blackKeys).toHaveLength(36);
        expect(blackKeys.every((key) => key.keyType === 'black')).toBe(true);
    });

    it('starts at MIDI 21 (A0) and ends at MIDI 108 (C8)', () => {
        expect(PIANO_KEYS[0].midi).toBe(21);
        expect(PIANO_KEYS[0].noteName).toBe('A0');
        expect(PIANO_KEYS[0].isBlack).toBe(false);

        expect(PIANO_KEYS[87].midi).toBe(108);
        expect(PIANO_KEYS[87].noteName).toBe('C8');
        expect(PIANO_KEYS[87].isBlack).toBe(false);
    });

    it('calculates exact Equal Temperament frequencies for A0 (27.50 Hz), A4 (440.00 Hz), and C8 (4186.01 Hz)', () => {
        // A0 = MIDI 21 -> 27.50 Hz
        expect(midiToFrequency(21)).toBeCloseTo(27.5, 2);
        expect(PIANO_KEYS[0].frequency).toBeCloseTo(27.5, 2);

        // C4 = MIDI 60 -> 261.63 Hz
        expect(midiToFrequency(60)).toBeCloseTo(261.63, 2);
        expect(midiToNoteName(60)).toBe('C4');

        // A4 = MIDI 69 -> 440.00 Hz
        expect(midiToFrequency(69)).toBe(440);
        const a4Key = PIANO_KEYS.find((k) => k.midi === 69);
        expect(a4Key?.noteName).toBe('A4');
        expect(a4Key?.frequency).toBe(440);

        // C8 = MIDI 108 -> 4186.01 Hz
        expect(midiToFrequency(108)).toBeCloseTo(4186.01, 2);
        expect(PIANO_KEYS[87].frequency).toBeCloseTo(4186.01, 2);
    });

    it('assigns unique sequential MIDI numbers from 21 to 108 and required key contract fields', () => {
        const uniqueMidis = new Set(PIANO_KEYS.map((k) => k.midi));
        expect(uniqueMidis.size).toBe(88);

        PIANO_KEYS.forEach((key, index) => {
            expect(key.midi).toBe(21 + index);
            expect(typeof key.noteName).toBe('string');
            expect(typeof key.isBlack).toBe('boolean');
            expect(typeof key.frequency).toBe('number');
            expect(key.frequency).toBeCloseTo(440 * Math.pow(2, (key.midi - 69) / 12), 6);
        });
    });
});
