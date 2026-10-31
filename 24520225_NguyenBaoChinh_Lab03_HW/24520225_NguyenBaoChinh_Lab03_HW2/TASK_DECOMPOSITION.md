# TASK_DECOMPOSITION.md – 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

**Course:** Web Application Development (Lab 03 — Homework 2)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Project:** 88-Key Polyphonic Piano Studio & Concurrent FIFO Audio Sequencer  
**Repository Branch:** `main`  
**Current Baseline Commit:** `2a7ac5d` (`feat(ui): assemble 88-key polyphonic piano studio`)

---

## 1. Engineering Roadmap Overview

This document defines the comprehensive Work Breakdown Structure (WBS) and milestone roadmap for **Homework 2 (88-Key Polyphonic Piano & Concurrent FIFO Sequencer)**. The roadmap structures the project into **eight sequential engineering milestones (M0 through M7)**, bridging the algorithmic mathematical generation of acoustic piano keys with high-performance React component isolation, Web Audio polyphonic voice management, asynchronous FIFO concurrency queues, and hardware-accelerated spectrum visualization.

```text
+---------------------------------------------------------------------------------------------------------+
|                                HW2 IMPLEMENTATION MILESTONE ROADMAP                                      |
|                                                                                                         |
| [M0] Project Preparation & Architecture Baseline (Docs, Baseline Build, Audit Analysis)               |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M1] Algorithmic 88-Key Generation (MIDI 21–108, 52 White, 36 Black, Formula f = 440*2^((m-69)/12))    |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M2] React.memo Key Render Isolation (Isolated Pressed State, Zero Sibling Re-renders, Profiler)      |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M3] 8-Voice Polyphonic Synthesizer (Oscillator Voices, ADSR Envelope, noteOn/noteOff)                 |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M4] FIFO Voice Stealing Engine (Ordered Voice Registry, 9th Note Stealing, Click-Free Ramp)           |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M5] Concurrent FIFO AudioTaskQueue Integration (Async Fetch, AbortController, Decoding & Playback)     |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M6] Audio Visualizer & Piano Studio UI Assembly (Keyboard View, Sequencer, Canvas 60fps, Responsive) |
|   │                                                                                                     |
|   ▼                                                                                                     |
| [M7] Final Quality Verification, Evidence Capture & Production Build (Profiling, Audits, Packaging)    |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Milestone Work Breakdown

---

### Milestone M0: Project Preparation & Architectural Baseline

| Field | Description |
|---|---|
| **Objective** | Audit inherited Lab 2 HW2 codebase, establish baseline build integrity, analyze architectural requirements for 88-key piano integration, and author project documentation. |
| **Tasks** | 1. Inspect existing project repository: `package.json`, `src/App.tsx`, `audio-engine.ts`, `audio-queue-controller.ts`, `AudioVisualizer.tsx`.<br>2. Verify production build execution using `npm run build` (`tsc && vite build`).<br>3. Review architectural principles from Lab 2 EX2 (event delegation, state closures, avoiding orphan listeners).<br>4. Create and synchronize `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md`. |
| **Files** | • `AI_FAILURE_AUDIT.md` (Created / Updated)<br>• `PROJECT_STRUCTURE.md` (Created / Updated)<br>• `TASK_DECOMPOSITION.md` (Created / Updated) |
| **Acceptance Criteria** | 1. `npm run build` completes with exit code 0 and zero TypeScript/Vite errors.<br>2. All 3 documentation files are fully articulated, synchronized, and grounded in the actual codebase.<br>3. Installed package versions documented without invention (React 18.3.1, TypeScript 5.6.3, Vite 5.4.21). |
| **Testing** | Execute `npm run build` in terminal; inspect terminal output and bundle artifact sizes in `dist/`. |
| **Suggested Git Commit** | `git commit -m "docs(hw2): prepare piano integration architecture"` *(Suggested milestone commit; not executed automatically)* |
| **Evidence to Capture** | Terminal output of successful `npm run build`; git status confirming clean documentation files. |

---

### Milestone M1: Algorithmic 88-Key Keyboard Generation

| Field | Description |
|---|---|
| **Objective** | Algorithmically generate all 88 piano keys from MIDI A0 (`21`) to C8 (`108`) without hardcoding individual JSX elements, computing exact frequencies and classifying white/black keys. |
| **Tasks** | 1. Define piano data models in `src/types/piano-types.ts` (`PianoKeyData`, `KeyType`, `Octave`).<br>2. Implement algorithmic generator in `src/utils/piano-generator.ts` iterating MIDI numbers 21 through 108 inclusive.<br>3. Implement mathematical frequency formula: $f = 440 \times 2^{(midi - 69) / 12}$.<br>4. Implement semitone cycle pattern `(midi % 12)` to classify exactly 52 white keys and 36 black keys.<br>5. Format standard scientific pitch notation (e.g., $A_0$, $C_4$, $A_4 = 440\text{Hz}$, $C_8$). |
| **Files to Create / Modify** | • `src/types/piano-types.ts` (New)<br>• `src/utils/piano-generator.ts` (New) |
| **Acceptance Criteria** | 1. Algorithm generates an array of **exactly 88 keys**.<br>2. Contains **exactly 52 white keys** and **exactly 36 black keys**.<br>3. $A_4$ (`MIDI 69`) evaluates to exactly $440.00\text{ Hz}$; $A_0$ (`MIDI 21`) evaluates to $27.50\text{ Hz}$; $C_8$ (`MIDI 108`) evaluates to $4186.01\text{ Hz}$.<br>4. Zero hardcoded JSX keys. |
| **Testing** | Node/browser assertions checking key counts: `keys.length === 88`, `keys.filter(k => k.keyType === 'white').length === 52`, `keys.filter(k => k.keyType === 'black').length === 36`. |
| **Suggested Git Commit** | `git commit -m "feat(piano): generate algorithmic 88-key keyboard"` *(Suggested milestone commit)* |
| **Evidence to Capture** | Console assertion logs printing key count verification table and frequency calculations for reference notes ($A_0, C_4, A_4, C_8$). |

---

### Milestone M2: React.memo Key Render Isolation

| Field | Description |
|---|---|
| **Objective** | Implement memoized `PianoKey` components using `React.memo` such that pressing or releasing any single key re-renders **only that specific key component**. |
| **Tasks** | 1. Create `src/components/PianoKey.tsx` wrapped in `React.memo` with custom equality comparison or stable primitive props.<br>2. Maintain an isolated pressed visual state (`isPressed`, `aria-pressed`).<br>3. Ensure event callbacks (`onNoteOn`, `onNoteOff`) passed to `PianoKey` have stable references (via `useCallback` or parent event delegation).<br>4. Implement `src/components/Piano.tsx` container rendering the 88 keys in natural piano layout (white key horizontal flow with absolute-positioned black key overlays). |
| **Files to Create / Modify** | • `src/components/PianoKey.tsx` (New)<br>• `src/components/Piano.tsx` (New)<br>• `src/App.css` (Update keyboard styles) |
| **Acceptance Criteria** | 1. Pressing or releasing any single piano key triggers a re-render of **only 1 `PianoKey` component**.<br>2. The remaining 87 `PianoKey` components are skipped during Virtual DOM reconciliation.<br>3. Parent `Piano` container does not re-render unnecessarily on individual key presses. |
| **Testing** | Profile key interactions with **React Developer Tools Profiler**: verify that 87 components display *"Did not render"* and only the pressed key renders. |
| **Suggested Git Commit** | `git commit -m "feat(piano): isolate key renders with React memo"` *(Suggested milestone commit)* |
| **Evidence to Capture** | React DevTools Profiler flamegraph screenshot highlighting 1 active render and 87 memoized grayed-out keys. |

---

### Milestone M3: Eight-Voice Polyphonic Synthesizer

| Field | Description |
|---|---|
| **Objective** | Build a native Web Audio polyphonic synthesizer engine supporting up to 8 simultaneous oscillator voices with dedicated gain envelopes and click-free note activation. |
| **Tasks** | 1. Create `src/services/polyphonic-engine.ts` managing an internal array of up to 8 `Voice` instances.<br>2. For each voice, instantiate an `OscillatorNode` (customizable waveform: sine, triangle, sawtooth) and a dedicated `GainNode`.<br>3. Implement `noteOn(midiNumber, frequency)`: create and start oscillator, apply quick linear attack envelope ($5\text{ms}$) to eliminate DC clicks.<br>4. Implement `noteOff(midiNumber)`: apply exponential decay release envelope ($100\text{ms}$), then stop and disconnect nodes.<br>5. Route all active voices through a master synthesizer gain node into the studio `AnalyserNode`. |
| **Files to Create / Modify** | • `src/services/polyphonic-engine.ts` (New)<br>• `src/audio-engine.ts` (Expose audio graph connection points) |
| **Acceptance Criteria** | 1. Synthesizer plays up to 8 distinct notes simultaneously with clear harmonic separation and zero clipping.<br>2. Releasing a key cleanly terminates the corresponding voice node without residual background drone.<br>3. Accurate equal-tempered frequency reproduction verified against Web Audio oscillator frequency values. |
| **Testing** | Play an 8-note chord (e.g., C Major 9: C3, E3, G3, B3, D4, F4, A4, C5); verify all 8 oscillators are active in audio graph. |
| **Suggested Git Commit** | `git commit -m "feat(audio): implement eight-voice polyphonic synthesizer"` *(Suggested milestone commit)* |
| **Evidence to Capture** | Web Audio Inspector / DevTools log showing 8 concurrent active `OscillatorNode`s connected to Master Gain. |

---

### Milestone M4: FIFO Voice Stealing Engine

| Field | Description |
|---|---|
| **Objective** | Implement strict First-In, First-Out (FIFO) voice stealing when a ninth concurrent note is triggered, gracefully releasing the oldest active voice to make room for the new note. |
| **Tasks** | 1. Implement ordered `activeVoices` queue inside `PolyphonicEngine` tracking allocation timestamps.<br>2. Implement capacity detection: if `activeVoices.length >= 8` when `noteOn()` is called, trigger voice stealing.<br>3. Steal the oldest voice at index 0 (`activeVoices.shift()`):<br>   - Rapidly ramp stolen voice gain to zero over $5\text{ms}$ to prevent audible pop/click.<br>   - Stop and disconnect the stolen oscillator node.<br>4. Allocate the new 8th voice slot for the newly triggered MIDI note and push to back of queue.<br>5. Notify UI of stolen voice to update key pressed states synchronously. |
| **Files to Create / Modify** | • `src/services/polyphonic-engine.ts` (Update voice stealing algorithm)<br>• `src/types/piano-types.ts` (Add voice telemetry types) |
| **Acceptance Criteria** | 1. Triggering 8 notes holds all 8 active.<br>2. Triggering a 9th note immediately steals the 1st (oldest) note in strict FIFO order.<br>3. Active oscillator count never exceeds 8 at any moment.<br>4. Zero audible pops or clicks during rapid voice stealing. |
| **Testing** | Programmatically play notes sequentially: $N_1, N_2, \dots, N_9$. Verify $N_1$ is stopped upon $N_9$ trigger, leaving $N_2 \dots N_9$ active. |
| **Suggested Git Commit** | `git commit -m "feat(audio): implement FIFO voice stealing"` *(Suggested milestone commit)* |
| **Evidence to Capture** | Console telemetry log recording: `[FIFO Steal] Voice capacity reached (8/8). Stealing oldest voice: MIDI 21 (A0). Allocating new voice: MIDI 30.` |

---

### Milestone M5: Concurrent FIFO AudioTaskQueue Integration

| Field | Description |
|---|---|
| **Objective** | Integrate the existing asynchronous `AudioTaskQueue` architecture into the piano studio, enabling background stem loading, FIFO task execution, and `AbortController` cancellation. |
| **Tasks** | 1. Review and bind `src/audio-queue-controller.ts` with the piano studio state.<br>2. Support loading external or synthetic PCM WAV backing tracks in strict FIFO sequence.<br>3. Verify `AbortController` / `AbortSignal` cancellation tokens during in-flight network streaming and decoding.<br>4. Enforce explicit `AudioBufferSourceNode` disposal on playback stop or track replacement.<br>5. Implement a step sequencer interface (`src/components/Sequencer.tsx`) that schedules notes against the audio clock. |
| **Files to Create / Modify** | • `src/components/Sequencer.tsx` (New)<br>• `src/audio-queue-controller.ts` (Verify integration hooks)<br>• `src/audio-engine.ts` (Lifecycle integration) |
| **Acceptance Criteria** | 1. Enqueued audio tracks process in strict FIFO sequence without race conditions.<br>2. Cancelling an active task halts the network stream instantly with `AbortError`.<br>3. Single-use `AudioBufferSourceNode`s are strictly cleaned up, verified via `nodesCreated === nodesCleaned` telemetry. |
| **Testing** | Trigger concurrency stress test (enqueue 4 tracks at once); cancel active task mid-flight; verify subsequent task processes in FIFO order. |
| **Suggested Git Commit** | `git commit -m "feat(sequencer): integrate concurrent FIFO audio queue"` *(Suggested milestone commit)* |
| **Evidence to Capture** | DevTools Network panel showing `(canceled)` status on aborted fetch; queue table displaying completed FIFO task history. |

---

### Milestone M6: Audio Visualizer & Piano Studio UI Assembly

| Field | Description |
|---|---|
| **Objective** | Assemble the full 88-Key Piano Studio workstation, integrating keyboard controls, polyphonic synthesizer, FIFO sequencer, and 60 FPS Canvas spectrum visualizer into a responsive interface. |
| **Tasks** | 1. Mount `Piano.tsx` inside `App.tsx` with responsive horizontal scrolling, octave navigation, and key labels.<br>2. Connect synthesizer audio output into `AudioEngine`'s `AnalyserNode` (FFT 256/512).<br>3. Verify `AudioVisualizer.tsx` renders frequency spectrum in real time (bars, waveform, radial, particles) with zero React state updates.<br>4. Implement keyboard shortcuts (mapping computer keyboard QWERTY keys to piano octaves) with auto-repeat flood guards.<br>5. Integrate master volume, polyphony indicator, and telemetry HUD into responsive glassmorphism UI. |
| **Files to Create / Modify** | • `src/App.tsx` (Assemble layout and state hooks)<br>• `src/App.css` (Keyboard layout, responsive styling, scroll indicators)<br>• `src/AudioVisualizer.tsx` (Verify dual audio input analysis) |
| **Acceptance Criteria** | 1. Studio presents unified interface: 88-key piano, transport controls, FIFO queue monitor, and real-time visualizer.<br>2. Playing piano keys displays immediate real-time frequency animations on the Canvas visualizer.<br>3. UI maintains 60 FPS rendering without stuttering during polyphonic chord glissandos. |
| **Testing** | Play rapid 8-note chords and glissandos across the piano; inspect FPS HUD in visualizer and verify frame rate remains at ~60 FPS. |
| **Suggested Git Commit** | `git commit -m "feat(ui): assemble 88-key polyphonic piano studio"` *(Suggested milestone commit)* |
| **Evidence to Capture** | Full-screen workstation screenshot showing active piano keys, 60 FPS spectrum visualizer, and telemetry monitor. |

---

### Milestone M7: Final Testing, Verification & Production Packaging

| Field | Description |
|---|---|
| **Objective** | Perform end-to-end verification across all assignment criteria, capture grading evidence, complete memory profiling, and execute final production build. |
| **Tasks** | 1. Verify 88-key generation: assert 88 total, 52 white, 36 black keys, and exact frequency formulas.<br>2. Verify React.memo isolation using React Developer Tools Profiler.<br>3. Verify 8-voice polyphony and 9th-note FIFO voice stealing with audio telemetry.<br>4. Verify queue concurrency and AbortController cancellation in Chrome DevTools Network panel.<br>5. Verify zero memory leaks: `nodesCreated === nodesCleaned` and stable heap snapshots.<br>6. Execute final production build: `npm run build` (`tsc && vite build`).<br>7. Final review of documentation files: `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, `TASK_DECOMPOSITION.md`. |
| **Files to Create / Modify** | • All documentation files finalized.<br>• Production artifacts compiled into `dist/`. |
| **Acceptance Criteria** | 1. Zero build errors or TypeScript diagnostic warnings.<br>2. All 4 AI failure modes documented with reproduction protocols and DevTools evidence.<br>3. All milestones M0–M7 completed with clear verification logs. |
| **Testing** | Run full verification test suite; run `npm run build` and `npm run preview`. |
| **Suggested Git Commit** | `git commit -m "test(hw2): verify piano polyphony and sequencer behavior"` *(Suggested milestone commit)* |
| **Evidence to Capture** | Comprehensive test run logs, React Profiler export, and production bundle size report. |

