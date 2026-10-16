// src/audio-synth.ts
/**
 * Offline WAV Audio Generator for HW 2 Demo Tracks.
 * Creates synthetic musical tracks (Synthwave, Bassline, Ambient, Arpeggio)
 * encoded as standard PCM WAV Blobs / URLs to ensure 100% reliable offline testing
 * without CORS or network dependency issues.
 */

export interface PresetTrack {
    id: string;
    title: string;
    artist: string;
    duration: number; // in seconds
    bpm: number;
    genre: string;
    generateUrl: () => string;
}

/**
 * Encodes raw 16-bit PCM stereo data into a valid audio/wav Blob URL.
 */
function encodeWav(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): string {
    const numChannels = 2;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = leftChannel.length;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM interleaved samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        // Clamp and convert left sample
        const sL = Math.max(-1, Math.min(1, leftChannel[i]));
        view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
        offset += 2;

        // Clamp and convert right sample
        const sR = Math.max(-1, Math.min(1, rightChannel[i]));
        view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
        offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Track 1: Cyberpunk Synthwave (Punchy kick, rolling 16th-note synth bassline, bright lead chords)
 */
export function generateCyberpunkSynthwave(): string {
    const sampleRate = 44100;
    const duration = 12; // 12 seconds loop
    const totalSamples = sampleRate * duration;
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    const bpm = 124;
    const beatSec = 60 / bpm;
    const chordFrequencies = [
        [130.81, 164.81, 196.00], // C3 major
        [110.00, 130.81, 164.81], // A2 minor
        [146.83, 174.61, 220.00], // D3 minor
        [98.00, 123.47, 146.83],  // G2 major
    ];

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const beatIndex = Math.floor(t / beatSec);
        const beatPhase = (t % beatSec) / beatSec;

        // 1. Kick drum (every quarter note)
        const kickEnv = Math.exp(-beatPhase * 16);
        const kickFreq = 140 * Math.exp(-beatPhase * 28) + 45;
        const kick = Math.sin(2 * Math.PI * kickFreq * beatPhase) * kickEnv * 0.7;

        // 2. Snare / Clack (on beats 2 and 4)
        let snare = 0;
        if (beatIndex % 2 === 1) {
            const snareEnv = Math.exp(-beatPhase * 18);
            const noise = (Math.random() * 2 - 1) * snareEnv * 0.25;
            const snareTone = Math.sin(2 * Math.PI * 220 * beatPhase) * snareEnv * 0.25;
            snare = noise + snareTone;
        }

        // 3. Hi-Hat (every 16th note)
        const sixteenthPhase = (t % (beatSec / 4)) / (beatSec / 4);
        const hatEnv = Math.exp(-sixteenthPhase * 32);
        const hat = (Math.random() * 2 - 1) * hatEnv * 0.12;

        // 4. Bassline (rolling 8th notes)
        const chordIndex = Math.floor(t / (beatSec * 4)) % chordFrequencies.length;
        const baseFreq = chordFrequencies[chordIndex][0] * 0.5; // octave down
        const bassEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / (beatSec / 2)));
        const bass = (Math.sin(2 * Math.PI * baseFreq * t) + 0.4 * Math.sin(4 * Math.PI * baseFreq * t)) * bassEnv * 0.35;

        // 5. Synth Chords Pad
        const chord = chordFrequencies[chordIndex];
        let pad = 0;
        for (const f of chord) {
            pad += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
        }
        pad = (pad / chord.length) * 0.25;

        const mixL = kick + snare + hat * 0.7 + bass + pad * 0.9;
        const mixR = kick + snare + hat * 1.1 + bass + pad * 1.1;

        left[i] = mixL;
        right[i] = mixR;
    }

    return encodeWav(left, right, sampleRate);
}

/**
 * Track 2: Deep 808 Resonance (Sub-bass glides, crisp metallic percussion, stereo harmonics)
 */
