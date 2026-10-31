import React, { useCallback } from 'react';

import PianoKey from './PianoKey';
import { PIANO_KEYS } from './piano-generator';
import './piano.css';

interface PianoProps {
    onNoteOn: (midi: number) => void;
    onNoteOff: (midi: number) => void;
}

const Piano: React.FC<PianoProps> = ({
    onNoteOn,
    onNoteOff
}) => {
    const handleNoteOn = useCallback(
        (midi: number) => {
            onNoteOn(midi);
        },
        [onNoteOn]
    );

    const handleNoteOff = useCallback(
        (midi: number) => {
            onNoteOff(midi);
        },
        [onNoteOff]
    );

    return (
        <section
            className="piano-container"
            aria-label="88-key virtual piano"
        >
            <div className="piano-keyboard">
                {PIANO_KEYS.map((note) => (
                    <PianoKey
                        key={note.midi}
                        note={note}
                        onNoteOn={handleNoteOn}
                        onNoteOff={handleNoteOff}
                    />
                ))}
            </div>
        </section>
    );
};

export default Piano;