# TASK_DECOMPOSITION.md

## Homework 2: Concurrent FIFO Audio Visualizer Queue Engine

**Course:** Web Application Development (Lab 02 — Homework 2)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Project:** Concurrent FIFO Audio Visualizer Queue Engine  
**Timeline:** 1-Week Production Engineering Sprint  
**Deliverables:** Web Audio API frequency analysis engine (FFT 256/512 bins), strict FIFO concurrency queue controller with `AbortSignal` cancellation tokens, explicit memory safety lifecycle management for `AudioBufferSourceNode`s, 60fps hardware-accelerated Canvas visualizer with zero React state thrashing, offline synthetic PCM WAV audio generator, telemetry dashboard, and comprehensive AI failure mode audit report.

---

## 1. Sprint Overview & Milestone Roadmap

The objective of Homework 2 is to design and implement an industrial-strength, enterprise-grade concurrent audio streaming and visualization engine. The architecture addresses three critical challenges in modern Web Audio and real-time frontend engineering:
1. **Asynchronous Concurrency Control:** Managing concurrent track enqueueing, stream downloading, and buffer decoding in strict FIFO sequence while enabling instantaneous user aborts.
2. **Memory Safety & Graph Lifecycle:** Preventing leaks caused by single-use `AudioBufferSourceNode`s, orphaned `requestAnimationFrame` loops, and unmanaged closures.
3. **High-Frequency Performance:** Rendering audio frequencies at 60 FPS without React state thrashing or garbage collection stutter.

