# PROJECT_STRUCTURE.md – 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

**Course:** Web Application Development (Lab 03 — Homework 2)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Project:** 88-Key Polyphonic Piano Studio & Concurrent FIFO Audio Sequencer  
**Repository Branch:** `main`  
**Current Baseline Commit:** `2a7ac5d` (`feat(ui): assemble 88-key polyphonic piano studio`)

---

## 1. Project Overview

The **88-Key Polyphonic Piano Studio & Concurrent FIFO Sequencer** is an advanced interactive Web Audio synthesis and visualizer workstation built with React, TypeScript, and Vite. The system synthesizes four foundational concepts from Web Application Development:

1. **Algorithmic 88-Key Generation (Legacy Slide 27):** Complete mathematical generation of all 88 acoustic piano keys from MIDI note A0 (`21`) to C8 (`108`), comprising exactly 52 white keys and 36 black keys. Frequencies are dynamically computed using standard equal temperament:
   $$f = 440 \times 2^{\frac{\text{midi} - 69}{12}}$$
2. **React.memo Render Isolation (Lab 2 Slide 21):** High-frequency render isolation where each piano key is wrapped in `React.memo` with isolated pressed state and stable callbacks. Pressing or releasing a key re-renders **only that single key component**, preventing catastrophic 88-element re-render cascades.
3. **8-Voice Polyphony with Strict FIFO Voice Stealing:** Synthesizer architecture supporting up to 8 concurrent Web Audio `OscillatorNode` voices. When a 9th concurrent note is triggered, the synthesizer automatically identifies and steals the oldest active voice in First-In, First-Out (FIFO) order, applying smooth gain de-clicking before allocating the new voice.
4. **Concurrent FIFO AudioTaskQueue & Hardware Visualizer (Lab 2 HW2):** Integration of an asynchronous audio queue featuring `AbortController` cancellation tokens, explicit memory safety lifecycle management for `AudioBufferSourceNode`s, and a 60 FPS Canvas spectrum visualizer driven by `requestAnimationFrame` with zero React state thrashing.
5. **Architectural Principles from Lab 2 EX2:** Leveraging clean unidirectional data flow, root event delegation for pointer interactions, and ref-stabilized dispatch to avoid orphaned event listeners and stale closures.

---

## 2. Technology Stack & Runtime Environment

The table below documents the **actual versions** installed and resolved in the project repository (`package.json` and `package-lock.json`):

| Technology / Package | Specification in `package.json` | Installed / Resolved Version | Classification | Purpose in Project |
|---|---|---|---|---|
| **React** | `^18.3.1` | `18.3.1` | Production Dependency | Core component framework, Virtual DOM reconciliation, `React.memo` render isolation, concurrent hook dispatching |
| **React DOM** | `^18.3.1` | `18.3.1` | Production Dependency | DOM renderer for mounting the React tree into the browser host element (`#root`) |
| **TypeScript** | `^5.6.3` | `5.6.3` | Dev Dependency | Strict static typing, interface contracts (`PianoKeyData`, `AudioTask`, `AudioEngineMetrics`), generic state modeling |
| **Vite** | `^5.4.10` | `5.4.21` (resolved in lockfile) | Dev Dependency | Next-generation ESM dev server (HMR < 50ms) and Rollup-based production bundler |
| **@vitejs/plugin-react** | `^4.3.3` | `4.3.3` | Dev Dependency | Vite plugin providing Fast Refresh and Babel/SWC JSX transformation |
| **Web Audio API** | Native W3C Standard | Browser Native (`AudioContext`) | Hardware API | Native hardware-timed audio graph (`AudioContext`, `OscillatorNode`, `GainNode`, `AnalyserNode`, `AudioBufferSourceNode`) |
| **HTML5 Canvas 2D** | Native W3C Standard | Browser Native (`CanvasRenderingContext2D`) | Graphics API | 60 FPS frequency spectrum visualizer rendered in hardware without React DOM overhead |
| **Vitest** | `^2.1.9` | `2.1.9` | Dev Dependency | Unit and integration testing framework (21/21 passing tests for 88-key generator, FIFO polyphonic engine, and AudioTaskQueue) |

