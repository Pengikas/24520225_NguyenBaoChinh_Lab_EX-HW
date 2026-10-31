
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DrumPad } from './components/DrumPad';
import { HitHistory, type HitEvent } from './components/HitHistory';
import { VolumeMeter } from './components/VolumeMeter';

import { useDrumKeyboard } from './hooks/useDrumKeyboard';

import { DRUM_PADS, type DrumPadDefinition } from './data/drumPads';
import { playDrumSound, closeAudioContext } from './audio/drumAudio';

import './App.css';

type TriggerSource = 'keyboard' | 'mouse';

function App() {
    const [activePad, setActivePad] = useState<string | null>(null);
    const [hits, setHits] = useState<HitEvent[]>([]);
    const [intensity, setIntensity] = useState(0);
    const [announcement, setAnnouncement] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);

    const hitIdRef = useRef(0);
    const activeTimerRef = useRef<number | null>(null);

    const padMap = useMemo(
        () => new Map(
            DRUM_PADS.map((pad) => [pad.code, pad])
        ),
        []
    );

    const triggerPad = useCallback(
        async (
            pad: DrumPadDefinition,
            source: TriggerSource
        ) => {
            setActivePad(pad.id);

            if (activeTimerRef.current !== null) {
                window.clearTimeout(activeTimerRef.current);
            }

            activeTimerRef.current = window.setTimeout(() => {
                setActivePad(null);
                activeTimerRef.current = null;
            }, 140);

            setIntensity(pad.intensity);

            const now = new Date();

            const hit: HitEvent = {
                id: ++hitIdRef.current,
                padName: pad.name,
                key: pad.key,
                source,
                time: now.toLocaleTimeString(),
            };

            setHits((previous) =>
                [hit, ...previous].slice(0, 8)
            );

            setAnnouncement(
                `${pad.name} drum triggered by ${source}. Keyboard key ${pad.key}.`
            );

            const success = await playDrumSound(pad);

            if (!success) {
                setAnnouncement(
                    `${pad.name} activated visually, but audio playback is unavailable.`
                );
            }
        },
        []
    );

    const handleKeyboardTrigger = useCallback(
        (pad: DrumPadDefinition) => {
            void triggerPad(pad, 'keyboard');
        },
        [triggerPad]
    );

    useDrumKeyboard(
        padMap,
        handleKeyboardTrigger,
        isEnabled
    );

    useEffect(() => {
        return () => {
            if (activeTimerRef.current !== null) {
                window.clearTimeout(activeTimerRef.current);
            }

            closeAudioContext();
        };
    }, []);

    return (
        <main className="studio">
            <header className="studio-header">
                <div className="brand">
                    <span className="brand-mark" aria-hidden="true">
                        ◉
                    </span>
                    <span>BEAT LAB</span>
                </div>

                <span className="studio-status">
                    <span aria-hidden="true" className="status-dot" />
                    STUDIO READY
                </span>
            </header>

            <section className="hero">
                <p className="eyebrow">DIGITAL PERCUSSION STUDIO</p>

                <h1>Studio Drum Kit</h1>

                <p className="hero-description">
                    Create your rhythm with seven interactive
                    drum pads. Use your physical keyboard or mouse.
                </p>
            </section>

            <section
                className="drum-section"
                aria-labelledby="pads-heading"
            >
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">PERFORMANCE DECK</p>
                        <h2 id="pads-heading">Drum Pads</h2>
                    </div>

                    <button
                        type="button"
                        className="toggle-button"
                        aria-pressed={isEnabled}
                        onClick={() => setIsEnabled((value) => !value)}
                    >
                        Keyboard: {isEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div className="drum-grid">
                    {DRUM_PADS.map((pad) => (
                        <DrumPad
                            key={pad.id}
                            id={pad.id}
                            name={pad.name}
                            description={pad.description}
                            keyboardKey={pad.key}
                            isActive={activePad === pad.id}
                            onTrigger={() => {
                                void triggerPad(pad, 'mouse');
                            }}
                        />
                    ))}
                </div>

                <p className="keyboard-help">
                    Keyboard shortcuts:
                    {' '}
                    {DRUM_PADS.map((pad) => pad.key).join(' / ')}
                </p>
            </section>

            <div className="studio-panels">
                <HitHistory
                    hits={hits}
                    announcement={announcement}
                />

                <VolumeMeter value={intensity} />
            </div>

            <footer className="studio-footer">
                <p>
                    Production Studio Drum Kit · WCAG 2.2 AA
                </p>
                <p>
                    Built with React, TypeScript and Web Audio API
                </p>
            </footer>
        </main>
    );
}

export default App;
