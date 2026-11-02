import type { ClaimExecutionOptions } from '../hooks/usePubgCrateClaim';
import type { PubgCrateDrop } from '../types/pubg-vn-arena-contract';

interface PubgCrateCardProps {
    drop: PubgCrateDrop;
    initialStock?: number;
    activeClaimId?: string;
    isExpired?: boolean;
    onClaim: (
        dropId: string,
        forceConflictOrOptions?: boolean | ClaimExecutionOptions
    ) => void;
}

function formatPriceVnd(priceVnd: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(priceVnd);
}

export default function PubgCrateCard({
    drop,
    initialStock = 50,
    activeClaimId,
    isExpired = false,
    onClaim,
}: PubgCrateCardProps) {
    const isSoldOut = drop.remainingStock <= 0;
    const isClaimInFlight = Boolean(activeClaimId);
    const isUnavailable = isSoldOut || isExpired;

    const capacity = Math.max(initialStock, drop.remainingStock, 1);
    const stockPercent = Math.min(
        100,
        Math.max(0, Math.round((drop.remainingStock / capacity) * 100))
    );

    const isVipTicket = drop.id.includes('vip');

    return (
        <article
            className={`pubg-crate-card ${isVipTicket ? 'tier-vip' : 'tier-gcoin'} ${
                isUnavailable ? 'card-unavailable' : ''
            }`}
        >
            <div className="crate-card-top">
                <span className="crate-tier-badge">
                    {isVipTicket
                        ? 'PVS GRAND FINALS PASS'
                        : 'BATTLEGROUND SUPPLY CRATE'}
                </span>

                {isClaimInFlight ? (
                    <span className="crate-lock-badge" role="status">
                        LOCK: {activeClaimId?.slice(0, 8)}
                    </span>
                ) : isExpired ? (
                    <span className="crate-state-tag tag-expired">EXPIRED</span>
                ) : isSoldOut ? (
                    <span className="crate-state-tag tag-looted">
                        LOOTED OUT
                    </span>
                ) : (
                    <span className="crate-state-tag tag-ready">AVAILABLE</span>
                )}
            </div>

            <h3>{drop.title}</h3>

            <p className="crate-description">
                {isVipTicket
                    ? 'Front-row arena seating pass for the PUBG Vietnam Series Grand Finals stage plus commemorative lanyard.'
                    : 'Digital G-Coin supply bundle redeemable for PVS team skins, contraband coupons, and seasonal battleground crates.'}
            </p>

            <p className="crate-price">{formatPriceVnd(drop.priceVnd)}</p>

            <div className="crate-stock-panel">
                <div className="crate-stock-row">
                    <span>Remaining stock</span>
                    <strong>
                        {drop.remainingStock} / {capacity}
                    </strong>
                </div>
                <div
                    className="crate-stock-track"
                    role="progressbar"
                    aria-valuenow={drop.remainingStock}
                    aria-valuemin={0}
                    aria-valuemax={capacity}
                    aria-label={`${drop.title} remaining stock`}
                >
                    <div
                        className="crate-stock-fill"
                        style={{ width: `${stockPercent}%` }}
                    />
                </div>
            </div>

            {isExpired ? (
                <p className="crate-status-banner expired" role="status">
                    DROP WINDOW EXPIRED — Claims Closed
                </p>
            ) : isSoldOut ? (
                <p className="crate-status-banner looted" role="status">
                    LOOTED OUT — All Stock Claimed
                </p>
            ) : (
                <button
                    type="button"
                    className={`btn-claim-primary ${
                        isClaimInFlight ? 'is-claiming' : ''
                    }`}
                    aria-busy={isClaimInFlight}
                    onClick={() => onClaim(drop.id)}
                >
                    {isClaimInFlight
                        ? 'CLAIMING... (IN-FLIGHT LOCK ACTIVE)'
                        : 'CLAIM NOW'}
                </button>
            )}

            <div
                className="crate-sim-actions"
                role="group"
                aria-label={`Simulated concurrency fault tests for ${drop.title}`}
            >
                <button
                    type="button"
                    className="btn-sim-secondary"
                    disabled={isUnavailable}
                    onClick={() =>
                        onClaim(drop.id, { forceConflict: true })
                    }
                >
                    Test HTTP 409 Rollback
                </button>

                <button
                    type="button"
                    className="btn-sim-secondary"
                    disabled={isUnavailable}
                    onClick={() =>
                        onClaim(drop.id, { simulateNetworkError: true })
                    }
                >
                    Test Network Failure
                </button>
            </div>
        </article>
    );
}
