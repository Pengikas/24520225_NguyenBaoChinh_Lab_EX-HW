
export interface HitEvent {
    id: number;
    padName: string;
    key: string;
    source: 'keyboard' | 'mouse';
    time: string;
}

interface HitHistoryProps {
    hits: HitEvent[];
    announcement: string;
}

export function HitHistory({
    hits,
    announcement,
}: HitHistoryProps) {
    return (
        <section
            className="panel"
            aria-labelledby="history-heading"
        >
            <h2 id="history-heading">Hit History</h2>

            <output
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
            >
                {announcement}
            </output>

            {hits.length === 0 ? (
                <p className="empty-state">
                    No drum hits yet. Press a keyboard key or click a pad.
                </p>
            ) : (
                <ol className="hit-list" aria-label="Recent drum hits">
                    {hits.map((hit) => (
                        <li key={hit.id} className="hit-item">
                            <span className="hit-key">
                                {hit.key}
                            </span>

                            <span className="hit-name">
                                {hit.padName}
                            </span>

                            <span className="hit-source">
                                {hit.source}
                            </span>

                            <time>{hit.time}</time>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
