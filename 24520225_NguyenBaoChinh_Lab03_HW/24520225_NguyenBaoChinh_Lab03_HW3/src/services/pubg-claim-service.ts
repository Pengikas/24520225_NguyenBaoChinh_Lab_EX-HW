import type { PubgClaimResult } from '../types/pubg-vn-arena-contract';

export interface ClaimRequest {
    claimId: string;
    dropId: string;
    forceConflict?: boolean;
    simulateNetworkError?: boolean;
    signal?: AbortSignal;
}

/**
 * Simulated client-side claim service for KRAFTON x PUBG Vietnam Airdrop Arena.
 * NOTE: This mock service simulates 800ms network latency, HTTP 200 confirmations,
 * HTTP 409 conflicts, and network failures in the browser. It does NOT represent
 * a real server-side transactional database.
 */
export async function claimPubgDrop({
    claimId,
    dropId,
    forceConflict = false,
    simulateNetworkError = false,
    signal,
}: ClaimRequest): Promise<PubgClaimResult> {
    await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Claim request aborted.', 'AbortError'));
            return;
        }

        const onAbort = () => {
            window.clearTimeout(timerId);
            reject(new DOMException('Claim request aborted.', 'AbortError'));
        };

        const timerId = window.setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, 800);

        signal?.addEventListener('abort', onAbort, { once: true });
    });

    if (simulateNetworkError) {
        throw new Error(
            'Simulated network timeout while contacting mock claim service.'
        );
    }

    if (forceConflict) {
        return {
            success: false,
            statusCode: 409,
            message:
                'HTTP 409 Conflict (Simulated): Concurrent claim collision — stock rolled back.',
            claimId,
            dropId,
            timestamp: Date.now(),
        };
    }

    return {
        success: true,
        statusCode: 200,
        message: 'Claim confirmed (Simulated HTTP 200): Reward allocated.',
        claimId,
        dropId,
        timestamp: Date.now(),
    };
}
