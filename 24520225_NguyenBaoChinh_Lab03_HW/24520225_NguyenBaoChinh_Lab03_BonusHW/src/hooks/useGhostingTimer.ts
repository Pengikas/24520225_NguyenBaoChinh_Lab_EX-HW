
import { useEffect, useState } from 'react';

import type { RelationshipPhase } from '../types/relationship';

export type GhostingStatus =
    | 'IDLE'
    | 'WAITING'
    | 'REPLIED'
    | 'GHOSTED'
    | 'ABORTED';

interface UseGhostingTimerOptions {
    readonly messageId: number;
    readonly isMessageSent: boolean;
    readonly recipient: 'EM' | 'AI_DO';
    readonly phase: RelationshipPhase;
    readonly replyReceived: boolean;
}

const GHOSTING_TIMEOUT_MS = 5000;


export function useGhostingTimer({
    messageId,
    isMessageSent,
    recipient,
    phase,
    replyReceived,
}: UseGhostingTimerOptions): GhostingStatus {
    const [status, setStatus] = useState<GhostingStatus>('IDLE');

    useEffect(() => {
        // No message has been sent.
        if (!isMessageSent || messageId === 0) {
            setStatus('IDLE');
            return;
        }

        // Switching to AI_DO cancels the pending timer.
        if (recipient === 'AI_DO') {
            setStatus('ABORTED');
            return;
        }

        // Stop monitoring after the relationship has ended.
        if (phase === 'GHOSTED_EXIT') {
            setStatus('ABORTED');
            return;
        }

        // A reply has arrived before the timeout.
        if (replyReceived) {
            setStatus('REPLIED');
            return;
        }

        // Create a controller for this message's async task.
        const controller = new AbortController();

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        setStatus('WAITING');

        // Simulate an asynchronous 5-second reply wait.
        const waitForReply = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                timeoutId = setTimeout(() => {
                    resolve();
                }, GHOSTING_TIMEOUT_MS);

                controller.signal.addEventListener(
                    'abort',
                    () => {
                        if (timeoutId !== undefined) {
                            clearTimeout(timeoutId);
                            timeoutId = undefined;
                        }

                        reject(
                            new DOMException(
                                'Reply timer was aborted.',
                                'AbortError',
                            ),
                        );
                    },
                    { once: true },
                );
            });
        };

        void waitForReply()
            .then(() => {
                // Prevent stale asynchronous updates.
                if (controller.signal.aborted) {
                    return;
                }

                setStatus('GHOSTED');
            })
            .catch((err: unknown) => {
                // Abort is an expected cleanup operation.
                if (
                    err instanceof Error &&
                    err.name === 'AbortError'
                ) {
                    return;
                }

                // Unexpected errors must not be silently ignored.
                if (!controller.signal.aborted) {
                    console.error('Ghosting timer error:', err);
                    setStatus('IDLE');
                }
            });

        // Effect cleanup: release the timer and abort the task.
        return () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }

            controller.abort();
        };
    }, [
        messageId,
        isMessageSent,
        recipient,
        phase,
        replyReceived,
    ]);

    return status;
}