*Note on React Versioning:* The project currently executes on **React 18.3.1** (with `React.StrictMode` enabled in `src/main.tsx`). Architecture and hooks are designed to be forward-compatible with **React 19** compiler optimizations and automatic memoization.

---

## 3. Directory Tree & Implementation Status

The file structure below explicitly distinguishes between **currently implemented files** and **planned integration files**:

```text
24520225_NguyenBaoChinh_Lab03_HW2/
├── .gitignore                          [EXISTING] Standard node_modules, dist, and OS ignore rules
├── index.html                          [EXISTING] HTML5 host shell with #root container and dark theme
├── package.json                        [EXISTING] Dependency definitions and npm scripts (dev, build, preview)
├── package-lock.json                   [EXISTING] Deterministic dependency lockfile
├── tsconfig.json                       [EXISTING] TypeScript compiler configuration (ES2020, strict mode)
├── vite.config.ts                      [EXISTING] Vite configuration with @vitejs/plugin-react
├── README.md                           [EXISTING] Homework overview and setup guide
├── AI_FAILURE_AUDIT.md                 [EXISTING / UPDATED] Detailed audit of 4 AI defect modes, DevTools proofs & fixes
├── PROJECT_STRUCTURE.md                [EXISTING / UPDATED] Authoritative architectural blueprint & module contracts
├── TASK_DECOMPOSITION.md               [EXISTING / UPDATED] M0–M7 execution milestones, DoD criteria & git commit plans
├── dist/                               [EXISTING] Production build output generated by `npm run build`
│   ├── index.html                      (Production HTML entrypoint)
│   └── assets/                         (Compiled CSS and JS bundles)
├── evidence/                           [EXISTING / VERIFIED] Comprehensive verification screenshots
│   ├── M4/                             (9 PNGs: FIFO implementation, stealing, ordering, cleanup)
│   ├── M5/                             (9 PNGs: AudioTaskQueue architecture, FIFO, AbortController, cache)
│   ├── M6/                             (9 PNGs: Piano Studio UI overview, 88 keys, voice monitor, visualizer)
│   └── M7/                             (6 PNGs: 21 Vitest tests green, build code 0, test suites, git log)
└── src/
    ├── main.tsx                        [EXISTING] Application entrypoint mounting <App /> with StrictMode
    ├── App.tsx                         [IMPLEMENTED - M6] Complete Piano Studio: 88-key piano, 8-voice monitor, visualizer & sequencer
    ├── App.css                         [IMPLEMENTED - M6] Dark glassmorphism styles, cyber neon badges, 8 voice slots & responsive layout
    ├── AudioVisualizer.tsx             [EXISTING] 60 FPS HTML5 Canvas visualizer driven by requestAnimationFrame
    ├── audio-engine.ts                 [EXISTING] Web Audio graph, AnalyserNode (FFT 256/512), and explicit node disposal
    ├── audio-queue-controller.ts       [IMPLEMENTED - M5] Concurrent FIFO task queue with AbortController tokens & caching
    ├── audio-queue-controller.test.ts  [IMPLEMENTED - M5] Vitest suite verifying FIFO order, concurrency, abort tokens, & caching
    ├── audio-synth.ts                  [EXISTING] Offline 16-bit PCM WAV synthesizer producing test stems without CORS
    │
    ├── audio/
    │   ├── polyphonic-engine.ts        [IMPLEMENTED - M3/M4] 8-voice polyphonic synthesizer with FIFO voice stealing
    │   └── polyphonic-engine.test.ts   [IMPLEMENTED - M4] Vitest suite verifying 8-voice capacity, FIFO stealing, & cleanup
    │
    └── piano/
        ├── Piano.tsx                   [IMPLEMENTED - M2] 88-key piano keyboard layout with root delegation
        ├── PianoKey.tsx                [IMPLEMENTED - M2] Memoized key component (React.memo) with isolated pressed state
        ├── piano-types.ts              [IMPLEMENTED - M1] Types: KeyType, PianoKeyData, scientific pitch notation
        ├── piano-generator.ts          [IMPLEMENTED - M1] Algorithmic MIDI 21–108 generator & f=440*2^((m-69)/12)
        ├── piano-generator.test.ts     [IMPLEMENTED - M1] Vitest tests verifying 88 keys (52 white, 36 black)
        └── piano.css                   [IMPLEMENTED - M2] Piano key layout styling, overlapping black keys & pressed state
```