export function generateDeep808Resonance(): string {
    const sampleRate = 44100;
    const duration = 10;
    const totalSamples = sampleRate * duration;
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    const bpm = 138;
    const beatSec = 60 / bpm;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const beatPhase = (t % beatSec) / beatSec;

        // 808 Sub glide
        const subPitch = 55 - 15 * Math.min(1, beatPhase * 3);
        const subEnv = Math.exp(-beatPhase * 4.2);
        const subBass = Math.sin(2 * Math.PI * subPitch * t) * subEnv * 0.85;

        // High frequency sparkle / metallic rim
        const sixteenth = (t % (beatSec / 4)) / (beatSec / 4);
        const rim = Math.sin(2 * Math.PI * 2400 * sixteenth) * Math.exp(-sixteenth * 45) * 0.15;

        // Ambient filtered chord
        const chordMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
        const ambientPad = (Math.sin(2 * Math.PI * 330 * t) + Math.sin(2 * Math.PI * 440 * t)) * chordMod * 0.15;

        left[i] = subBass * 0.9 + rim * 0.7 + ambientPad;
        right[i] = subBass * 0.9 + rim * 1.2 + ambientPad;
    }

    return encodeWav(left, right, sampleRate);
}

/**
 * Track 3: Ambient Stellar Field (Ethereal shimmering pads, deep low drone, binaural pulsations)
 */
export function generateAmbientStellarField(): string {
    const sampleRate = 44100;
    const duration = 14;
    const totalSamples = sampleRate * duration;
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        // Sub drone
        const drone = Math.sin(2 * Math.PI * 65.41 * t) * 0.35; // C2

        // Shimmer frequencies (pentatonic chord: C, D, E, G, A)
        const shimmer1 = Math.sin(2 * Math.PI * 523.25 * t + Math.sin(2 * Math.PI * 0.5 * t)) * 0.15;
        const shimmer2 = Math.sin(2 * Math.PI * 659.25 * t + Math.cos(2 * Math.PI * 0.7 * t)) * 0.12;
        const shimmer3 = Math.sin(2 * Math.PI * 783.99 * t) * 0.1;

        // Subtle binaural beating: 220Hz left, 222Hz right
        const binauralL = Math.sin(2 * Math.PI * 220 * t) * 0.2;
        const binauralR = Math.sin(2 * Math.PI * 222 * t) * 0.2;

        left[i] = drone + shimmer1 + shimmer3 * 0.7 + binauralL;
        right[i] = drone + shimmer2 + shimmer3 * 1.2 + binauralR;
    }

    return encodeWav(left, right, sampleRate);
}

/**
 * Track 4: 8-Bit Cyber Arpeggio (Fast 16th-note retro chiptune arpeggios with energetic pulse)
 */
export function generate8BitArpeggio(): string {
    const sampleRate = 44100;
    const duration = 8;
    const totalSamples = sampleRate * duration;
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 783.99]; // C arpeggio
    const speed = 12; // notes per second

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const noteIdx = Math.floor(t * speed) % notes.length;
        const freq = notes[noteIdx];

        // Square wave (classic 8-bit NES sound)
        const square = Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.3 : -0.3;

        // Chiptune noise kick on downbeats
        const beatPhase = (t % 0.5) / 0.5;
        const kick = Math.sin(2 * Math.PI * (120 - beatPhase * 80) * beatPhase) * Math.exp(-beatPhase * 14) * 0.4;

        left[i] = square * 0.7 + kick;
        right[i] = square * 0.7 + kick;
    }

    return encodeWav(left, right, sampleRate);
}

export const PRESET_TRACKS: PresetTrack[] = [
    {
        id: 'synthwave-odyssey',
        title: 'Cyberpunk Synthwave 124 BPM',
        artist: 'Synthetic Engine Core',
        duration: 12,
        bpm: 124,
        genre: 'Synthwave / Retro Electro',
        generateUrl: generateCyberpunkSynthwave,
    },
    {
        id: 'deep-808-resonance',
        title: 'Deep 808 Bass Resonance',
        artist: 'Sub-Frequency Lab',
        duration: 10,
        bpm: 138,
        genre: 'Trap / Sub-Bass',
        generateUrl: generateDeep808Resonance,
    },
    {
        id: 'ambient-stellar-field',
        title: 'Stellar Ambient Shimmer',
        artist: 'Harmonic Cosmos',
        duration: 14,
        bpm: 70,
        genre: 'Ambient / Ethereal',
        generateUrl: generateAmbientStellarField,
    },
    {
        id: 'retro-8bit-arpeggio',
        title: 'Neon 8-Bit Pixel Arpeggio',
        artist: 'Chiptune Matrix',
        duration: 8,
        bpm: 140,
        genre: 'Chiptune / Retro Gaming',
        generateUrl: generate8BitArpeggio,
    },
];
