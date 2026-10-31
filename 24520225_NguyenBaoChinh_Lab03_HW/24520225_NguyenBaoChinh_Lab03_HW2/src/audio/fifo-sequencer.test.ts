// src/audio/fifo-sequencer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FifoSequencer } from './fifo-sequencer';
import { PolyphonicSynth } from './PolyphonicSynth.js';
import { AudioEngine } from '../audio-engine';

describe('Requirements C & D: FIFO Recording, Variable-Speed Replay & AbortController Suite', () => {
    let audioEngine: AudioEngine;
    let polyphonicSynth: PolyphonicSynth;
    let sequencer: FifoSequencer;

    beforeEach(() => {
        vi.useFakeTimers();

        const mockGain = {
            value: 0.18,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            cancelScheduledValues: vi.fn(),
        };

        const mockOscillator = {
            type: 'triangle',
            frequency: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null,
        };

        const mockAnalyser = {
            fftSize: 256,
            frequencyBinCount: 128,
            smoothingTimeConstant: 0.82,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };

        const mockCtx = {
            currentTime: 10.0,
            state: 'running',
            sampleRate: 44100,
            destination: {},
            createGain: vi.fn(() => ({
                gain: mockGain,
                connect: vi.fn(),
                disconnect: vi.fn(),
            })),
            createOscillator: vi.fn(() => mockOscillator),
            createAnalyser: vi.fn(() => mockAnalyser),
            resume: vi.fn().mockResolvedValue(undefined),
        };

        audioEngine = new AudioEngine(256);
        (audioEngine as any).ctx = mockCtx;
        (audioEngine as any).analyser = mockAnalyser;

        polyphonicSynth = new PolyphonicSynth(8);
        polyphonicSynth.setAudioEngine(audioEngine);

        sequencer = new FifoSequencer(polyphonicSynth);
    });

    afterEach(() => {
        sequencer.dispose();
        polyphonicSynth.dispose();
        vi.useRealTimers();
    });

    describe('Requirement C: FIFO Note Recording ({ midi, freqHz, durationMs, deltaMs })', () => {
        it('1. Records exact event field names: midi, freqHz, durationMs, deltaMs', () => {
            sequencer.startRecording();
            sequencer.recordNoteOn(69, 440);
            vi.advanceTimersByTime(250);
            sequencer.recordNoteOff(69);
            sequencer.stopRecording();

            const events = sequencer.getEvents();
            expect(events).toHaveLength(1);
            expect(Object.keys(events[0]).sort()).toEqual(
                ['deltaMs', 'durationMs', 'freqHz', 'midi'].sort()
            );
        });

        it('2. Records accurate MIDI, freqHz, durationMs, and deltaMs in chronological FIFO order', () => {
            sequencer.startRecording();
            expect(sequencer.getState()).toBe('recording');

            // Note 1: C4 (MIDI 60)
            sequencer.recordNoteOn(60);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(60);

            // Note 2: E4 (MIDI 64) 150ms after Note 1 release (350ms after Note 1 start)
            vi.advanceTimersByTime(150);
            sequencer.recordNoteOn(64);
            vi.advanceTimersByTime(300);
            sequencer.recordNoteOff(64);

            // Note 3: G4 (MIDI 67) 100ms after Note 2 release (400ms after Note 2 start)
            vi.advanceTimersByTime(100);
            sequencer.recordNoteOn(67);
            vi.advanceTimersByTime(400);
            sequencer.recordNoteOff(67);

            sequencer.stopRecording();
            expect(sequencer.getState()).toBe('idle');

            const events = sequencer.getEvents();
            expect(events.length).toBe(3);

            // Event 1 (C4)
            expect(events[0].midi).toBe(60);
            expect(events[0].freqHz).toBeCloseTo(261.63, 2);
            expect(events[0].durationMs).toBe(200);
            expect(events[0].deltaMs).toBe(0);

            // Event 2 (E4)
            expect(events[1].midi).toBe(64);
            expect(events[1].freqHz).toBeCloseTo(329.63, 2);
            expect(events[1].durationMs).toBe(300);
            expect(events[1].deltaMs).toBe(350);

            // Event 3 (G4)
            expect(events[2].midi).toBe(67);
            expect(events[2].freqHz).toBeCloseTo(392.0, 2);
            expect(events[2].durationMs).toBe(400);
            expect(events[2].deltaMs).toBe(400);

            // FIFO ordering
            expect(events.map((e) => e.midi)).toEqual([60, 64, 67]);
        });

        it('3. Ignores duplicate noteOn and noteOff triggers while recording', () => {
            sequencer.startRecording();
            sequencer.recordNoteOn(60);
            sequencer.recordNoteOn(60); // duplicate

            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(60);
            sequencer.recordNoteOff(60); // duplicate

            sequencer.stopRecording();
            expect(sequencer.getEvents()).toHaveLength(1);
        });

        it('4. Clears recorded events and resets state when clearRecording() is called', () => {
            sequencer.startRecording();
            sequencer.recordNoteOn(60);
            vi.advanceTimersByTime(100);
            sequencer.recordNoteOff(60);
            sequencer.stopRecording();

            expect(sequencer.getEvents().length).toBe(1);

            sequencer.clearRecording();
            expect(sequencer.getEvents().length).toBe(0);
            expect(sequencer.getState()).toBe('idle');
            expect(sequencer.getTotalDurationMs()).toBe(0);
        });
    });

    describe('Requirement C: Asynchronous FIFO Replay at Variable Speeds (0.5x, 1.0x, 2.0x)', () => {
        beforeEach(() => {
            sequencer.startRecording();
            sequencer.recordNoteOn(60);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(60);

            vi.advanceTimersByTime(100);
            sequencer.recordNoteOn(64);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(64);

            vi.advanceTimersByTime(100);
            sequencer.recordNoteOn(67);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(67);

            sequencer.stopRecording();
        });

        it('1. Replays at normal 1.0x speed in exact FIFO order without mutating recordedEvents', async () => {
            const noteOnSpy = vi.spyOn(polyphonicSynth, 'noteOn');
            const noteOffSpy = vi.spyOn(polyphonicSynth, 'noteOff');
            const beforeReplayCopy = JSON.stringify(sequencer.getEvents());

            const replayPromise = sequencer.replay(1.0);
            expect(sequencer.getState()).toBe('replaying');
            expect(sequencer.getPlaybackSpeed()).toBe(1.0);

            // First note (deltaMs = 0) triggers immediately
            await vi.advanceTimersByTimeAsync(10);
            expect(noteOnSpy).toHaveBeenCalledWith(60, 261.63);

            await vi.advanceTimersByTimeAsync(200);
            expect(noteOffSpy).toHaveBeenCalledWith(60);

            // Second note (deltaMs = 300) triggers at 300ms
            await vi.advanceTimersByTimeAsync(100);
            expect(noteOnSpy).toHaveBeenCalledWith(64, 329.63);

            await vi.advanceTimersByTimeAsync(200);
            expect(noteOffSpy).toHaveBeenCalledWith(64);

            // Third note (deltaMs = 300) triggers at 600ms
            await vi.advanceTimersByTimeAsync(100);
            expect(noteOnSpy).toHaveBeenCalledWith(67, 392);

            await vi.advanceTimersByTimeAsync(250);
            await replayPromise;

            expect(sequencer.getState()).toBe('idle');
            expect(JSON.stringify(sequencer.getEvents())).toBe(beforeReplayCopy);
        });

        it('2. Scales duration and delay proportionally at 2.0x double speed (deltaMs / 2.0)', async () => {
            const noteOnSpy = vi.spyOn(polyphonicSynth, 'noteOn');

            const replayPromise = sequencer.replay(2.0);
            expect(sequencer.getPlaybackSpeed()).toBe(2.0);

            await vi.advanceTimersByTimeAsync(5);
            expect(noteOnSpy).toHaveBeenCalledWith(60, 261.63);

            // Note 2 arrives in 300ms / 2.0 = 150ms
            await vi.advanceTimersByTimeAsync(150);
            expect(noteOnSpy).toHaveBeenCalledWith(64, 329.63);

            // Note 3 arrives in another 300ms / 2.0 = 150ms
            await vi.advanceTimersByTimeAsync(150);
            expect(noteOnSpy).toHaveBeenCalledWith(67, 392);

            await vi.advanceTimersByTimeAsync(200);
            await replayPromise;
            expect(sequencer.getState()).toBe('idle');
        });

        it('3. Scales duration and delay proportionally at 0.5x half speed (deltaMs / 0.5)', async () => {
            const noteOnSpy = vi.spyOn(polyphonicSynth, 'noteOn');

            const replayPromise = sequencer.replay(0.5);
            expect(sequencer.getPlaybackSpeed()).toBe(0.5);

            await vi.advanceTimersByTimeAsync(5);
            expect(noteOnSpy).toHaveBeenCalledWith(60, 261.63);

            // Note 2 arrives in 300ms / 0.5 = 600ms
            await vi.advanceTimersByTimeAsync(600);
            expect(noteOnSpy).toHaveBeenCalledWith(64, 329.63);

            // Note 3 arrives in another 300ms / 0.5 = 600ms
            await vi.advanceTimersByTimeAsync(600);
            expect(noteOnSpy).toHaveBeenCalledWith(67, 392);

            await vi.advanceTimersByTimeAsync(500);
            await replayPromise;
            expect(sequencer.getState()).toBe('idle');
        });
    });

    describe('Requirement D: AbortController Cancellation on Stop Sequence, Unmount & Re-Run', () => {
        beforeEach(() => {
            sequencer.startRecording();
            sequencer.recordNoteOn(60);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(60);

            vi.advanceTimersByTime(200);
            sequencer.recordNoteOn(64);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(64);

            vi.advanceTimersByTime(200);
            sequencer.recordNoteOn(67);
            vi.advanceTimersByTime(200);
            sequencer.recordNoteOff(67);

            sequencer.stopRecording();
        });

        it('1. Stop Sequence invokes controller.abort(), silences active oscillators, and prevents subsequent notes', async () => {
            const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
            const noteOnSpy = vi.spyOn(polyphonicSynth, 'noteOn');
            const disposeSpy = vi.spyOn(polyphonicSynth, 'dispose');

            const replayPromise = sequencer.replay(1.0);

            // Let Note 1 (60) start
            await vi.advanceTimersByTimeAsync(50);
            expect(noteOnSpy).toHaveBeenCalledWith(60, 261.63);

            // Stop Sequence before Note 2 (64) and Note 3 (67) fire
            sequencer.stopSequence();

            expect(abortSpy).toHaveBeenCalled();
            expect(disposeSpy).toHaveBeenCalled();
            expect(sequencer.getState()).toBe('idle');

            // Advance timers far into the future: Note 2 and Note 3 must NEVER start
            await vi.advanceTimersByTimeAsync(2000);
            await replayPromise;

            expect(noteOnSpy).not.toHaveBeenCalledWith(64, expect.any(Number));
            expect(noteOnSpy).not.toHaveBeenCalledWith(67, expect.any(Number));
            expect(sequencer.getState()).toBe('idle');
        });

        it('2. Component unmount (dispose) safely cancels active replay and is idempotent when called multiple times', async () => {
            const disposeSpy = vi.spyOn(polyphonicSynth, 'dispose');
            const replayPromise = sequencer.replay(1.0);

            await vi.advanceTimersByTimeAsync(50);
            sequencer.dispose();
            // Second dispose call is safe and idempotent
            expect(() => sequencer.dispose()).not.toThrow();

            expect(disposeSpy).toHaveBeenCalled();
            expect(sequencer.getState()).toBe('idle');

            await vi.advanceTimersByTimeAsync(1000);
            await replayPromise;
        });

        it('3. Starting a new replay session after cancellation is isolated from the aborted session', async () => {
            const noteOnSpy = vi.spyOn(polyphonicSynth, 'noteOn');

            // Session 1 started and aborted mid-flight
            const session1 = sequencer.replay(1.0);
            await vi.advanceTimersByTimeAsync(50);
            sequencer.stopSequence();
            await session1;

            noteOnSpy.mockClear();

            // Session 2 started immediately after cancellation
            const session2 = sequencer.replay(2.0);
            expect(sequencer.getState()).toBe('replaying');

            await vi.advanceTimersByTimeAsync(1000);
            await session2;

            // Session 2 played all 3 notes in FIFO order cleanly
            expect(noteOnSpy.mock.calls.map((c) => c[0])).toEqual([60, 64, 67]);
            expect(sequencer.getState()).toBe('idle');
        });
    });
});
