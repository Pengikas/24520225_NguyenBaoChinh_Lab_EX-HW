/**
 * Re-exports the unified AudioTaskQueue from ../audio-queue-controller
 * so there is only a single FIFO queue implementation in the project.
 */
import {
    AudioTaskQueue,
    RecordedNoteEvent,
    PlaybackSpeed,
    SequencerState,
    SequencerSnapshot,
    QueueSubscriber,
} from '../audio-queue-controller';

export type {
    RecordedNoteEvent,
    PlaybackSpeed,
    SequencerState,
    SequencerSnapshot,
    QueueSubscriber as SequencerSubscriber,
};

export { AudioTaskQueue, AudioTaskQueue as FifoSequencer };
export default AudioTaskQueue;
