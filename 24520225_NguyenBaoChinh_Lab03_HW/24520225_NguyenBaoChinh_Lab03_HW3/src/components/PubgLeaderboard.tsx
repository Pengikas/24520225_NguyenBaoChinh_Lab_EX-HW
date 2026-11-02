import { useMemo, useState } from 'react';
import type {
    PubgVnSquadStanding,
    LeaderboardSortBy,
    SortDirection,
} from '../types/pubg-vn-arena-contract';
import { INITIAL_SQUAD_STANDINGS } from '../data/pubg-leaderboard-data';

export default function PubgLeaderboard() {
    const [sortBy, setSortBy] =
        useState<LeaderboardSortBy>('placementPts');

    const [sortDirection, setSortDirection] =
        useState<SortDirection>('desc');

    const [selectedSquad, setSelectedSquad] =
        useState<string>('ALL');

    // Derive visible standings purely via useMemo without mutating INITIAL_SQUAD_STANDINGS
    const visibleStandings = useMemo<PubgVnSquadStanding[]>(() => {
        const filtered: PubgVnSquadStanding[] =
            INITIAL_SQUAD_STANDINGS.filter(
                (squad: PubgVnSquadStanding) => {
                    return (
                        selectedSquad === 'ALL' ||
                        squad.squadId === selectedSquad
                    );
                }
            );

        return [...filtered].sort(
            (a: PubgVnSquadStanding, b: PubgVnSquadStanding) => {
                const difference = a[sortBy] - b[sortBy];

                if (difference === 0) {
                    return a.squadName.localeCompare(b.squadName);
                }

                return sortDirection === 'desc'
                    ? -difference
                    : difference;
            }
        );
    }, [sortBy, sortDirection, selectedSquad]);

    const handleSortChange = (value: LeaderboardSortBy) => {
        setSortBy(value);
    };

    const handleDirectionChange = (value: SortDirection) => {
        setSortDirection(value);
    };

    return (
        <section
            className="pubg-leaderboard"
            aria-labelledby="leaderboard-heading"
        >
            <header className="section-header-row">
                <div>
                    <p className="section-eyebrow">
                        M3 • DERIVED TOURNAMENT STANDINGS
                    </p>
                    <h2 id="leaderboard-heading">
                        PUBG VIETNAM LEADERBOARD
                    </h2>
                    <p className="section-subtitle">
                        Non-mutating <code>useMemo</code> squad filtering and
                        sorting across WWCD, Placement, and Kill metrics.
                    </p>
                </div>

                <span className="demo-data-badge">
                    Static Demo Dataset (Non-Official Sample)
                </span>
            </header>

            <div className="leaderboard-controls">
                <div className="control-group">
                    <label htmlFor="sort-by">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(event) =>
                            handleSortChange(
                                event.target.value as LeaderboardSortBy
                            )
                        }
                    >
                        <option value="wwcdCount">WWCD Count</option>
                        <option value="placementPts">Placement Points</option>
                        <option value="killPts">Kill Points</option>
                    </select>
                </div>

                <div className="control-group">
                    <label htmlFor="sort-direction">Direction:</label>
                    <select
                        id="sort-direction"
                        value={sortDirection}
                        onChange={(event) =>
                            handleDirectionChange(
                                event.target.value as SortDirection
                            )
                        }
                    >
                        <option value="desc">Descending (Highest first)</option>
                        <option value="asc">Ascending (Lowest first)</option>
                    </select>
                </div>

                <div className="control-group">
                    <label htmlFor="squad-filter">Squad:</label>
                    <select
                        id="squad-filter"
                        value={selectedSquad}
                        onChange={(event) =>
                            setSelectedSquad(event.target.value)
                        }
                    >
                        <option value="ALL">All squads (4)</option>
                        {INITIAL_SQUAD_STANDINGS.map(
                            (squad: PubgVnSquadStanding) => (
                                <option
                                    key={squad.squadId}
                                    value={squad.squadId}
                                >
                                    {squad.squadName}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </div>

            <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                    <caption className="sr-only">
                        PUBG Vietnam Championship demo squad standings sorted by{' '}
                        {sortBy} ({sortDirection})
                    </caption>

                    <thead>
                        <tr>
                            <th scope="col">Rank</th>
                            <th scope="col">Squad</th>
                            <th
                                scope="col"
                                className={
                                    sortBy === 'wwcdCount' ? 'col-active' : ''
                                }
                            >
                                WWCD
                            </th>
                            <th
                                scope="col"
                                className={
                                    sortBy === 'placementPts'
                                        ? 'col-active'
                                        : ''
                                }
                            >
                                Placement Pts
                            </th>
                            <th
                                scope="col"
                                className={
                                    sortBy === 'killPts' ? 'col-active' : ''
                                }
                            >
                                Kill Pts
                            </th>
                            <th scope="col">Total Pts</th>
                        </tr>
                    </thead>

                    <tbody>
                        {visibleStandings.map((squad, index) => (
                            <tr
                                key={squad.squadId}
                                className={index === 0 ? 'rank-top-row' : ''}
                            >
                                <td>
                                    <span className="rank-chip">
                                        #{index + 1}
                                    </span>
                                </td>
                                <th scope="row" className="squad-name-cell">
                                    <span className="squad-tag">
                                        {squad.squadId.toUpperCase()}
                                    </span>
                                    <span>{squad.squadName}</span>
                                </th>
                                <td
                                    className={
                                        sortBy === 'wwcdCount'
                                            ? 'col-active'
                                            : ''
                                    }
                                >
                                    {squad.wwcdCount}
                                </td>
                                <td
                                    className={
                                        sortBy === 'placementPts'
                                            ? 'col-active'
                                            : ''
                                    }
                                >
                                    {squad.placementPts}
                                </td>
                                <td
                                    className={
                                        sortBy === 'killPts'
                                            ? 'col-active'
                                            : ''
                                    }
                                >
                                    {squad.killPts}
                                </td>
                                <td className="total-pts-cell">
                                    {squad.placementPts + squad.killPts}
                                </td>
                            </tr>
                        ))}

                        {visibleStandings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-table-cell">
                                    No squad standings match the selected
                                    filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
