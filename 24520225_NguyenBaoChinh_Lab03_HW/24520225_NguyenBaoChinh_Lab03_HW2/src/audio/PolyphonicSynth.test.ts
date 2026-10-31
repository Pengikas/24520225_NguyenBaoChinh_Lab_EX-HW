import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolyphonicSynth } from './PolyphonicSynth.js';

class MockAudioParam {
    value = 0;
    setValueAtTime = vi.fn((val: number) => {
        this.value = val;
    });
    exponentialRampToValueAtTime = vi.fn((val: number) => {
        this.value = val;
    });
    cancelScheduledValues = vi.fn();
}

class MockOscillatorNode {
    type = 'triangle';
    frequency = new MockAudioParam();
    connect = vi.fn();
    disconnect = vi.fn();
    start = vi.fn();
    stop = vi.fn();
    onended: (() => void) | null = null;
}

class MockGainNode {
    gain = new MockAudioParam();
    connect = vi.fn();
    disconnect = vi.fn();
}

describe('PolyphonicSynth Specification Compliance Suite (Requirements A & B)', () => {
    let createdOscillators: MockOscillatorNode[];
    let createdGains: MockGainNode[];
    let mockAudioContext: any;

    beforeEach(() => {
        createdOscillators = [];
        createdGains = [];

        mockAudioContext = {
            currentTime: 5.0,
            state: 'running',
            destination: { id: 'mock-destination' },
            resume: vi.fn(() => Promise.resolve()),
            createOscillator: vi.fn(() => {
                const osc = new MockOscillatorNode();
                createdOscillators.push(osc);
                return osc;
            }),
            createGain: vi.fn(() => {
                const gain = new MockGainNode();
                createdGains.push(gain);
                return gain;
            }),
        };

        (globalThis as any).window = (globalThis as any).window || {};
        (globalThis as any).window.AudioContext = vi.fn(function () {
            return mockAudioContext;
        });
    });

    it('1. Constructor default maxVoices is 8 and this.ctx is null initially', () => {
        const synth = new PolyphonicSynth();
        expect(synth.maxVoices).toBe(8);
        expect(synth.ctx).toBeNull();
    });

    it('2. this.ctx initializes correctly on first noteOn(midi, freqHz)', () => {
        const synth = new PolyphonicSynth();
        expect(synth.ctx).toBeNull();

        synth.noteOn(60, 261.63);
        expect(synth.ctx).toBe(mockAudioContext);
    });

    it('3. this.voices is an ES6 Map instance', () => {
        const synth = new PolyphonicSynth();
        expect(synth.voices).toBeInstanceOf(Map);
        expect(synth.voices.size).toBe(0);
    });

    it('4. noteOn(midi, freqHz) creates a voice with { osc, gain } in this.voices', () => {
        const synth = new PolyphonicSynth();
        const result = synth.noteOn(69, 440);

        expect(result).toBe(true);
        expect(synth.voices.size).toBe(1);
        expect(synth.voices.has(69)).toBe(true);

        const voice = synth.voices.get(69);
        expect(voice).toBeDefined();
        expect(voice?.osc).toBe(createdOscillators[0]);
        expect(voice?.gain).toBe(createdGains[0]);
        expect(createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 5.0);
        expect(createdOscillators[0].connect).toHaveBeenCalledWith(createdGains[0]);
        expect(createdGains[0].connect).toHaveBeenCalledWith(mockAudioContext.destination);
        expect(createdOscillators[0].start).toHaveBeenCalledWith(5.0);
    });

    it('5. Duplicate MIDI does not create duplicate voices', () => {
        const synth = new PolyphonicSynth();
        expect(synth.noteOn(60, 261.63)).toBe(true);
        expect(synth.noteOn(60, 261.63)).toBe(false);

        expect(synth.voices.size).toBe(1);
        expect(createdOscillators).toHaveLength(1);
    });

    it('6. Eight voices can coexist in this.voices', () => {
        const synth = new PolyphonicSynth(8);
        const notes = [60, 64, 67, 72, 76, 79, 84, 88];

        notes.forEach((midi) => {
            expect(synth.noteOn(midi, 440)).toBe(true);
        });

        expect(synth.voices.size).toBe(8);
        expect(Array.from(synth.voices.keys())).toEqual(notes);
    });

    it('7. Ninth voice releases the oldest MIDI (60) via this.voices.keys().next().value', () => {
        const synth = new PolyphonicSynth(8);
        const initialNotes = [60, 64, 67, 72, 76, 79, 84, 88];
        initialNotes.forEach((midi) => synth.noteOn(midi, 440));

        const noteOffSpy = vi.spyOn(synth, 'noteOff');

        synth.noteOn(90, 1479.98);

        expect(noteOffSpy).toHaveBeenCalledWith(60);
        expect(synth.voices.size).toBe(8);
        expect(synth.voices.has(60)).toBe(false);
        expect(Array.from(synth.voices.keys())).toEqual([64, 67, 72, 76, 79, 84, 88, 90]);
    });

    it('8. Repeated voice stealing follows strict FIFO order (90->60, 91->64, 92->67, 93->72)', () => {
        const synth = new PolyphonicSynth(8);
        const initialNotes = [60, 64, 67, 72, 76, 79, 84, 88];
        initialNotes.forEach((midi) => synth.noteOn(midi, 440));

        const stolenPairs: Array<{ newMidi: number; oldestReleased: number }> = [];

        for (const newMidi of [90, 91, 92, 93]) {
            const oldestBefore = synth.voices.keys().next().value!;
            synth.noteOn(newMidi, 440);
            stolenPairs.push({ newMidi, oldestReleased: oldestBefore });
            expect(synth.voices.size).toBeLessThanOrEqual(8);
            expect(synth.voices.size).toBe(8);
        }

        expect(stolenPairs).toEqual([
            { newMidi: 90, oldestReleased: 60 },
            { newMidi: 91, oldestReleased: 64 },
            { newMidi: 92, oldestReleased: 67 },
            { newMidi: 93, oldestReleased: 72 },
        ]);

        expect(Array.from(synth.voices.keys())).toEqual([76, 79, 84, 88, 90, 91, 92, 93]);
    });

    it('9. noteOff(midi) releases the exact requested voice and removes it from this.voices', () => {
        const synth = new PolyphonicSynth(8);
        synth.noteOn(60, 261.63);
        synth.noteOn(64, 329.63);

        expect(synth.noteOff(60)).toBe(true);
        expect(synth.voices.has(60)).toBe(false);
        expect(synth.voices.has(64)).toBe(true);
        expect(synth.voices.size).toBe(1);

        // Duplicate release call is safely ignored
        expect(synth.noteOff(60)).toBe(false);
    });

    it('10. Release uses exact gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)', () => {
        const synth = new PolyphonicSynth(8);
        mockAudioContext.currentTime = 12.5;
        synth.noteOn(69, 440);

        mockAudioContext.currentTime = 13.0;
        synth.noteOff(69);

        const gainNode = createdGains[0];
        expect(gainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(13.0);
        expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
            0.0001,
            13.0 + 0.04
        );
    });

    it('11. osc.stop() is scheduled after the 0.04s release ramp', () => {
        const synth = new PolyphonicSynth(8);
        synth.noteOn(69, 440);

        mockAudioContext.currentTime = 20.0;
        synth.noteOff(69);

        const oscNode = createdOscillators[0];
        expect(oscNode.stop).toHaveBeenCalledWith(20.0 + 0.04);
    });

    it('12. onended cleanup is safe and stale onended cannot delete a newer voice with the same MIDI', () => {
        const synth = new PolyphonicSynth(8);
        synth.noteOn(60, 261.63);
        const firstOsc = createdOscillators[0];
        const firstGain = createdGains[0];

        synth.noteOff(60);

        // Re-trigger MIDI 60 before firstOsc.onended fires
        synth.noteOn(60, 261.63);
        const secondOsc = createdOscillators[1];
        expect(synth.voices.get(60)?.osc).toBe(secondOsc);

        // Stale onended fires now
        firstOsc.onended?.();

        expect(firstOsc.disconnect).toHaveBeenCalled();
        expect(firstGain.disconnect).toHaveBeenCalled();
        // New voice for MIDI 60 remains intact in Map!
        expect(synth.voices.has(60)).toBe(true);
        expect(synth.voices.get(60)?.osc).toBe(secondOsc);
    });

    it('13. dispose() releases and disconnects all active voices and clears this.voices', () => {
        const synth = new PolyphonicSynth(8);
        [60, 64, 67, 72].forEach((m) => synth.noteOn(m, 440));
        expect(synth.voices.size).toBe(4);

        synth.dispose();

        expect(synth.voices.size).toBe(0);
        createdOscillators.forEach((osc) => {
            expect(osc.stop).toHaveBeenCalled();
            expect(osc.disconnect).toHaveBeenCalled();
        });
        createdGains.forEach((g) => {
            expect(g.disconnect).toHaveBeenCalled();
        });
    });
});
