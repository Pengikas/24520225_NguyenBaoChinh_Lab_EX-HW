import React, { memo, useCallback, useState } from 'react';
import type { PianoKeyData } from './piano-types';

export interface PianoKeyProps {
    note: PianoKeyData;
    onNoteOn: (midi: number) => void;
    onNoteOff: (midi: number) => void;
}

export function shallowEqual(prevProps: PianoKeyProps, nextProps: PianoKeyProps): boolean {
    return (
        prevProps.note.midi === nextProps.note.midi &&
        prevProps.note.keyType === nextProps.note.keyType &&
        prevProps.note.noteName === nextProps.note.noteName &&
        prevProps.note.frequency === nextProps.note.frequency &&
        prevProps.onNoteOn === nextProps.onNoteOn &&
        prevProps.onNoteOff === nextProps.onNoteOff
    );
}

const PianoKey = memo(function PianoKey({
    note,
    onNoteOn,
    onNoteOff
}: PianoKeyProps) {
    const [isPressed, setIsPressed] = useState(false);

    const handleNoteOn = useCallback(() => {
        if (isPressed) return;

        setIsPressed(true);
        onNoteOn(note.midi);
    }, [isPressed, note.midi, onNoteOn]);

    const handleNoteOff = useCallback(() => {
        if (!isPressed) return;

        setIsPressed(false);
        onNoteOff(note.midi);
    }, [isPressed, note.midi, onNoteOff]);

    const handlePointerDown = (
        event: React.PointerEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        handleNoteOn();
    };

    const handlePointerUp = () => {
        handleNoteOff();
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.repeat) return;

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleNoteOn();
        }
    };

    const handleKeyUp = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleNoteOff();
        }
    };

    return (
        <button
            type="button"
            className={[
                'piano-key',
                `piano-key--${note.keyType}`,
                isPressed ? 'is-pressed' : ''
            ].join(' ')}
            aria-label={`${note.noteName}, ${note.frequency.toFixed(2)} Hz`}
            aria-pressed={isPressed}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
        >
            <span>{note.noteName}</span>
        </button>
    );
}, shallowEqual);

export default PianoKey;