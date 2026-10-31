import { describe, it, expect, vi } from 'vitest';
import PianoKey, {
    shallowEqual,
    consumePendingMemoStats,
    type PianoKeyProps
} from './PianoKey';
import { PIANO_KEYS } from './piano-generator';

describe('Requirement A & D: PianoKey Contract & React.memo Render Isolation', () => {
    const mockOnNoteOn = vi.fn();
    const mockOnNoteOff = vi.fn();

    it('E04.1: PianoKey is wrapped in React.memo with shallowEqual comparator', () => {
        expect((PianoKey as any).$$typeof).toBe(Symbol.for('react.memo'));
        expect((PianoKey as any).compare).toBe(shallowEqual);
        expect((PianoKey as any).type.name).toContain('PianoKey');
    });

    it('E04.2: PianoKey renders semantic <button type="button"> with required contract props and pointer handlers', () => {
        const onNoteOn = vi.fn();
        const onNoteOff = vi.fn();

        // Render white key C4 (MIDI 60, isBlack: false, isPressed: false)
        const whiteElement = (PianoKey as any).type({
            midi: 60,
            noteName: 'C4',
            isBlack: false,
            isPressed: false,
            onNoteOn,
            onNoteOff
        });

        expect(whiteElement.type).toBe('button');
        expect(whiteElement.props.type).toBe('button');
        expect(whiteElement.props.className).toBe('key key--white');
        expect(whiteElement.props['aria-pressed']).toBe(false);
        expect(whiteElement.props.children.type).toBe('span');
        expect(whiteElement.props.children.props.children).toBe('C4');

        // Trigger pointer down & up
        whiteElement.props.onPointerDown();
        expect(onNoteOn).toHaveBeenCalledWith(60);

        whiteElement.props.onPointerUp();
        expect(onNoteOff).toHaveBeenCalledWith(60);

        // Render black key C#4 (MIDI 61, isBlack: true, isPressed: true)
        const blackElement = (PianoKey as any).type({
            midi: 61,
            noteName: 'C#4',
            isBlack: true,
            isPressed: true,
            onNoteOn,
            onNoteOff
        });

        expect(blackElement.props.className).toBe('key key--black');
        expect(blackElement.props['aria-pressed']).toBe(true);
        expect(blackElement.props.children.props.children).toBe('C#4');
    });

    it('E04.3: shallowEqual returns true when all 6 required props are identical', () => {
        const prevProps: PianoKeyProps = {
            midi: 60,
            noteName: 'C4',
            isBlack: false,
            isPressed: false,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        const nextProps: PianoKeyProps = {
            midi: 60,
            noteName: 'C4',
            isBlack: false,
            isPressed: false,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        expect(shallowEqual(prevProps, nextProps)).toBe(true);
    });

    it('E04.4: shallowEqual returns false when isPressed, midi, isBlack, or callback reference changes', () => {
        const baseProps: PianoKeyProps = {
            midi: 60,
            noteName: 'C4',
            isBlack: false,
            isPressed: false,
            onNoteOn: mockOnNoteOn,
            onNoteOff: mockOnNoteOff,
        };

        // Pressing key flips isPressed -> false (must re-render that key)
        expect(shallowEqual(baseProps, { ...baseProps, isPressed: true })).toBe(false);

        // Different MIDI -> false
        expect(shallowEqual(baseProps, { ...baseProps, midi: 61 })).toBe(false);

        // Different isBlack -> false
        expect(shallowEqual(baseProps, { ...baseProps, isBlack: true })).toBe(false);

        // Unstable callback reference -> false
        expect(shallowEqual(baseProps, { ...baseProps, onNoteOn: vi.fn() })).toBe(false);
    });

    it('E04.5: pressing 1 white key (MIDI 60 C4) re-renders ONLY that 1 key and skips the other 87 keys', () => {
        const stableOnNoteOn = vi.fn();
        const stableOnNoteOff = vi.fn();

        // Initial state: no keys pressed
        const prevPropsList: PianoKeyProps[] = PIANO_KEYS.map((note) => ({
            midi: note.midi,
            noteName: note.noteName,
            isBlack: note.isBlack,
            isPressed: false,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        // User presses MIDI 60 (C4 white key)
        const nextPropsList: PianoKeyProps[] = PIANO_KEYS.map((note) => ({
            midi: note.midi,
            noteName: note.noteName,
            isBlack: note.isBlack,
            isPressed: note.midi === 60,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        consumePendingMemoStats();
        const decisions = prevPropsList.map((prev, idx) =>
            shallowEqual(prev, nextPropsList[idx])
        );
        const stats = consumePendingMemoStats();

        const skippedKeys = decisions.filter((isEqual) => isEqual === true);
        const reRenderedKeys = decisions.filter((isEqual) => isEqual === false);

        expect(reRenderedKeys).toHaveLength(1);
        expect(skippedKeys).toHaveLength(87);
        expect(stats.reRenderedMidis).toEqual([60]);
        expect(stats.skippedCount).toBe(87);
    });

    it('E04.6: pressing 1 black key (MIDI 61 C#4) re-renders ONLY that 1 key and skips the other 87 keys', () => {
        const stableOnNoteOn = vi.fn();
        const stableOnNoteOff = vi.fn();

        const prevPropsList: PianoKeyProps[] = PIANO_KEYS.map((note) => ({
            midi: note.midi,
            noteName: note.noteName,
            isBlack: note.isBlack,
            isPressed: false,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        // User presses MIDI 61 (C#4 black key)
        const nextPropsList: PianoKeyProps[] = PIANO_KEYS.map((note) => ({
            midi: note.midi,
            noteName: note.noteName,
            isBlack: note.isBlack,
            isPressed: note.midi === 61,
            onNoteOn: stableOnNoteOn,
            onNoteOff: stableOnNoteOff,
        }));

        consumePendingMemoStats();
        prevPropsList.forEach((prev, idx) => {
            shallowEqual(prev, nextPropsList[idx]);
        });
        const stats = consumePendingMemoStats();

        expect(stats.reRenderedMidis).toEqual([61]);
        expect(stats.skippedCount).toBe(87);
    });
});
