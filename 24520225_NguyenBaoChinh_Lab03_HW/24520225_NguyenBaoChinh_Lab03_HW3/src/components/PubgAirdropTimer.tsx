import { useEffect } from 'react';
import { formatCountdown } from '../anti-drift-timer';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer';
import type { DropPhase } from '../types/pubg-vn-arena-contract';

interface PubgAirdropTimerProps {
    targetEpochMs: number;
    serverOffsetMs?: number;
    isLootedOut?: boolean;
    onChangeTargetEpoch?: (nextTargetEpochMs: number) => void;
    onExpiredChange?: (isExpired: boolean) => void;
}

const PHASE_LABELS: Record<DropPhase, string> = {
    WARMUP: 'WARMUP',
    AIRDROP_LIVE: 'AIRDROP LIVE',
    LOOTED_OUT: 'LOOTED OUT',
    EXPIRED: 'EXPIRED',
};

export default function PubgAirdropTimer({
    targetEpochMs,
    serverOffsetMs = 0,
    isLootedOut = false,
    onChangeTargetEpoch,
    onExpiredChange,
}: PubgAirdropTimerProps) {
    const {
        remainingMs,
        isExpired,
        phase: timerPhase,
    } = usePubgAirdropTimer(targetEpochMs, serverOffsetMs);

    useEffect(() => {
        onExpiredChange?.(isExpired);
    }, [isExpired, onExpiredChange]);

    const effectivePhase: DropPhase =
        timerPhase === 'EXPIRED'
            ? 'EXPIRED'
            : isLootedOut
                ? 'LOOTED_OUT'
                : timerPhase;

    // Reuse Lab 2 formatCountdown utility for zero-padded HH:MM:SS formatting
    const { hours, minutes, seconds } = formatCountdown(
        Math.ceil(remainingMs / 1000) * 1000
    );

    const getSynchronizedNow = () => Date.now() + serverOffsetMs;

    return (
        <section
            className={`airdrop-timer phase-${effectivePhase.toLowerCase()}`}
            aria-labelledby="airdrop-countdown-heading"
        >
            <div className="airdrop-timer-header">
                <div>
                    <p className="section-eyebrow">
                        M1 • ZERO-DRIFT EPOCH SYNCHRONIZATION
                    </p>
                    <h2 id="airdrop-countdown-heading">
                        C-130 SUPPLY PLANE AIRDROP COUNTDOWN
                    </h2>
                </div>

                <span
                    className={`phase-pill phase-pill-${effectivePhase.toLowerCase()}`}
                    role="status"
                >
                    {PHASE_LABELS[effectivePhase]}
                </span>
            </div>

            <div className="airdrop-timer-body">
                <div
                    className="timer-display"
                    role="timer"
                    aria-live="off"
                    aria-label={`Remaining time ${hours} hours ${minutes} minutes ${seconds} seconds`}
                >
                    <div className="timer-segment">
                        <span className="timer-digit">{hours}</span>
                        <span className="timer-unit">HRS</span>
                    </div>
                    <span className="timer-separator" aria-hidden="true">
                        :
                    </span>
                    <div className="timer-segment">
                        <span className="timer-digit">{minutes}</span>
                        <span className="timer-unit">MIN</span>
                    </div>
                    <span className="timer-separator" aria-hidden="true">
                        :
                    </span>
                    <div className="timer-segment">
                        <span className="timer-digit">{seconds}</span>
                        <span className="timer-unit">SEC</span>
                    </div>
                </div>

                {effectivePhase === 'WARMUP' && (
                    <div className="airdrop-state-banner warmup" role="status">
                        <span className="state-dot warmup-dot" aria-hidden="true" />
                        <span>
                            <strong>WARMUP — SUPPLY PLANE EN ROUTE:</strong> Countdown anchored to absolute epoch via <code>createAntiDriftTimer</code> + <code>visibilitychange</code> recovery.
                        </span>
                    </div>
                )}

                {effectivePhase === 'AIRDROP_LIVE' && (
                    <div className="airdrop-state-banner live" role="status">
                        <span className="state-dot live-dot" aria-hidden="true" />
                        <span>
                            <strong>AIRDROP LIVE:</strong> Supply crates deployed on battleground — remaining time locked at <code>00:00:00</code>.
                        </span>
                    </div>
                )}

                {effectivePhase === 'LOOTED_OUT' && (
                    <div className="airdrop-state-banner looted" role="status">
                        <span className="state-dot looted-dot" aria-hidden="true" />
                        <span>
                            <strong>LOOTED OUT:</strong> Every PVS Grand Finals reward crate in this drop wave has been claimed.
                        </span>
                    </div>
                )}

                {effectivePhase === 'EXPIRED' && (
                    <div className="airdrop-state-banner expired" role="status">
                        <span className="state-dot expired-dot" aria-hidden="true" />
                        <span>
                            <strong>EXPIRED:</strong> Airdrop claim window has closed — remaining time clamped at <code>00:00:00</code> (never negative).
                        </span>
                    </div>
                )}

                {onChangeTargetEpoch && (
                    <div
                        className="timer-preset-controls"
                        role="group"
                        aria-label="Airdrop phase presets for verification"
                    >
                        <span className="preset-label">
                            Verify Phase Transitions:
                        </span>
                        <button
                            type="button"
                            className="btn-preset"
                            onClick={() =>
                                onChangeTargetEpoch(
                                    getSynchronizedNow() + 5 * 60 * 1000
                                )
                            }
                        >
                            Warmup (+5m)
                        </button>
                        <button
                            type="button"
                            className="btn-preset"
                            onClick={() =>
                                onChangeTargetEpoch(
                                    getSynchronizedNow() + 10 * 1000
                                )
                            }
                        >
                            Final 10s
                        </button>
                        <button
                            type="button"
                            className="btn-preset"
                            onClick={() =>
                                onChangeTargetEpoch(getSynchronizedNow())
                            }
                        >
                            Airdrop Live (0s)
                        </button>
                        <button
                            type="button"
                            className="btn-preset"
                            onClick={() =>
                                onChangeTargetEpoch(
                                    getSynchronizedNow() - 20 * 60 * 1000
                                )
                            }
                        >
                            Expired Window
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
