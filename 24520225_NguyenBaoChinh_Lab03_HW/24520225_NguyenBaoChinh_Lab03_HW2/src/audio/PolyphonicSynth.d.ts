import { AudioEngine } from '../audio-engine';

export interface SynthVoice {
    osc: OscillatorNode;
    gain: GainNode;
    isReleasing?: boolean;
}

export declare class PolyphonicSynth {
    public ctx: AudioContext | null;
    public maxVoices: number;
    public voices: Map<number, SynthVoice>;
    public audioEngine: AudioEngine | null;

    constructor(maxVoices?: number | AudioEngine);

    public setAudioEngine(audioEngine: AudioEngine): void;
    public subscribeVoiceCount(listener: (count: number) => void): () => void;
    public subscribeVoices(listener: (activeMidis: number[], stolenMidi: number | null) => void): () => void;
    public getLastStolenMidi(): number | null;
    public noteOn(midi: number, freqHz?: number): boolean;
    public noteOff(midi: number): boolean;
    public getActiveVoiceCount(): number;
    public getMaxVoices(): number;
    public getVoice(midi: number): SynthVoice | undefined;
    public getActiveMidiNotes(): number[];
    public dispose(): void;
}

export default PolyphonicSynth;
