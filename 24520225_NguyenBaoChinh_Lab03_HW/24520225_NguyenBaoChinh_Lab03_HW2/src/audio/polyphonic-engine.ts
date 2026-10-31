/**
 * Re-exports the canonical PolyphonicSynth implementation from ./PolyphonicSynth.js
 * so there is only a single unified voice-pool engine across the project.
 */
import { PolyphonicSynth, SynthVoice } from './PolyphonicSynth.js';

export type Voice = SynthVoice;
export { PolyphonicSynth, PolyphonicSynth as PolyphonicEngine };
export default PolyphonicSynth;
