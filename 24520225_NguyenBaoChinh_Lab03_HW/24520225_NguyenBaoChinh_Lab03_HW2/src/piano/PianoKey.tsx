import { memo } from 'react';
import type { PianoKeyData } from './piano-types';

export interface PianoKeyProps {
  midi: number;
  noteName: string;
  isBlack: boolean;
  isPressed: boolean;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
  note?: PianoKeyData;
}

export interface PianoProfilerCommit {
  commitIndex: number;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  reRenderedMidis: number[];
  reRenderedCount: number;
  skippedCount: number;
  timestamp: number;
}

// Track per-commit shallowEqual comparisons for React Profiler verification
let pendingReRenderedMidis: number[] = [];
let pendingSkippedCount = 0;

export function consumePendingMemoStats(): { reRenderedMidis: number[]; skippedCount: number } {
  const stats = {
    reRenderedMidis: [...pendingReRenderedMidis],
    skippedCount: pendingSkippedCount,
  };
  pendingReRenderedMidis = [];
  pendingSkippedCount = 0;
  return stats;
}

export function shallowEqual(
  prevProps: PianoKeyProps,
  nextProps: PianoKeyProps
): boolean {
  const isEqual =
    prevProps.midi === nextProps.midi &&
    prevProps.noteName === nextProps.noteName &&
    prevProps.isBlack === nextProps.isBlack &&
    prevProps.isPressed === nextProps.isPressed &&
    prevProps.onNoteOn === nextProps.onNoteOn &&
    prevProps.onNoteOff === nextProps.onNoteOff &&
    (prevProps.note === nextProps.note ||
      Boolean(
        prevProps.note &&
          nextProps.note &&
          prevProps.note.midi === nextProps.note.midi &&
          prevProps.note.keyType === nextProps.note.keyType &&
          prevProps.note.isBlack === nextProps.note.isBlack &&
          prevProps.note.noteName === nextProps.note.noteName &&
          prevProps.note.frequency === nextProps.note.frequency
      ));

  if (isEqual) {
    pendingSkippedCount += 1;
  } else {
    pendingReRenderedMidis.push(nextProps.midi);
  }

  return isEqual;
}

export const PianoKey = memo(function PianoKey({
  midi,
  noteName,
  isBlack,
  isPressed,
  onNoteOn,
  onNoteOff
}: PianoKeyProps) {
  return (
    <button
      type="button"
      className={`key ${isBlack ? 'key--black' : 'key--white'}`}
      aria-pressed={isPressed}
      onPointerDown={() => onNoteOn(midi)}
      onPointerUp={() => onNoteOff(midi)}
    >
      <span>{noteName}</span>
    </button>
  );
}, shallowEqual);

export default PianoKey;