---

## 3. Mandatory Milestone Git Commit Reference

The table below outlines the exact suggested commit messages matching the project specifications.

> [!IMPORTANT]
> These are suggested milestone commit messages to be executed progressively as each feature milestone is implemented and verified. They are not claimed to have been committed yet (current Git HEAD is `bd9440d`).

| Milestone | Conventional Git Commit Command | Status |
|---|---|---|
| **M0** | `git commit -m "docs(hw2): prepare piano integration architecture"` | Completed (`1dbafb1`) |
| **M1** | `git commit -m "feat(piano): generate algorithmic 88-key keyboard"` | Completed (`0347ed1`) |
| **M2** | `git commit -m "feat(piano): isolate key renders with React memo"` | Completed (`1807341`) |
| **M3** | `git commit -m "feat(audio): implement eight-voice polyphonic synthesizer"` | Completed (`fff370b`) |
| **M4** | `git commit -m "feat(audio): implement FIFO voice stealing"` | Completed (`ec66d37`) |
| **M5** | `git commit -m "feat(sequencer): integrate concurrent FIFO audio queue"` | Completed (`ec32919`) |
| **M6** | `git commit -m "feat(ui): assemble 88-key polyphonic piano studio"` | Completed (`2a7ac5d`) |
| **M7** | `git commit -m "test(hw2): verify piano polyphony and sequencer behavior"` | Completed (Current Milestone) |

