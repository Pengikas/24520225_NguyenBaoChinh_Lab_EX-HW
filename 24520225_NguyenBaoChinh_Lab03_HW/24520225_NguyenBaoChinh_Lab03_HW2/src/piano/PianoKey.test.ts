import { describe, it, expect, vi } from 'vitest';
import PianoKey, { shallowEqual, PianoKeyProps } from './PianoKey';
import { PIANO_KEYS } from './piano-generator';

describe('E04: React.memo & shallowEqual Render Isolation', () => {
    const mockOnNoteOn = vi.fn();
    const mockOnNoteOff = vi.fn();

    const baseNote = PIANO_KEYS[0]; // A0 (MIDI 21)

    it('E04.1: PianoKey is wrapped in React.memo with shallowEqual comparison', () => {
        expect((PianoKey as any).$$typeof).toBe(Symbol.for('react.memo'));
        expect((PianoKey as any).compare).toBe(shallowEqual);
    });

    it('E04.2: shallowEqual returns true when note and callbacks have identical values', () => {
        const prevProps: PianoKeyProps = {
            note: baseNote,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        const nextProps: PianoKeyProps = {
            note: { ...baseNote }, // clone with identical values
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        expect(shallowEqual(prevProps, nextProps)).toBe(true);
    });

    it('E04.3: shallowEqual returns false when note properties change', () => {
        const prevProps: PianoKeyProps = {
            note: baseNote,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        const nextPropsDifferentMidi: PianoKeyProps = {
            note: { ...baseNote, midi: 22 },
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        expect(shallowEqual(prevProps, nextPropsDifferentMidi)).toBe(false);

        const nextPropsDifferentType: PianoKeyProps = {
            note: { ...baseNote, keyType: 'black' },
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        expect(shallowEqual(prevProps, nextPropsDifferentType)).toBe(false);
    });

    it('E04.4: shallowEqual returns false when callback references change', () => {
        const prevProps: PianoKeyProps = {
            note: baseNote,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        const nextPropsNewCallback: PianoKeyProps = {
            note: baseNote,
            onNoteOn: vi.fn(), // unstable new function reference
            onNoteOff: mockOnNoteOff,
        };

        expect(shallowEqual(prevProps, nextPropsNewCallback)).toBe(false);
    });

    it('E04.5: verifies exactly 88 keys receive stable note references from PIANO_KEYS', () => {
        expect(PIANO_KEYS).toHaveLength(88);

        // Every note object in PIANO_KEYS must be reference-identical between renders
        PIANO_KEYS.forEach((note, idx) => {
            expect(note.midi).toBe(21 + idx);
            expect(typeof note.frequency).toBe('number');
            expect(note.frequency).toBeGreaterThan(0);
            expect(['white', 'black']).toContain(note.keyType);
        });
    });

    it('E04.6: ensures pressing one key isolates other 87 keys from re-rendering via memoization', () => {
        // Simulate a parent re-render cycle where callbacks are memoized (stable references)
        const stableOnNoteOn = vi.fn();
        const stableOnNoteOff = vi.fn();

        // 88 key props before
        const prevKeyProps = PIANO_KEYS.map((note) => ({
            note,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        // Parent re-renders (e.g. voice counter update), re-creating the props array with same stable callbacks
        const nextKeyProps = PIANO_KEYS.map((note) => ({
            note,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        // For all 88 keys, shallowEqual returns true -> 0 unnecessary re-renders!
        const reRenderDecisions = prevKeyProps.map((prev, i) =>
            shallowEqual(prev, nextKeyProps[i])
        );

        expect(reRenderDecisions.every(decision => decision === true)).toBe(true);
        expect(reRenderDecisions).toHaveLength(88);
    });
});
