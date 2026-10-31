import { memo } from 'react';

export function shallowEqual(prevProps, nextProps) {
  return (
    prevProps.midi === nextProps.midi &&
    prevProps.noteName === nextProps.noteName &&
    prevProps.isBlack === nextProps.isBlack &&
    prevProps.isPressed === nextProps.isPressed &&
    prevProps.onNoteOn === nextProps.onNoteOn &&
    prevProps.onNoteOff === nextProps.onNoteOff
  );
}

export const PianoKey = memo(function PianoKey({
  midi,
  noteName,
  isBlack,
  isPressed,
  onNoteOn,
  onNoteOff
}) {
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