---

## 4. Module Responsibilities & Contracts

### 4.1 Existing Implemented Modules

| Module Path | Implementation State | Core Responsibilities | Key Exports / Classes |
|---|---|---|---|
| `src/main.tsx` | **Implemented** | Root bootstrap; mounts `<App />` under `React.StrictMode` into `#root`. | `main` |
| `src/App.tsx` | **Implemented (M4)** | Main workstation container. Coordinates transport controls, 8-voice polyphonic piano controls, FIFO voice stealing demonstration, seek bar, queue telemetry, and visualizer. | `App` |
| `src/App.css` | **Implemented** | Cyberpunk dark glassmorphism styling, responsive flex/grid layouts, neon badges, and visualizer container styling. | CSS styles |
| `src/audio-engine.ts` | **Implemented** | Core Web Audio management. Manages `AudioContext`, `AnalyserNode`, `GainNode`, and single-use `AudioBufferSourceNode` lifecycle disposal (`stop()`, `disconnect()`). | `AudioEngine`, `FFTSize`, `AudioEngineMetrics`, `PlaybackState` |
| `src/audio/polyphonic-engine.ts` | **Implemented (M3/M4)** | 8-voice polyphonic synthesizer engine. Maintains Map-based FIFO voice registry (`MAX_VOICES = 8`), executes click-free `stealOldestVoice()` when a 9th note arrives, enforces object identity guard on `onended`, and provides subscription hooks. | `PolyphonicEngine`, `Voice` |
| `src/audio/polyphonic-engine.test.ts` | **Implemented (M4)** | Comprehensive unit test suite covering 8-voice polyphony, 9th-note FIFO stealing, multiple replacements, stale callback prevention, and clean disposal. | Vitest Suite (8 tests) |
| `src/piano/piano-types.ts` | **Implemented (M1)** | Type definitions for the piano subsystem: `KeyType` ('white' \| 'black'), `PianoKeyData`, MIDI note boundaries (21–108). | `KeyType`, `PianoKeyData` |
| `src/piano/piano-generator.ts` | **Implemented (M1)** | Algorithmic generation of all 88 keys (MIDI 21 to 108); calculates note names, octaves, key types (52 white, 36 black), and exact frequencies via $f = 440 \times 2^{(midi - 69)/12}$. | `PIANO_KEYS`, `midiToFrequency()`, `generatePianoKeys()` |
| `src/piano/piano-generator.test.ts` | **Implemented (M1)** | Unit test suite asserting 88 total keys, 52 white keys, 36 black keys, A0–C8 range, and A4 = 440 Hz. | Vitest Suite (5 tests) |
| `src/piano/PianoKey.tsx` | **Implemented (M2)** | Memoized single piano key component using `React.memo`. Maintains isolated pressed state, binds pointer/touch events, and prevents sibling re-renders. | `PianoKey`, `PianoKeyProps` |
| `src/piano/Piano.tsx` | **Implemented (M2)** | Piano keyboard container component. Renders the 52 white keys and 36 black keys with correct overlapping positioning and root event delegation. | `Piano`, `PianoProps` |
| `src/piano/piano.css` | **Implemented (M2)** | High-contrast CSS styling for white keys and overlapping black keys (`margin-left: -12px; margin-right: -12px; z-index: 2`). | CSS styles |
| `src/audio-queue-controller.ts` | **Implemented** | Asynchronous FIFO concurrency controller. Handles stream downloading with progress telemetry, `AbortController` cancellation tokens, buffer caching, and FIFO execution. | `AudioTaskQueue`, `AudioTask`, `QueueSubscriber` |
| `src/audio-synth.ts` | **Implemented** | Offline 16-bit PCM WAV audio generator. Encodes Synthwave, Bassline, Ambient, and Arpeggio stems into Blob URLs for deterministic, CORS-free testing. | `PRESET_TRACKS`, `PresetTrack`, `encodeWav()` |
| `src/AudioVisualizer.tsx` | **Implemented** | Hardware-accelerated Canvas visualizer. Uses `requestAnimationFrame` with mutable `useRef` handles to guarantee **zero React state thrashing** during 60 FPS rendering. Supports 4 visual modes (bars, waveform, radial, particles). | `AudioVisualizer`, `VisualizerMode` |

