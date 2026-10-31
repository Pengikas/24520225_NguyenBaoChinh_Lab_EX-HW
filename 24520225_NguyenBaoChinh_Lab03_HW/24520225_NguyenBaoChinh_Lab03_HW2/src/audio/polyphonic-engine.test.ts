import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolyphonicEngine } from './polyphonic-engine';
import { AudioEngine } from '../audio-engine';

// Mock Web Audio API nodes for deterministic unit testing in Vitest
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

class MockAnalyserNode {
    connect = vi.fn();
    disconnect = vi.fn();
}

describe('M4: FIFO Voice Stealing Polyphonic Synthesizer', () => {
    let mockAudioContext: any;
    let mockAnalyserNode: any;
    let mockAudioEngine: any;
    let polyEngine: PolyphonicEngine;
    let createdOscillators: MockOscillatorNode[];
    let createdGains: MockGainNode[];

    beforeEach(() => {
        createdOscillators = [];
        createdGains = [];

        mockAudioContext = {
            currentTime: 10.0,
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

        mockAnalyserNode = new MockAnalyserNode();

        mockAudioEngine = {
            ensureContext: vi.fn(() => mockAudioContext),
            getAnalyserNode: vi.fn(() => mockAnalyserNode),
        } as unknown as AudioEngine;

        polyEngine = new PolyphonicEngine(mockAudioEngine);
    });

    it('Test A: supports up to eight simultaneous voices without stealing', () => {
        const initialChord = [60, 64, 67, 72, 76, 79, 84, 88];
        const voiceCounts: number[] = [];
        polyEngine.subscribeVoiceCount((c) => voiceCounts.push(c));

        initialChord.forEach((midi) => {
            const ok = polyEngine.noteOn(midi);
            expect(ok).toBe(true);
        });

        expect(polyEngine.getActiveVoiceCount()).toBe(8);
        expect(polyEngine.getActiveMidiNotes()).toEqual(initialChord);
        expect(voiceCounts[voiceCounts.length - 1]).toBe(8);
    });

    it('Test B: ninth note triggers FIFO stealing of the oldest voice (MIDI 60)', () => {
        const initialChord = [60, 64, 67, 72, 76, 79, 84, 88];
        initialChord.forEach((midi) => polyEngine.noteOn(midi));

        expect(polyEngine.getActiveVoiceCount()).toBe(8);
        expect(polyEngine.getActiveMidiNotes()[0]).toBe(60);

        const firstOscillator = createdOscillators[0];

        // Trigger 9th note
        const ninthOk = polyEngine.noteOn(90);
        expect(ninthOk).toBe(true);

        // Max voice capacity strictly maintained at 8
        expect(polyEngine.getActiveVoiceCount()).toBe(8);

        // Oldest voice (60) was removed, 90 was appended at the end
        const activeMidi = polyEngine.getActiveMidiNotes();
        expect(activeMidi).toEqual([64, 67, 72, 76, 79, 84, 88, 90]);
        expect(activeMidi.includes(60)).toBe(false);

        // First oscillator had stop scheduled
        expect(firstOscillator.stop).toHaveBeenCalled();
    });

    it('Test C: multiple sequential FIFO operations steal oldest notes in chronological sequence', () => {
        const initialChord = [60, 64, 67, 72, 76, 79, 84, 88];
        initialChord.forEach((midi) => polyEngine.noteOn(midi));

        // Add 4 additional notes sequentially: 90, 91, 92, 93
        // Expected stolen notes: 60 -> 64 -> 67 -> 72
        const additionalNotes = [90, 91, 92, 93];
        additionalNotes.forEach((midi) => {
            polyEngine.noteOn(midi);
        });

        expect(polyEngine.getActiveVoiceCount()).toBe(8);
        expect(polyEngine.getActiveMidiNotes()).toEqual([76, 79, 84, 88, 90, 91, 92, 93]);
    });

    it('Test D: stale onended callback does not delete a replacement voice of the same MIDI number', () => {
        // 1. Register MIDI 60 as voice 0
        polyEngine.noteOn(60);
        const oldOscillator = createdOscillators[0];

        // 2. Fill remaining 7 slots to reach 8 voices
        [64, 67, 72, 76, 79, 84, 88].forEach((midi) => polyEngine.noteOn(midi));
        expect(polyEngine.getActiveVoiceCount()).toBe(8);

        // 3. Steal MIDI 60 by triggering MIDI 90
        polyEngine.noteOn(90);
        expect(polyEngine.getActiveMidiNotes().includes(60)).toBe(false);

        // 4. Immediately re-register MIDI 60 (creating voice instance #2 for MIDI 60)
        // Steals MIDI 64
        polyEngine.noteOn(60);
        expect(polyEngine.getActiveMidiNotes().includes(60)).toBe(true);
        expect(polyEngine.getActiveVoiceCount()).toBe(8);

        // 5. Old oscillator #1 fires its delayed onended callback
        if (oldOscillator.onended) {
            oldOscillator.onended();
        }

        // 6. Object Identity Guard check: The new MIDI 60 voice must still be active!
        expect(polyEngine.getActiveMidiNotes().includes(60)).toBe(true);
        expect(polyEngine.getActiveVoiceCount()).toBe(8);
        expect(oldOscillator.disconnect).toHaveBeenCalled();
    });

    it('Test E: normal note release via noteOff cleanly transitions through release envelope', () => {
        polyEngine.noteOn(60);
        polyEngine.noteOn(64);
        expect(polyEngine.getActiveVoiceCount()).toBe(2);

        const osc60 = createdOscillators[0];

        // Trigger note off for 60
        const released = polyEngine.noteOff(60);
        expect(released).toBe(true);
        expect(osc60.stop).toHaveBeenCalled();

        // Simulate oscillator finished
        if (osc60.onended) {
            osc60.onended();
        }

        // Voice 60 removed from registry after onended
        expect(polyEngine.getActiveVoiceCount()).toBe(1);
        expect(polyEngine.getActiveMidiNotes()).toEqual([64]);
    });

    it('Test F: dispose() cleanly halts and disconnects all registered voices', () => {
        const chord = [60, 64, 67, 72, 76];
        chord.forEach((m) => polyEngine.noteOn(m));
        expect(polyEngine.getActiveVoiceCount()).toBe(5);

        polyEngine.dispose();

        expect(polyEngine.getActiveVoiceCount()).toBe(0);
        createdOscillators.forEach((osc) => {
            expect(osc.disconnect).toHaveBeenCalled();
        });
        createdGains.forEach((g) => {
            expect(g.disconnect).toHaveBeenCalled();
        });
    });

    it('rejects duplicate noteOn events for currently sounding keys', () => {
        polyEngine.noteOn(60);
        expect(polyEngine.getActiveVoiceCount()).toBe(1);

        // Triggering 60 again should return false and not add duplicate voice
        const duplicate = polyEngine.noteOn(60);
        expect(duplicate).toBe(false);
        expect(polyEngine.getActiveVoiceCount()).toBe(1);
    });

    it('rejects out-of-range or non-integer MIDI values', () => {
        expect(polyEngine.noteOn(-1)).toBe(false);
        expect(polyEngine.noteOn(128)).toBe(false);
        expect(polyEngine.noteOn(60.5)).toBe(false);
        expect(polyEngine.getActiveVoiceCount()).toBe(0);
    });
});

