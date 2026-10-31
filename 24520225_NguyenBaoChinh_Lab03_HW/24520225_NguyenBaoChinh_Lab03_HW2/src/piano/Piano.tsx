import React, { useCallback, useEffect, useRef } from 'react';

import PianoKey from './PianoKey';
import { PIANO_KEYS } from './piano-generator';
import './piano.css';

interface PianoProps {
    onNoteOn: (midi: number) => void;
    onNoteOff: (midi: number) => void;
}

// QWERTY computer keyboard mapping to MIDI notes
// Allows pressing multiple keys simultaneously on physical computer keyboard
export const KEY_TO_MIDI: Record<string, number> = {
    // White keys (Octave 4 - Octave 5)
    'a': 60, // C4
    's': 62, // D4
    'd': 64, // E4
    'f': 65, // F4
    'g': 67, // G4
    'h': 69, // A4 (440Hz)
    'j': 71, // B4
    'k': 72, // C5
    'l': 74, // D5
    ';': 76, // E5
    "'": 77, // F5

    // Black keys (Sharps / Flats)
    'w': 61, // C#4
    'e': 63, // D#4
    't': 66, // F#4
    'y': 68, // G#4
    'u': 70, // A#4
    'o': 73, // C#5
    'p': 75, // D#5

    // Number keys for higher octave / chords
    '1': 48, // C3
    '2': 50, // D3
    '3': 52, // E3
    '4': 53, // F3
    '5': 55, // G3
    '6': 57, // A3
    '7': 59, // B3
    '8': 60, // C4
};

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

    // Track keys currently held down on physical keyboard to prevent auto-repeat
    const activeKeysRef = useRef(new Map<string, number>());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore when typing inside input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.repeat) return;

            const key = e.key.toLowerCase();
            const midi = KEY_TO_MIDI[key];

            if (midi !== undefined && !activeKeysRef.current.has(key)) {
                activeKeysRef.current.set(key, midi);
                handleNoteOn(midi);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key.toLowerCase();
            const midi = activeKeysRef.current.get(key);

            if (midi !== undefined) {
                activeKeysRef.current.delete(key);
                handleNoteOff(midi);
            }
        };

        const handleBlur = () => {
            // Safely release all active keys when window loses focus
            activeKeysRef.current.forEach((midi) => {
                handleNoteOff(midi);
            });
            activeKeysRef.current.clear();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [handleNoteOn, handleNoteOff]);

    return (
        <section
            className="piano-container"
            aria-label="88-key virtual piano"
        >
            <div style={{
                marginBottom: '10px',
                fontSize: '0.8rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
            }}>
                <span style={{ color: '#00f2ff', fontWeight: 600 }}>⌨️ Bàn phím máy tính (QWERTY):</span>
                <span>Phím trắng: <code style={{ color: '#38bdf8' }}>A S D F G H J K L</code> (C4 – D5)</span>
                <span>•</span>
                <span>Phím đen: <code style={{ color: '#c084fc' }}>W E T Y U O P</code></span>
                <span>•</span>
                <span>Bấm cùng lúc nhiều phím (ví dụ: <strong style={{ color: '#4ade80' }}>A + D + G</strong> để chơi hợp âm 3 nốt)</span>
            </div>

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