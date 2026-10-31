
import { useEffect } from 'react';
import type { DrumPadDefinition } from '../data/drumPads';

type PadMap = Map<string, DrumPadDefinition>;

type TriggerCallback = (
    pad: DrumPadDefinition
) => void;

export function useDrumKeyboard(
    padMap: PadMap,
    onTriggerPad: TriggerCallback,
    isEnabled = true
): void {
    useEffect(() => {
        if (!isEnabled) return;

        const onKeyDown = (event: KeyboardEvent) => {
            // Ignore OS auto-repeat.
            if (event.repeat) return;

            // Ignore keyboard input during IME composition.
            if (event.isComposing) return;

            const target = event.target;

            // Ignore editable controls.
            if (target instanceof HTMLElement) {
                if (
                    target.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(
                        target.tagName
                    )
                ) {
                    return;
                }
            }

            // Use physical key positions.
            const pad = padMap.get(event.code);

            if (!pad) return;

            event.preventDefault();

            onTriggerPad(pad);
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener(
                'keydown',
                onKeyDown
            );
        };
    }, [padMap, onTriggerPad, isEnabled]);
}
