import React, { memo, useCallback, useState } from 'react';
import type { PianoKeyData } from './piano-types';

interface PianoKeyProps {
    note: PianoKeyData;
    onNoteOn: (midi: number) => void;
    onNoteOff: (midi: number) => void;
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
});

export default PianoKey;