
export interface DrumPadDefinition {
    id: string;
    key: string;
    code: string;
    name: string;
    description: string;
    soundType: 'kick' | 'snare' | 'hihat' | 'tom' | 'clap';
    intensity: number;
}

export const DRUM_PADS: DrumPadDefinition[] = [
    {
        id: 'kick',
        key: 'W',
        code: 'KeyW',
        name: 'Kick',
        description: 'Bass drum',
        soundType: 'kick',
        intensity: 95,
    },
    {
        id: 'snare',
        key: 'A',
        code: 'KeyA',
        name: 'Snare',
        description: 'Snare drum',
        soundType: 'snare',
        intensity: 80,
    },
    {
        id: 'hihat',
        key: 'S',
        code: 'KeyS',
        name: 'Hi-Hat',
        description: 'Closed hi-hat',
        soundType: 'hihat',
        intensity: 55,
    },
    {
        id: 'tom',
        key: 'D',
        code: 'KeyD',
        name: 'Tom',
        description: 'Tom drum',
        soundType: 'tom',
        intensity: 75,
    },
    {
        id: 'clap',
        key: 'J',
        code: 'KeyJ',
        name: 'Clap',
        description: 'Hand clap',
        soundType: 'clap',
        intensity: 70,
    },
    {
        id: 'open-hihat',
        key: 'K',
        code: 'KeyK',
        name: 'Open Hat',
        description: 'Open hi-hat',
        soundType: 'hihat',
        intensity: 65,
    },
    {
        id: 'floor-tom',
        key: 'L',
        code: 'KeyL',
        name: 'Floor Tom',
        description: 'Low tom drum',
        soundType: 'tom',
        intensity: 85,
    },
];
