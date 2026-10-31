import type { MemoExoticComponent, FC } from 'react';
import type { PianoKeyProps } from './PianoKey';

export declare function shallowEqual(
  prevProps: PianoKeyProps,
  nextProps: PianoKeyProps
): boolean;

export declare const PianoKey: MemoExoticComponent<FC<PianoKeyProps>>;
export default PianoKey;
