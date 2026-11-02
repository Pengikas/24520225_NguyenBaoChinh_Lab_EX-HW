import { useState } from 'react';
import PubgAirdropTimer from './components/PubgAirdropTimer';
import PubgArenaMarketplace from './components/PubgArenaMarketplace';
import PubgLeaderboard from './components/PubgLeaderboard';
import PubgKillFeed from './components/PubgKillFeed';
import './App.css';

const INITIAL_WARMUP_MS = 5 * 60 * 1000;

export function App() {
    const [airdropTargetMs, setAirdropTargetMs] = useState<number>(
        () => Date.now() + INITIAL_WARMUP_MS
    );
    const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
    const [allCratesLooted, setAllCratesLooted] = useState<boolean>(false);
    const [isArenaExpired, setIsArenaExpired] = useState<boolean>(false);

    return (
        <div className="pubg-arena-shell">
            {/* 1. Championship Hero */}
            <header className="pubg-hero">
                <div className="pubg-hero-inner">
                    <div className="hero-brand-bar">
                        <span className="krafton-pill">
                            KRAFTON x PUBG VIETNAM
                        </span>
                        <span className="pvs-season-tag">
                            PUBG VIETNAM SERIES • GRAND FINALS ARENA
                        </span>
                    </div>

                    <h1>CHAMPIONSHIP &amp; AIRDROP ARENA</h1>

                    <p className="hero-description">
                        Interactive esports command hub engineered for the PUBG
                        Vietnam Championship: wall-clock-synchronized supply
                        drop telemetry, optimistic PVS VIP Ticket &amp; G-Coin
                        crate claiming with HTTP 409 conflict rollback, Vietnam
                        pro-squad standings, and combat kill-feed filtering.
                    </p>

                    <div className="hero-meta-strip">
                        <div className="hero-meta-chip">
                            <span className="meta-label">FEATURED SQUADS</span>
                            <strong>TE • CES • ROY • AGG</strong>
                        </div>
                        <div className="hero-meta-chip">
                            <span className="meta-label">REWARD TIERS</span>
                            <strong>VIP Tickets &amp; G-Coin Crates</strong>
                        </div>
                        <div className="hero-meta-chip server-offset-control">
                            <label htmlFor="server-offset-select">
                                SERVER CLOCK OFFSET
                            </label>
                            <select
                                id="server-offset-select"
                                value={serverOffsetMs}
                                onChange={(event) =>
                                    setServerOffsetMs(
                                        Number(event.target.value)
                                    )
                                }
                            >
                                <option value={0}>0 ms (Synced)</option>
                                <option value={2000}>+2000 ms (+2s ahead)</option>
                                <option value={-2000}>-2000 ms (-2s behind)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pubg-main-content">
                {/* 2. Airdrop Countdown */}
                <PubgAirdropTimer
                    targetEpochMs={airdropTargetMs}
                    serverOffsetMs={serverOffsetMs}
                    isLootedOut={allCratesLooted}
                    onChangeTargetEpoch={setAirdropTargetMs}
                    onExpiredChange={setIsArenaExpired}
                />

                {/* 3. PVS Grand Finals Rewards */}
                <PubgArenaMarketplace
                    isArenaExpired={isArenaExpired}
                    onAllLootedChange={setAllCratesLooted}
                />

                {/* 4. PUBG Vietnam Leaderboard & 5. Live Kill-Feed */}
                <div className="pubg-esports-grid">
                    <PubgLeaderboard />
                    <PubgKillFeed />
                </div>
            </main>

            <footer className="pubg-footer">
                <p>
                    <strong>
                        KRAFTON x PUBG Vietnam Championship &amp; Airdrop Arena
                    </strong>{' '}
                    — React 19 + TypeScript HW3 Engineering Client. Claim API
                    responses and match standings use local client-side demo
                    simulation.
                </p>
            </footer>
        </div>
    );
}

export default App;
