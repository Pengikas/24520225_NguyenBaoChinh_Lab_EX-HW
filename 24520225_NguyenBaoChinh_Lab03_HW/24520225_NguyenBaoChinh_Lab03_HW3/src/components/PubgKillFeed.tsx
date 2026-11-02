import { useMemo, useState } from 'react';
import type { PubgKillFeedEvent } from '../types/pubg-vn-arena-contract';
import { INITIAL_KILL_FEED } from '../data/pubg-leaderboard-data';

type KillFeedFilter =
    | 'ALL'
    | 'KILL'
    | 'KNOCK'
    | 'ELIMINATION';

function formatRelativeSeconds(timestampMs: number): string {
    const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - timestampMs) / 1000)
    );
    if (elapsedSeconds < 60) {
        return `${elapsedSeconds}s ago`;
    }
    const minutes = Math.floor(elapsedSeconds / 60);
    return `${minutes}m ago`;
}

export default function PubgKillFeed() {
    const [selectedSquad, setSelectedSquad] =
        useState<string>('ALL');

    const [selectedEvent, setSelectedEvent] =
        useState<KillFeedFilter>('ALL');

    // Derive filtered & sorted combat log without mutating INITIAL_KILL_FEED
    const visibleEvents = useMemo<PubgKillFeedEvent[]>(() => {
        const filtered = INITIAL_KILL_FEED.filter(
            (event: PubgKillFeedEvent) => {
                const matchesSquad =
                    selectedSquad === 'ALL' ||
                    event.squadId === selectedSquad;

                const matchesEvent =
                    selectedEvent === 'ALL' ||
                    event.eventType === selectedEvent;

                return matchesSquad && matchesEvent;
            }
        );

        return [...filtered].sort(
            (a: PubgKillFeedEvent, b: PubgKillFeedEvent) =>
                b.timestamp - a.timestamp
        );
    }, [selectedSquad, selectedEvent]);

    const hasActiveFilter =
        selectedSquad !== 'ALL' || selectedEvent !== 'ALL';

    return (
        <section
            className="pubg-kill-feed"
            aria-labelledby="kill-feed-heading"
        >
            <header className="section-header-row">
                <div>
                    <p className="section-eyebrow">
                        M3 • COMBAT TELEMETRY STREAM
                    </p>
                    <h2 id="kill-feed-heading">LIVE KILL-FEED</h2>
                    <p className="section-subtitle">
                        Combined squad + combat action filtering with immutable
                        source preservation.
                    </p>
                </div>

                <span className="demo-data-badge">
                    Static Demo Match Log
                </span>
            </header>

            <div className="kill-feed-controls">
                <div className="control-group">
                    <label htmlFor="kill-squad-filter">
                        Filter squad:
                    </label>
                    <select
                        id="kill-squad-filter"
                        value={selectedSquad}
                        onChange={(event) =>
                            setSelectedSquad(event.target.value)
                        }
                    >
                        <option value="ALL">All squads</option>
                        <option value="te">The Expendables</option>
                        <option value="ces">Cerberus Esports</option>
                        <option value="roy">Roy Esports</option>
                        <option value="agg">AGG</option>
                    </select>
                </div>

                <div className="control-group">
                    <label htmlFor="kill-event-filter">
                        Filter event:
                    </label>
                    <select
                        id="kill-event-filter"
                        value={selectedEvent}
                        onChange={(event) =>
                            setSelectedEvent(
                                event.target.value as KillFeedFilter
                            )
                        }
                    >
                        <option value="ALL">All events</option>
                        <option value="KILL">Kill</option>
                        <option value="KNOCK">Knock</option>
                        <option value="ELIMINATION">Elimination</option>
                    </select>
                </div>

                {hasActiveFilter && (
                    <button
                        type="button"
                        className="btn-clear-filter"
                        onClick={() => {
                            setSelectedSquad('ALL');
                            setSelectedEvent('ALL');
                        }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            <ul className="kill-feed-list" aria-live="polite">
                {visibleEvents.map((event: PubgKillFeedEvent) => (
                    <li key={event.id} className="kill-feed-item">
                        <span className="kill-feed-squad">
                            {event.squadName}
                        </span>

                        <strong className="combatant killer-name">
                            {event.killer}
                        </strong>

                        <span
                            className={`kill-feed-event event-${event.eventType.toLowerCase()}`}
                        >
                            {event.eventType}
                        </span>

                        <strong className="combatant victim-name">
                            {event.victim}
                        </strong>

                        <span className="weapon-chip">{event.weapon}</span>

                        <span className="event-time">
                            {formatRelativeSeconds(event.timestamp)}
                        </span>
                    </li>
                ))}

                {visibleEvents.length === 0 && (
                    <li className="kill-feed-empty">
                        No matching kill-feed events for the selected squad and
                        event filters.
                    </li>
                )}
            </ul>
        </section>
    );
}