### 4.2 Planned Integration Modules (Milestone M5)

| Module Path | Implementation State | Planned Responsibilities | Planned Exports / Classes |
|---|---|---|---|
| `src/components/Sequencer.tsx` | **Planned (M5)** | Step sequencer combining automated playback with the `AudioTaskQueue`. Dispatches notes to `PolyphonicEngine` and loads synthetic backing tracks through FIFO queue. | `Sequencer`, `SequencerProps` |

---

## 5. Architectural Data Flow & Subsystem Specifications

```mermaid
flowchart TD
    subgraph UI_Layer ["React UI & Render Layer"]
        App["App.tsx (Studio Harness)"]
        Piano["Piano.tsx (88-Key Container)"]
        Key["PianoKey.tsx (React.memo)"]
        Viz["AudioVisualizer.tsx (Canvas 60fps)"]
        Seq["Sequencer.tsx (FIFO Sequencer)"]
    end

    subgraph Audio_Layer ["Web Audio API Hardware Graph"]
        Context["AudioContext (Hardware Master Clock)"]
        PolyEngine["PolyphonicEngine (8-Voice Manager)"]
        VoiceReg["FIFO Voice Registry (Max 8 Voices)"]
        Osc1["OscillatorNode 1..8"]
        GainEnv["GainNode (ADSR Envelope)"]
        MasterGain["Master GainNode"]
        Analyser["AnalyserNode (FFT 256/512)"]
        Destination["AudioContext.destination (Speakers)"]
    end

    subgraph Queue_Layer ["Async Concurrency Queue"]
        ATQueue["AudioTaskQueue (FIFO Processing)"]
        AbortTok["AbortController (Signal Tokens)"]
        FetchPipe["Stream Fetch & Decode Pipeline"]
        BufferCache["AudioBuffer Cache"]
    end

    App --> Piano
    Piano -->|52 White / 36 Black Keys| Key
    Key -->|Pointer Event / noteOn| PolyEngine
    Seq -->|Automated Trigger| PolyEngine
    Seq -->|Background Stem Enqueue| ATQueue

    ATQueue --> AbortTok
    ATQueue --> FetchPipe
    FetchPipe --> BufferCache
    BufferCache --> Context

    PolyEngine --> VoiceReg
    VoiceReg -->|Voice Stealing if count > 8| PolyEngine
    PolyEngine --> Osc1
    Osc1 --> GainEnv
    GainEnv --> MasterGain
    MasterGain --> Analyser
    Analyser --> Destination

    Analyser -.->|Byte Frequency Data| Viz
    Viz -.->|requestAnimationFrame Loop| Viz
```

### 5.1 Piano Generation Pipeline (Milestone M1)
1. **Range Definition:** MIDI notes start at $A_0$ (`MIDI 21`) and end at $C_8$ (`MIDI 108`), yielding exactly $108 - 21 + 1 = 88$ keys.
2. **Frequency Calculation:** Each key calculates its fundamental frequency in Hertz:
   $$f(midi) = 440 \times 2^{\frac{midi - 69}{12}}$$
   *Example Checkpoints:*
   - $A_0$ (`MIDI 21`): $440 \times 2^{-4} = 27.50\text{ Hz}$
   - $A_4$ (`MIDI 69`): $440 \times 2^0 = 440.00\text{ Hz}$
   - $C_8$ (`MIDI 108`): $440 \times 2^{39/12} \approx 4186.01\text{ Hz}$
