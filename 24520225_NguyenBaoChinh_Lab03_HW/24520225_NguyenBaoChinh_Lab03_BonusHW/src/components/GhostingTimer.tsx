
import { useId, useState } from 'react';

import type { RelationshipPhase } from '../types/relationship';

import { useGhostingTimer } from '../hooks/useGhostingTimer';

export function GhostingTimer({
    phase,
}: {
    readonly phase: RelationshipPhase;
}) {
    const recipientId = useId();

    const [messageId, setMessageId] = useState(0);

    const [isMessageSent, setIsMessageSent] = useState(false);

    const [recipient, setRecipient] = useState<'EM' | 'AI_DO'>(
        'EM',
    );

    const [replyReceived, setReplyReceived] = useState(false);

    const status = useGhostingTimer({
        messageId,
        isMessageSent,
        recipient,
        phase,
        replyReceived,
    });

    function handleSendMessage() {
        setReplyReceived(false);
        setIsMessageSent(true);

        setMessageId((previousId) => previousId + 1);
    }

    function handleReceiveReply() {
        setReplyReceived(true);
    }

    function handleSwitchRecipient(
        nextRecipient: 'EM' | 'AI_DO',
    ) {
        setRecipient(nextRecipient);
    }

    function handleReset() {
        setIsMessageSent(false);
        setReplyReceived(false);
        setRecipient('EM');
    }

    const statusLabels: Record<typeof status, string> = {
        IDLE: 'No active message',
        WAITING: 'Waiting for a reply...',
        REPLIED: 'Reply received!',
        GHOSTED: 'No reply after 5 seconds.',
        ABORTED: 'Pending timer aborted.',
    };

    return (
        <section
            className="ghosting-panel"
            aria-labelledby="ghosting-heading"
        >
            <header>
                <p className="section-label">MILESTONE 03</p>

                <h2 id="ghosting-heading">
                    Seen Không Rep – Ghosting Timer
                </h2>

                <p>
                    Monitor the 5-second reply window with AbortController.
                </p>
            </header>

            <div className="ghosting-controls">
                <label htmlFor={recipientId}>
                    Message recipient
                </label>

                <select
                    id={recipientId}
                    value={recipient}
                    onChange={(event) =>
                        handleSwitchRecipient(
                            event.target.value as 'EM' | 'AI_DO',
                        )
                    }
                >
                    <option value="EM">EM</option>
                    <option value="AI_DO">AI_DO</option>
                </select>

                <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={recipient !== 'EM' || phase === 'GHOSTED_EXIT'}
                >
                    Send Message
                </button>

                <button
                    type="button"
                    onClick={handleReceiveReply}
                    disabled={status !== 'WAITING'}
                >
                    Simulate Reply
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                >
                    Reset Timer
                </button>
            </div>

            <div className="ghosting-status">
                <p>Message ID: {messageId}</p>

                <p>
                    Recipient: <strong>{recipient}</strong>
                </p>

                <p>
                    Timer: <strong>{status}</strong>
                </p>

                <output
                    className="ghosting-announcement"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {statusLabels[status]}
                </output>
            </div>
        </section>
    );
}
