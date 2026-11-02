import { useEffect, useRef, useState } from 'react';
import type {
    PubgCrateDrop,
    PubgClaimResult,
} from '../types/pubg-vn-arena-contract';
import { claimPubgDrop } from '../services/pubg-claim-service';

interface UsePubgCrateClaimOptions {
    initialDrops: PubgCrateDrop[];
    isArenaExpired?: boolean;
}

export interface ClaimExecutionOptions {
    forceConflict?: boolean;
    simulateNetworkError?: boolean;
}

export function usePubgCrateClaim({
    initialDrops,
    isArenaExpired = false,
}: UsePubgCrateClaimOptions) {
    const [drops, setDrops] = useState<PubgCrateDrop[]>(initialDrops);
    const [claimResults, setClaimResults] = useState<PubgClaimResult[]>([]);
    const [activeClaimMap, setActiveClaimMap] = useState<
        Record<string, string>
    >({});

    // Synchronous mirror of latest drops to avoid stale render-closure reads
    const dropsRef = useRef<PubgCrateDrop[]>(initialDrops);

    // Map-based idempotent in-flight claim lock: Key = dropId, Value = claimId
    const inFlightClaims = useRef<Map<string, string>>(new Map());

    // Per-drop AbortController registry for unmount & reset cancellation
    const activeControllers = useRef<Map<string, AbortController>>(new Map());

    // Monotonic epoch guard preventing stale async completions from mutating newer state
    const inventoryEpochRef = useRef<number>(0);

    // Initial capacity map enforcing upper-bound stock conservation during rollback
    const maxCapacityMap = useRef<Map<string, number>>(
        new Map(initialDrops.map((d) => [d.id, d.remainingStock]))
    );

    const updateDrops = (
        updater: (previous: PubgCrateDrop[]) => PubgCrateDrop[]
    ) => {
        setDrops((previous) => {
            const next = updater(previous);
            dropsRef.current = next;
            return next;
        });
    };

    const syncActiveClaimState = () => {
        setActiveClaimMap(Object.fromEntries(inFlightClaims.current.entries()));
    };

    // Abort all in-flight claim requests on component unmount
    useEffect(() => {
        const controllers = activeControllers.current;
        const locks = inFlightClaims.current;

        return () => {
            inventoryEpochRef.current += 1;
            controllers.forEach((controller) => controller.abort());
            controllers.clear();
            locks.clear();
        };
    }, []);

    const claim = async (
        dropId: string,
        forceConflictOrOptions: boolean | ClaimExecutionOptions = false
    ) => {
        const options: ClaimExecutionOptions =
            typeof forceConflictOrOptions === 'boolean'
                ? { forceConflict: forceConflictOrOptions }
                : forceConflictOrOptions;

        // 1. Synchronous duplicate-click guard using Map<dropId, claimId>
        if (inFlightClaims.current.has(dropId)) {
            return;
        }

        const selectedDrop = dropsRef.current.find(
            (drop) => drop.id === dropId
        );

        if (!selectedDrop) {
            return;
        }

        const now = Date.now();

        // 2. Guard against expired drop windows
        if (isArenaExpired || now >= selectedDrop.dropEpochMs) {
            const expiredClaimId = crypto.randomUUID();
            setClaimResults((previous) => [
                {
                    success: false,
                    statusCode: 408,
                    message: `EXPIRED (${selectedDrop.title}): Airdrop claim window has closed.`,
                    claimId: expiredClaimId,
                    dropId,
                    timestamp: now,
                },
                ...previous,
            ]);
            return;
        }

        // 3. Guard against exhausted stock (HTTP 410 LOOTED_OUT)
        if (selectedDrop.remainingStock <= 0) {
            const lootedClaimId = crypto.randomUUID();
            setClaimResults((previous) => [
                {
                    success: false,
                    statusCode: 410,
                    message: `LOOTED_OUT (${selectedDrop.title}): No stock remaining.`,
                    claimId: lootedClaimId,
                    dropId,
                    timestamp: now,
                },
                ...previous,
            ]);
            return;
        }

        // 4. Generate unique claimId & acquire Map<dropId, claimId> lock synchronously
        const claimId = crypto.randomUUID();
        const requestEpoch = inventoryEpochRef.current;
        const controller = new AbortController();

        inFlightClaims.current.set(dropId, claimId);
        activeControllers.current.set(dropId, controller);
        syncActiveClaimState();

        // Save pre-deduction inventory snapshot & capacity cap
        const previousStock = selectedDrop.remainingStock;
        const maxStock =
            maxCapacityMap.current.get(dropId) ?? previousStock;

        // 5. Optimistic inventory deduction (-1)
        updateDrops((previous) =>
            previous.map((drop) =>
                drop.id === dropId
                    ? {
                        ...drop,
                        remainingStock: Math.max(
                            0,
                            drop.remainingStock - 1
                        ),
                    }
                    : drop
            )
        );

        const restoreOptimisticUnit = () => {
            updateDrops((previous) =>
                previous.map((drop) =>
                    drop.id === dropId
                        ? {
                            ...drop,
                            remainingStock: Math.min(
                                maxStock,
                                drop.remainingStock + 1
                            ),
                        }
                        : drop
                )
            );
        };

        try {
            // 6. Execute asynchronous claim request
            const result = await claimPubgDrop({
                claimId,
                dropId,
                forceConflict: Boolean(options.forceConflict),
                simulateNetworkError: Boolean(options.simulateNetworkError),
                signal: controller.signal,
            });

            // 7. Prevent stale async results from overwriting newer inventory state
            if (
                controller.signal.aborted ||
                inventoryEpochRef.current !== requestEpoch ||
                inFlightClaims.current.get(dropId) !== claimId
            ) {
                return;
            }

            // 8. HTTP 409 / 410: roll back optimistic deduction cleanly
            if (!result.success || result.statusCode === 409 || result.statusCode === 410) {
                restoreOptimisticUnit();
            }

            setClaimResults((previous) => [
                {
                    ...result,
                    message: `[${selectedDrop.title}] ${result.message}`,
                },
                ...previous,
            ]);
        } catch (error) {
            // Ignore intentional AbortController cancellations on unmount/reset
            if (
                error instanceof DOMException &&
                error.name === 'AbortError'
            ) {
                return;
            }

            if (
                inventoryEpochRef.current !== requestEpoch ||
                inFlightClaims.current.get(dropId) !== claimId
            ) {
                return;
            }

            // 9. Network failure: restore deducted inventory unit & log feedback
            restoreOptimisticUnit();

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unexpected network failure.';

            setClaimResults((previous) => [
                {
                    success: false,
                    statusCode: 503,
                    message: `[${selectedDrop.title}] Network Error — stock restored (${errorMessage})`,
                    claimId,
                    dropId,
                    timestamp: Date.now(),
                },
                ...previous,
            ]);
        } finally {
            // 10. Always release the Map lock & controller for this claimId
            if (inFlightClaims.current.get(dropId) === claimId) {
                inFlightClaims.current.delete(dropId);
                activeControllers.current.delete(dropId);
                syncActiveClaimState();
            }
        }
    };

    const resetDrops = (nextDrops: PubgCrateDrop[]) => {
        inventoryEpochRef.current += 1;
        activeControllers.current.forEach((controller) => controller.abort());
        activeControllers.current.clear();
        inFlightClaims.current.clear();
        syncActiveClaimState();

        maxCapacityMap.current = new Map(
            nextDrops.map((d) => [d.id, d.remainingStock])
        );
        dropsRef.current = nextDrops;
        setDrops(nextDrops);
        setClaimResults([]);
    };

    return {
        drops,
        claimResults,
        activeClaimMap,
        claim,
        resetDrops,
    };
}