3. **Key Classification:** The 12-semitone cycle (`midi % 12`) classifies notes as white keys (`0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B`) or black keys (`1=C#, 3=D#, 6=F#, 8=G#, 10=A#`). Across 88 keys, this algorithm produces exactly **52 white keys** and **36 black keys**.
4. **Data Contract:**
   ```typescript
   export interface PianoKeyData {
       midiNumber: number;        // 21 .. 108
       noteName: string;          // e.g. "A0", "C4", "A4", "C8"
       octave: number;            // 0 .. 8
       keyType: 'white' | 'black';
       frequency: number;         // in Hz (rounded to 2 decimal places)
       isSharp: boolean;
   }
   ```

### 5.2 React Rendering & Isolation Pipeline (Milestone M2)
1. **Component Separation:** The keyboard renders through memoized `PianoKey` components.
2. **Memoization Invariant (`React.memo`):**
   ```tsx
   export const PianoKey = React.memo<PianoKeyProps>(({ keyData, isPressed, onNoteOn, onNoteOff }) => {
       // Component body renders single key DOM element
   }, (prevProps, nextProps) => {
       return prevProps.isPressed === nextProps.isPressed &&
              prevProps.keyData.midiNumber === nextProps.keyData.midiNumber;
   });
   ```
3. **Performance Guarantee:** When key `A4` is pressed, only the `PianoKey` component representing `A4` reconciles and paints. The other 87 keys are skipped by React's memoization equality check, maintaining a rock-solid 60 FPS under rapid polyphonic playing.

### 5.3 Polyphonic Audio Processing & FIFO Voice Stealing (Milestones M3 & M4)
1. **Voice Allocation (`noteOn`):**
   - User triggers key $\rightarrow$ calls `polyEngine.noteOn(midiNumber, frequency)`.
   - Engine inspects `activeVoices` array.
2. **Capacity Check & Stealing:**
   - If `activeVoices.length < 8`: Engine allocates a new voice slot immediately.
   - If `activeVoices.length === 8`: Polyphony limit reached. The engine performs **FIFO Voice Stealing**:
     1. Shifts the oldest active voice from the front of the registry: `oldestVoice = activeVoices.shift()`.
     2. Rapidly ramps the oldest voice gain to zero ($5\text{ms}$ linear ramp) to prevent audible clicks.
     3. Calls `stop()` and `disconnect()` on the stolen oscillator node.
     4. Instantiates and registers the new note voice at the back of the queue.
3. **Voice Release (`noteOff`):**
   - User releases key $\rightarrow$ calls `polyEngine.noteOff(midiNumber)`.
   - The voice gain ramps down through its release envelope ($100\text{ms}$ exponential decay).
   - Once silent, the oscillator is stopped and disconnected, and the slot is freed.

### 5.4 Concurrent AudioTaskQueue Pipeline (Milestone M5)
1. **Task Enqueueing:** Audio tracks or stems are enqueued via `audioQueue.enqueue(url, title)`.
2. **Strict FIFO Execution:** Tasks are queued in an array and processed one by one via `processNext()`.
3. **Cancellable Fetch & Decode:** Each task carries an `AbortController`. If cancelled by the user (`cancelActive()` or `clearQueue()`), the in-flight fetch stream is immediately severed with `AbortError`.
4. **Buffer Caching:** Successfully decoded `AudioBuffer` objects are stored in an in-memory `Map<string, AudioBuffer>` to avoid duplicate network transfers.

### 5.5 Audio Visualization Pipeline (Milestone M6)
1. **Hardware Routing:** `PolyphonicEngine` and `AudioEngine` connect their master gain nodes into a shared `AnalyserNode`.
2. **Decoupled Render Loop:** `AudioVisualizer.tsx` runs an independent `requestAnimationFrame` loop.
3. **Zero State Thrashing:** Frame metrics and frequency arrays (`Uint8Array`) are read in-place using React `useRef`. **No `useState` setter is ever invoked inside the 60 FPS animation loop.**

---

## 6. Dependency & Integration Architecture