```text
+---------------------------------------------------------------------------------------------------+
|                           HOMEWORK 2: 1-WEEK PRODUCTION SPRINT ROADMAP                            |
|                                                                                                   |
| [Day 1]  Phase 1: Concurrency Controller & FIFO Task Queue Architecture (`audio-queue-controller`) |
| [Day 2]  Phase 2: Web Audio API Graph & Frequency Spectrum Engine (`audio-engine.ts`)            |
| [Day 3]  Phase 3: Memory Safety Protocol & Explicit Node Lifecycle Management                    |
| [Day 4]  Phase 4: 60fps High-Performance Canvas Visualizer Engine (`AudioVisualizer.tsx`)       |
| [Day 5]  Phase 5: Client-Side Synthetic Audio Generator & Offline WAV Stems (`audio-synth.ts`)     |
| [Day 6]  Phase 6: Enterprise Control Dashboard & Real-Time Telemetry Monitor (`App.tsx`)         |
| [Day 7]  Phase 7: Heap Snapshot Profiling, Abort Verification, AI Failure Audit & Packaging     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Concurrency Controller & FIFO Task Queue Architecture (Day 1)
* **Goal:** Implement the asynchronous queue controller responsible for enqueueing audio tasks, orchestrating network streams, decoding audio buffers, and providing `AbortSignal` cancellation capabilities.
* **Component:** [src/audio-queue-controller.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/audio-queue-controller.ts)
* **Implementation Tasks:**
  1. **Contract Implementation:** Implement `AudioTaskQueue` matching the exact HW 2 criteria specification:
     ```typescript
     export class AudioTaskQueue {
       private queue: AudioTask[] = [];
       private isProcessing = false;
       private activeController: AbortController | null = null;
       async enqueue(trackUrl: string, title?: string): Promise<AudioBuffer>;
     }
     ```
  2. **FIFO Execution Pipeline:**
     - Maintain an internal queue array `queue: AudioTask[]`.
     - When `enqueue()` is called, generate an `AudioTask` containing a dedicated `AbortController` and push to queue.
     - Dispatch `processNext()` to process the oldest pending task first (`this.queue.shift()`).
  3. **Streaming Download with Progress Calculation:**
     - Fetch audio streams using `fetch(url, { signal: task.controller.signal })`.
     - Read body via `ReadableStreamDefaultReader` to compute incremental download progress (0% to 90%).
     - Periodically check `task.controller.signal.aborted` inside the chunk reader loop to terminate orphaned socket connections immediately upon cancellation.
  4. **Cancellation Handlers:**
     - `cancelActive()`: Aborts the actively downloading or decoding task.
     - `cancelTask(taskId)`: Aborts a specific pending or active task in the queue.
     - `clearQueue()`: Cancels active download and flushes all queued tasks with `DOMException('AbortError')`.
  5. **Buffer Caching:** Store successfully decoded buffers in `bufferCache = new Map<string, AudioBuffer>()` to enable zero-latency replaying.

---

### Phase 2: Web Audio API Graph & Frequency Spectrum Engine (Day 2)
* **Goal:** Architect the core Web Audio routing graph, integrate `AnalyserNode` for frequency analysis, and implement FFT resolution switching.
* **Component:** [src/audio-engine.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/audio-engine.ts)
* **Implementation Tasks:**
  1. **Autoplay Compliance & Lazy Context:**
     - Create `ensureContext()` to initialize or resume `AudioContext` only after explicit user gestures, adhering to modern browser autoplay policies.
  2. **Audio Routing Graph Construction:**
     - Construct standard routing pipeline:
       `AudioBufferSourceNode -> AnalyserNode -> GainNode -> AudioDestinationNode`.
  3. **Dual FFT Resolution Switching:**
     - Support dynamic toggle between **FFT 256** (produces 128 frequency bins) and **FFT 512** (produces 256 frequency bins) via `setFFTSize()`.
     - Set `smoothingTimeConstant = 0.82` for visually fluid frequency decay without jitter.
  4. **Master Volume & Muting:**
     - Implement smooth linear gain ramps using `GainNode.gain.setValueAtTime()`.

---

### Phase 3: Memory Safety Protocol & Explicit Node Lifecycle Management (Day 3)
* **Goal:** Eliminate memory leaks by strictly enforcing single-use `AudioBufferSourceNode` disposal and unbinding closures.
* **Component:** [src/audio-engine.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/audio-engine.ts)
* **Implementation Tasks:**
  1. **Disposal Sequence (`cleanupCurrentSource`):**
     - Step 1: Nullify `onended` handler to break circular references and prevent stale finish callbacks.
     - Step 2: Invoke `currentSource.stop()` wrapped in a protective try-catch block.
     - Step 3: Invoke `currentSource.disconnect()` to remove the node from the audio graph.
     - Step 4: Set `currentSource = null` to make the node eligible for Garbage Collection.
  2. **Fresh Node Instantiation per Playback:**
     - Because `AudioBufferSourceNode` is strictly single-use per W3C specification, always call `cleanupCurrentSource()` before instantiating a new node with `ctx.createBufferSource()`.
  3. **Telemetry Tracking:**
     - Maintain atomic counters `totalNodesCreated` and `totalNodesCleaned`.
     - Expose metrics through `getMetrics()` to verify `nodesCreated === nodesCleaned` at playback finish.
  4. **Engine Teardown (`dispose`):**
     - Disconnect analyser and gain nodes, close `AudioContext`, and clear all event listeners upon component unmount.

---

### Phase 4: 60fps High-Performance Canvas Visualizer Engine (Day 4)
* **Goal:** Build a 60fps audio visualizer powered by HTML5 Canvas and `requestAnimationFrame`, achieving zero React state thrashing.
* **Component:** [src/AudioVisualizer.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/AudioVisualizer.tsx)
* **Implementation Tasks:**
  1. **Zero State Thrashing Architecture:**
     - Prevent re-rendering overhead by eliminating `useState` / `setState` inside the `requestAnimationFrame` callback.
     - Store dynamic visualizer parameters (`mode`, `analyserNode`, `isPlaying`, `showFps`) in mutable React `useRef` handles.
  2. **In-Place Frequency Data Buffers:**
     - Pre-allocate `Uint8Array` for frequency data (`getByteFrequencyData`) and time-domain waveform data (`getByteTimeDomainData`).
     - Re-use arrays on every frame to avoid generating micro-garbage.
  3. **4 Distinct Visualization Modes:**
     - **Mode 1: Bars (Equalizer):** Vertical bars with cyber neon gradient and gravity-falling peak caps (`peaksRef`).
     - **Mode 2: Waveform (Oscilloscope):** Continuous time-domain laser wave with outer bloom glow.
     - **Mode 3: Radial (Circular Spectrum):** 360-degree radial frequency bars radiating from a central pulsing bass core.
     - **Mode 4: Particles (Starfield):** Audio-reactive floating particle field whose velocity and radii pulse with frequency bins.
  4. **Embedded Performance HUD:**
     - Calculate moving-average FPS and frame time (ms) directly inside RAF.
     - Render metrics directly to Canvas using `ctx.fillText()`, avoiding DOM paint thrashing.

---

### Phase 5: Client-Side Synthetic Audio Generator & Offline WAV Stems (Day 5)
* **Goal:** Ensure 100% deterministic, offline evaluation of the audio visualizer without relying on flaky third-party CDNs or triggering CORS blocks.
* **Component:** [src/audio-synth.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/audio-synth.ts)
* **Implementation Tasks:**
  1. **Binary PCM WAV Encoder:**
     - Implement `encodeWav()` to construct standard 44-byte RIFF/WAVE headers followed by interleaved 16-bit stereo PCM audio samples.
     - Export synthetic tracks as local `Blob` URLs (`URL.createObjectURL(blob)`).
  2. **Procedural Music Generation:**
     - Track 1: **Cyber Synthwave** (120 BPM) — Synth leads, analog chords, and punchy kick/snare rhythm.
     - Track 2: **Deep Bass Pulse** (95 BPM) — Sub-bass sweeps and harmonic distortion for low-frequency spectrum testing.
     - Track 3: **Neon Ambient Odyssey** (75 BPM) — Ethereal pad textures and stereo panning for mid-to-high frequency testing.
     - Track 4: **Fast Arpeggiator** (140 BPM) — Rapid 16th-note arpeggios for testing transient visualizer responsiveness.

---

### Phase 6: Enterprise Control Dashboard & Real-Time Telemetry Monitor (Day 6)
* **Goal:** Create a responsive, high-contrast studio interface with real-time queue observation and audio controls.
* **Components:** [src/App.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/App.tsx) & [src/App.css](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/src/App.css)
* **Implementation Tasks:**
  1. **Real-Time Queue Dashboard:**
     - Display active task with live streaming download percentage and animated pulse.
     - List pending FIFO tasks with task ID, title, and individual cancel button.
     - Provide queue history table showing completed and cancelled tasks with timestamps.
  2. **Memory Safety Telemetry Monitor:**
     - Real-time diagnostic cards showing:
       - Active Source Node (`true` / `false`)
       - Total Nodes Created vs Total Nodes Cleaned
       - AudioContext State (`running` / `suspended` / `closed`)
       - Current FFT Resolution & Active Frequency Bins
  3. **Audio Transport Controls:**
     - Play, Pause, Resume, Stop, Volume Slider, Mute Toggle.
     - Low-frequency throttled seek bar (polled at 4Hz / 250ms interval) to keep UI interactive without interfering with 60fps canvas.
  4. **Custom Audio Enqueueing:**
     - Input field allowing arbitrary remote audio URLs or local file testing.

---

### Phase 7: Heap Snapshot Profiling, Abort Verification & AI Audit (Day 7)
* **Goal:** Verify zero-leak invariants using Chrome DevTools Memory profiler, document AI failure modes, and package the deliverable.
* **Components:** [AI_FAILURE_AUDIT.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/AI_FAILURE_AUDIT.md), [README.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW2/README.md)
* **Implementation Tasks:**
  1. **Memory Heap Profiling:**
     - Take baseline heap snapshot; play, stop, and switch 50 tracks sequentially; take post-test heap snapshot.
     - Verify zero detached `AudioBufferSourceNode` and zero detached `HTMLCanvasElement` leaks.
  2. **AbortController Verification:**
     - Enqueue remote tracks, trigger cancellation during download, and capture console evidence confirming `task.controller.signal.aborted === true`.
  3. **AI Failure Mode Audit:**
     - Document 3 UI defect scenarios: raw `innerHTML` XSS vulnerability, unmanaged Web Audio node accumulation, and 60fps state thrashing.
     - Provide reproduction steps, root cause analysis, and verified production refactors.

---

## 3. Risk Management & Mitigation Matrix

| # | Risk Description | Likelihood | Impact | Engineering Mitigation Strategy |
|---|---|---|---|---|
| **R1** | **Web Audio Node Leaks** (`AudioBufferSourceNode` retained indefinitely) | High | Critical | Implement mandatory `cleanupCurrentSource()` method that stops, disconnects, and dereferences old nodes before allocating new ones. Track nodes via live telemetry counters. |
| **R2** | **Network Socket Leaks on Task Cancellation** | Medium | High | Pass `task.controller.signal` into `fetch()` and inspect `signal.aborted` inside the `ReadableStreamDefaultReader` loop, immediately cancelling stream readers upon abort. |
| **R3** | **React State Thrashing at 60 FPS** | High | Critical | Completely decouple `requestAnimationFrame` loop from React's state tree. Access all frame data via React `useRef` handles and render the FPS counter directly to Canvas via `ctx.fillText()`. |
| **R4** | **Browser Autoplay Policy Blocking Audio** | High | Medium | Instantiate or resume `AudioContext` only on explicit user interactions (`click`, `play`, `enqueue`). Guard calls with `.resume().catch(...)`. |
| **R5** | **CORS & Network Flakiness during Evaluation** | Medium | High | Integrate client-side 16-bit PCM WAV synthesizer (`audio-synth.ts`) generating 4 offline audio stems as instant local Blob URLs. |
| **R6** | **XSS Injection via Audio File Metadata** | Low | Critical | Completely eliminate `innerHTML` throughout the application. Rely exclusively on React JSX text escaping and secure DOM `replaceChildren()`. |

---

## 4. Definition of Done (DoD) Checklist

- [x] **Criterion 1 (Engine):** Web Audio API integration with `AnalyserNode` supporting dynamic toggle between FFT 256 (128 bins) and FFT 512 (256 bins).
- [x] **Criterion 2 (Concurrency Controller):** Strict FIFO Queue in `audio-queue-controller.ts` handling simultaneous track downloads and buffer decoding.
- [x] **Criterion 3 (Memory Safety):** Explicit cleanup of `AudioBufferSourceNode`s (stop, disconnect, unbind); cancellation tokens via `AbortController` cleanly severing network streams; zero memory leaks.
- [x] **Criterion 4 (Performance):** 60fps HTML5 Canvas visualizer driven by `requestAnimationFrame` with zero React state thrashing across 4 visualization modes (Bars, Waveform, Radial, Particles).
- [x] **Offline Testability:** Synthetic offline WAV generator provides 4 playable tracks without external network dependencies.
- [x] **AI Failure Audit:** Comprehensive `AI_FAILURE_AUDIT.md` delivered, analyzing XSS, memory leaks, and state thrashing.
- [x] **Code Cleanliness & Build:** Zero TypeScript compiler errors with `npm run build` (`tsc && vite build`).
- [x] **Specification Documentation:** `PROJECT_STRUCTURE.md` and `TASK_DECOMPOSITION.md` complete, synchronized, and committed.
