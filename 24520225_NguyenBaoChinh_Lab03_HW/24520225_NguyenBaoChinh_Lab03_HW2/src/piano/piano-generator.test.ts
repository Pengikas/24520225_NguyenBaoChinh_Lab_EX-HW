import { describe, it, expect } from 'vitest';
import {
    PIANO_KEYS,
    midiToFrequency
} from './piano-generator';

describe('88-Key Piano Generator', () => {
    it('generates exactly 88 keys', () => {
        expect(PIANO_KEYS).toHaveLength(88);
    });

    it('generates 52 white keys', () => {
        const whiteKeys = PIANO_KEYS.filter(
            key => key.keyType === 'white'
        );

        expect(whiteKeys).toHaveLength(52);
    });

    it('generates 36 black keys', () => {
        const blackKeys = PIANO_KEYS.filter(
            key => key.keyType === 'black'
        );

        expect(blackKeys).toHaveLength(36);
    });

    it('starts at A0 and ends at C8', () => {
        expect(PIANO_KEYS[0].noteName).toBe('A0');
        expect(PIANO_KEYS[87].noteName).toBe('C8');
    });

    it('calculates A4 as 440 Hz', () => {
        expect(midiToFrequency(69)).toBe(440);
    });
});
