import { useEffect, useMemo } from 'react';
import { usePubgCrateClaim } from '../hooks/usePubgCrateClaim';
import { INITIAL_PUBG_DROPS } from '../data/pubg-crates';
import PubgCrateCard from './PubgCrateCard';

interface PubgArenaMarketplaceProps {
    isArenaExpired?: boolean;
    onAllLootedChange?: (allLooted: boolean) => void;
}

export default function PubgArenaMarketplace({
    isArenaExpired = false,
    onAllLootedChange,
}: PubgArenaMarketplaceProps) {
    const {
        drops,
        claimResults,
        activeClaimMap,
        claim,
        resetDrops,
    } = usePubgCrateClaim({
        initialDrops: INITIAL_PUBG_DROPS,
        isArenaExpired,
    });

    const initialStockLookup = useMemo(() => {
        return new Map(
            INITIAL_PUBG_DROPS.map((item) => [item.id, item.remainingStock])
        );
    }, []);

    useEffect(() => {
        if (!onAllLootedChange) {
            return;
        }
        const allLooted =
            drops.length > 0 &&
            drops.every((drop) => drop.remainingStock <= 0);
        onAllLootedChange(allLooted);
    }, [drops, onAllLootedChange]);

    const handleResetInventory = () => {
        const refreshedDrops = INITIAL_PUBG_DROPS.map((drop) => ({
            ...drop,
            dropEpochMs: Date.now() + 30 * 60 * 1000,
        }));
        resetDrops(refreshedDrops);
    };

    return (
        <section
            className="pubg-marketplace"
            aria-labelledby="marketplace-heading"
        >
            <header className="section-header-row">
                <div>
                    <p className="section-eyebrow">
                        M2 • OPTIMISTIC INVENTORY &amp; IDEMPOTENT CLAIM LOCK
                    </p>
                    <h2 id="marketplace-heading">PVS GRAND FINALS REWARDS</h2>
                    <p className="section-subtitle">
                        Optimistic stock deduction with synchronous{' '}
                        <code>Map&lt;dropId, claimId&gt;</code> lock and
                        automatic HTTP 409 / network-error rollback.
                    </p>
                </div>

                <div className="marketplace-header-actions">
                    <span className="mock-service-badge">
                        Simulated Mock Claim Service (800ms latency)
                    </span>
                    <button
                        type="button"
                        className="btn-reset-drops"
                        onClick={handleResetInventory}
                    >
                        Reset Stock
                    </button>
                </div>
            </header>

            <div className="pubg-crate-grid">
                {drops.map((drop) => (
                    <PubgCrateCard
                        key={drop.id}
                        drop={drop}
                        initialStock={initialStockLookup.get(drop.id)}
                        activeClaimId={activeClaimMap[drop.id]}
                        isExpired={isArenaExpired}
                        onClaim={claim}
                    />
                ))}
            </div>

            <section
                className="claim-activity-panel"
                aria-labelledby="claim-activity-heading"
            >
                <div className="claim-activity-header">
                    <h3 id="claim-activity-heading">
                        Claim Activity &amp; Rollback Telemetry
                    </h3>
                    <span className="activity-count">
                        {claimResults.length}{' '}
                        {claimResults.length === 1 ? 'event' : 'events'}
                    </span>
                </div>

                {claimResults.length === 0 ? (
                    <p className="empty-state-note">
                        No claim activity yet. Select a PVS VIP Ticket or
                        G-Coin Crate above to inspect optimistic deduction and
                        HTTP 200 / 409 / 503 rollback behavior.
                    </p>
                ) : (
                    <ul className="claim-activity-list" aria-live="polite">
                        {claimResults.map((result) => (
                            <li
                                key={result.claimId}
                                className={`claim-activity-item status-${result.statusCode}`}
                            >
                                <span
                                    className={`http-badge badge-${result.statusCode}`}
                                >
                                    HTTP {result.statusCode}
                                </span>
                                <span className="claim-message">
                                    {result.message}
                                </span>
                                <code className="claim-id-token">
                                    claimId: {result.claimId.slice(0, 8)}
                                </code>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    );
}
