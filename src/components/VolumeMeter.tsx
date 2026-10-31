
interface VolumeMeterProps {
    value: number;
}

export function VolumeMeter({ value }: VolumeMeterProps) {
    const safeValue = Math.max(0, Math.min(100, value));

    return (
        <section
            className="panel"
            aria-labelledby="meter-heading"
        >
            <h2 id="meter-heading">Audio Intensity</h2>

            <p className="meter-description">
                Estimated intensity indicator, not calibrated dB.
            </p>

            <div
                className="meter-track"
                role="progressbar"
                aria-label="Estimated audio intensity"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={safeValue}
            >
                <div
                    className="meter-fill"
                    style={{ width: `${safeValue}%` }}
                />
            </div>

            <p className="meter-value">
                {safeValue}% estimated intensity
            </p>
        </section>
    );
}
