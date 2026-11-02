import { useEffect, useState } from 'react';
import { createAntiDriftTimer } from '../anti-drift-timer';
import type { DropPhase } from '../types/pubg-vn-arena-contract';

// KRAFTON x PUBG VIETNAM - ZERO-DRIFT AIRDROP TIMER HOOK
// Reuses Lab 2 createAntiDriftTimer (requestAnimationFrame + wall-clock delta)
// combined with interval synchronization and visibilitychange recovery.

const DEFAULT_AIRDROP_LIVE_WINDOW_MS = 15 * 60 * 1000;

export function usePubgAirdropTimer(
    targetEpochMs: number,
    serverOffsetMs = 0,
    liveWindowMs = DEFAULT_AIRDROP_LIVE_WINDOW_MS
) {
    const getServerNow = () => Date.now() + serverOffsetMs;

    const getRemainingMs = () =>
        Math.max(
            0,
            targetEpochMs - (Date.now() + serverOffsetMs)
        );

    const [remainingMs, setRemainingMs] = useState<number>(getRemainingMs);
    const [isExpired, setIsExpired] = useState<boolean>(
        () => getServerNow() >= targetEpochMs + liveWindowMs
    );

    useEffect(() => {
        const syncClock = () => {
            const currentServerNow = Date.now() + serverOffsetMs;
            const nextRemaining = Math.max(
                0,
                targetEpochMs - (Date.now() + serverOffsetMs)
            );
            const nextExpired =
                currentServerNow >= targetEpochMs + liveWindowMs;

            // Update React state when displayed second boundary changes or countdown hits 0
            setRemainingMs((prev) => {
                if (nextRemaining === 0 && prev === 0) {
                    return 0;
                }
                if (
                    nextRemaining === 0 ||
                    Math.ceil(nextRemaining / 1000) !== Math.ceil(prev / 1000)
                ) {
                    return nextRemaining;
                }
                return prev;
            });

            setIsExpired((prev) =>
                prev !== nextExpired ? nextExpired : prev
            );
        };

        // Immediately synchronize whenever targetEpochMs or serverOffsetMs changes
        const initialRemaining = Math.max(
            0,
            targetEpochMs - (Date.now() + serverOffsetMs)
        );
        setRemainingMs(initialRemaining);
        setIsExpired(
            Date.now() + serverOffsetMs >= targetEpochMs + liveWindowMs
        );

        // 1. Reuse Lab 2 requestAnimationFrame anti-drift loop while counting down
        const cancelAntiDrift =
            initialRemaining > 0
                ? createAntiDriftTimer(initialRemaining, () => {
                    syncClock();
                })
                : () => { };

        // 2. Periodic wall-clock check for background tabs & post-live expiry window
        const timerId = window.setInterval(syncClock, 200);

        // 3. Immediate resynchronization when returning from a backgrounded browser tab
        const onWake = () => {
            if (document.visibilityState === 'visible') {
                syncClock();
            }
        };

        document.addEventListener('visibilitychange', onWake);

        // Clean up every animation frame, interval, and event listener
        return () => {
            cancelAntiDrift();
            window.clearInterval(timerId);
            document.removeEventListener('visibilitychange', onWake);
        };
    }, [targetEpochMs, serverOffsetMs, liveWindowMs]);

    const phase: DropPhase = isExpired
        ? 'EXPIRED'
        : remainingMs > 0
            ? 'WARMUP'
            : 'AIRDROP_LIVE';

    return {
        remainingMs,
        isLive: phase === 'AIRDROP_LIVE',
        isExpired,
        phase,
    };
}