The following dependency map illustrates the architectural hierarchy across UI components, audio services, and hardware layers:

```mermaid
classDiagram
    class App {
        +render()
        -handleNoteOn(midi)
        -handleNoteOff(midi)
        -handleEnqueueTrack(url)
    }

    class Piano {
        -keys: PianoKeyData[]
        -activeMidiNotes: Set~number~
        +render()
    }

    class PianoKey {
        +keyData: PianoKeyData
        +isPressed: boolean
        +render()
    }

    class PolyphonicEngine {
        -ctx: AudioContext
        -voiceRegistry: Voice[]
        -maxVoices: number = 8
        +noteOn(midi, freq)
        +noteOff(midi)
        +stealOldestVoice()
    }

    class AudioEngine {
        -ctx: AudioContext
        -analyser: AnalyserNode
        -masterGain: GainNode
        +playBuffer(buffer)
        +cleanupCurrentSource()
        +getAnalyserNode()
    }

    class AudioTaskQueue {
        -queue: AudioTask[]
        -bufferCache: Map
        +enqueue(url, title)
        +cancelActive()
        +clearQueue()
    }

    class AudioVisualizer {
        -canvasRef: Ref
        -analyserRef: Ref
        +renderFrame()
    }

    App --> Piano
    App --> AudioVisualizer
    App --> AudioTaskQueue
    Piano --> PianoKey : renders 88 instances
    Piano --> PolyphonicEngine : dispatches noteOn / noteOff
    PolyphonicEngine --> AudioEngine : routes audio into AnalyserNode
    AudioVisualizer ..> AudioEngine : reads frequency data
    AudioTaskQueue ..> AudioEngine : delivers decoded AudioBuffer
```

---

## 7. Build, Test, and Execution Commands

Based strictly on the scripts configured in `package.json`:

```bash
# 1. Install project dependencies
npm install

# 2. Run local development server (http://localhost:3000)
npm run dev

# 3. Compile TypeScript and build production bundle
npm run build

# 4. Preview production build locally
npm run preview

# 5. Execute all 52 automated unit & integration tests (Vitest)
npm test
```

---

## 8. HW 2 Engine Specification Compliance: Polyphonic Voice Pool & Async FIFO Replay

### 8.1 Canonical Polyphonic Voice Pool (`src/audio/PolyphonicSynth.js`)
- **File Location:** `src/audio/PolyphonicSynth.js` (with TypeScript declarations in `src/audio/PolyphonicSynth.d.ts` and unified re-export in `src/audio/polyphonic-engine.ts`).
- **Class Declaration:** `export class PolyphonicSynth`
- **Constructor Signature & Required Properties:**
  ```javascript
  constructor(maxVoices = 8) {
      this.ctx = null;
      this.maxVoices = maxVoices;
      this.voices = new Map();
  }
  ```
- **Method Signatures:**
  - `noteOn(midi, freqHz)`
  - `noteOff(midi)`
- **O(1) Active Voice Tracking via ES6 Map (Requirement A):**
  ```javascript
  if (this.voices.size >= this.maxVoices) {
      const oldestMidi = this.voices.keys().next().value;
      this.noteOff(oldestMidi);
  }
  ```
  - Registers each active voice with `this.voices.set(midi, { osc, gain })`.
- **Click-Free 40ms ADSR Envelope Ramp (Requirement B):**
  ```javascript
  gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.04
  );
  osc.stop(ctx.currentTime + 0.04);
  ```
  - Includes `osc.onended` identity guard (`currentVoice.osc === osc`) to prevent a releasing oscillator from deleting a newly re-triggered voice of the same MIDI note.

### 8.2 Unified `AudioTaskQueue` FIFO Recording, Variable-Speed Replay & `AbortController` (`src/audio-queue-controller.ts`)
- **File Location:** `src/audio-queue-controller.ts` (re-exported in `src/audio/fifo-sequencer.ts` so no competing queue exists).
- **Recorded Event Structure (Requirement C):**
  ```typescript
  export interface RecordedNoteEvent {
      midi: number;
      freqHz: number;
      durationMs: number;
      deltaMs: number;
  }
  ```
