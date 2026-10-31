export type KeyType = 'white' | 'black';

export interface PianoKeyData {
    midi: number;
    noteName: string;
    isBlack: boolean;
    frequency: number;
    keyType: KeyType;
    octave: number;
}
