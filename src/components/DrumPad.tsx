
import './DrumPad.css';

interface DrumPadProps {
    id: string;
    name: string;
    description: string;
    keyboardKey: string;
    isActive: boolean;
    onTrigger: () => void;
}

export function DrumPad({
    id,
    name,
    description,
    keyboardKey,
    isActive,
    onTrigger,
}: DrumPadProps) {
    return (
        <button
            type="button"
            className={`drum-pad ${isActive ? 'is-active' : ''}`}
            data-pad-id={id}
            aria-label={`${name}, keyboard key ${keyboardKey}`}
            aria-pressed={isActive}
            onClick={onTrigger}
        >
            <span className="pad-key" aria-hidden="true">
                {keyboardKey}
            </span>

            <span className="pad-name">
                {name}
            </span>

            <span className="pad-description">
                {description}
            </span>

            <span className="pad-indicator" aria-hidden="true" />
        </button>
    );
}