- **Supported Playback Speeds:** `0.5x`, `1.0x`, `2.0x` (`scheduledDelay = deltaMs / playbackSpeed`, `scheduledDuration = durationMs / playbackSpeed`).
- **`AbortController` Cancellation on Stop Sequence & Unmount (Requirement D):**
  - Each `replay(speed)` session instantiates `const controller = new AbortController()` and passes `controller.signal` to `waitAsync(scheduledDelay, signal)` and `scheduleAsyncNoteOff(..., signal)`.
  - `stopSequence()` calls `this.abortController.abort()`, clears all active timers, and calls `this.synth.dispose()` to immediately silence active oscillators.
  - Component unmount in `src/App.tsx` invokes `audioQueue.stopSequence()` and `polyphonicEngine.dispose()`.

### 8.3 Automated Test Suites & Evidence Directory
- **Automated Tests (6 suites, 53 passing tests):**
  - `src/audio/PolyphonicSynth.test.ts` (13 tests)
  - `src/audio/polyphonic-engine.test.ts` (10 tests)
  - `src/audio/fifo-sequencer.test.ts` (10 tests)
  - `src/audio-queue-controller.test.ts` (8 tests)
  - `src/piano/PianoKey.test.ts` (6 tests)
  - `src/piano/piano-generator.test.ts` (6 tests)
- **Verification Evidence (`evidence/HW2_Concurrency_Memory_Hygiene/` & `evidence/HW2_88_Key_Piano/`):**
  - `evidence/HW2_Concurrency_Memory_Hygiene/` (21 PNGs covering Map FIFO, ADSR, Recording/Replay, AbortController)
  - `evidence/HW2_88_Key_Piano/E01_Integration/` (`E01_01_project_file_mapping.png` .. `E01_03_lab2_queue_integration.png`)
  - `evidence/HW2_88_Key_Piano/E02_88_Key_Generation/` (`E02_01_generation_source.png` .. `E02_05_full_piano_runtime.png`)
  - `evidence/HW2_88_Key_Piano/E03_Polyphony_FIFO/` (`E03_01_eight_active_voices.png` .. `E03_04_voice_cleanup.png`)
  - `evidence/HW2_88_Key_Piano/E04_React_Memo_Profiler/` (`E04_01_piano_key_memo_source.png` .. `E04_05_other_87_keys_skipped.png`)
  - `evidence/HW2_88_Key_Piano/E05_AudioTaskQueue/` (`E05_01_original_queue_source.png` .. `E05_04_concurrency_limit.png`)
  - `evidence/HW2_88_Key_Piano/E06_Automated_Tests/` (`E06_01_generation_tests.png` .. `E06_05_build_result.png`)

### 8.4 HW 2 PianoKey Contract & 88-Key Integration (`src/piano/hw2-polyphonic-piano-contract.js` & `src/piano/PianoKey.tsx`)
- **Contract File:** `src/piano/hw2-polyphonic-piano-contract.js` (also re-exported at root `hw2-polyphonic-piano-contract.js` and typed in `src/piano/PianoKey.tsx`).
- **Component Signature & Required Identifiers:**
  ```jsx
  import { memo } from 'react';

  export const PianoKey = memo(function PianoKey({
    midi,
    noteName,
    isBlack,
    isPressed,
    onNoteOn,
    onNoteOff
  }) {
    return (
      <button
        type="button"
        className={`key ${isBlack ? 'key--black' : 'key--white'}`}
        aria-pressed={isPressed}
        onPointerDown={() => onNoteOn(midi)}
        onPointerUp={() => onNoteOff(midi)}
      >
        <span>{noteName}</span>
      </button>
    );
  }, shallowEqual);
  ```
- **Render Isolation:** Paired with `shallowEqual(prevProps, nextProps)` and stable `useCallback` handlers (`handleNoteOn`, `handleNoteOff`) plus `key={note.midi}` in `src/piano/Piano.tsx`, pressing 1 key re-renders only 1 `PianoKey` component while skipping the other 87 keys.


