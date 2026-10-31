export type KeyType = 'white' | 'black';

export interface PianoKeyData {
    midi: number;
    noteName: string;
    frequency: number;
    keyType: KeyType;
    octave: number;
}