---

## 4. Definition of Done (DoD) Checklist

- [x] **M0 Documentation Complete:** `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md` updated and synchronized.
- [x] **88-Key Keyboard Generation (M1):** Algorithmically generates MIDI 21–108 (52 white, 36 black keys) without hardcoded JSX.
- [x] **Equal Temperament Tuning (M1):** $f = 440 \times 2^{(midi - 69)/12}$ verified for all 88 notes.
- [x] **React.memo Render Isolation (M2):** Pressing 1 key re-renders only that key component, verified via React Profiler.
- [x] **8-Voice Polyphony (M3):** Synthesizer plays up to 8 concurrent oscillator voices without digital clipping.
- [x] **FIFO Voice Stealing (M4):** 9th concurrent note steals the oldest voice with smooth click-free ramp (8/8 tests pass).
- [x] **Concurrent FIFO Queue (M5):** AudioTaskQueue processes audio loading in FIFO sequence with AbortController tokens (8/8 tests pass).
- [x] **Piano Studio UI Assembly (M6):** Complete interface with 88 keys, 8 voice monitor slots, visualizer, transport, and sequencer.
- [x] **Memory Safety:** Explicit lifecycle cleanup of all audio nodes (`nodesCreated === nodesCleaned`).
- [x] **Zero State Thrashing Visualizer:** Canvas visualizer runs at 60 FPS via `requestAnimationFrame` with zero React re-renders.
- [x] **Comprehensive Vitest Suite:** 21 / 21 tests pass across 3 test suites.
- [x] **Production Build:** Passes `npm run build` (`tsc && vite build`) with exit code 0.
