# HW 2: Concurrent FIFO Audio Visualizer Queue Engine

**Student Name:** Nguyen Bao Chinh  
**Student ID (MSSV):** 24520225  
**Course:** Web Application Development (Lab 02 - HW 2)

---

## 🎯 Project Overview & Criteria Fulfilled

This application implements **HW 2: Concurrent FIFO Audio Visualizer Queue Engine**, featuring:

1. **Web Audio API Engine:**
   - Real-time frequency analysis via Web Audio `AnalyserNode`.
   - Dynamic FFT resolution toggle: **FFT 256** (128 bins) and **FFT 512** (256 bins).
   - Volume and mute control via `GainNode`.
   - Browser autoplay compliant initialization and context resumption.

2. **Concurrency Controller (`AudioTaskQueue`):**
   - Implements the exact specification contract from `audio-queue-controller.ts`.
   - Strict FIFO queue handling simultaneous track downloads and audio buffer decoding.
   - Concurrency control with `AbortSignal` / `AbortController` cancellation tokens.
   - Ability to cancel in-flight downloads, cancel individual queued items, and clear the queue.

3. **Memory Safety & Zero Memory Leaks:**
   - Explicit cleanup of single-use `AudioBufferSourceNode`s: stopped, disconnected from the graph, `onended` handlers unbound, and references dereferenced.
   - Cancellation tokens abort active fetch requests to prevent orphaned network streams and detached memory buffers.
   - Component unmounting cleanup cancelling `requestAnimationFrame` loops and closing/suspending audio contexts.
   - Real-time telemetry monitor showing created vs cleaned audio nodes.

4. **Performance Visualizer (60 FPS):**
   - 60 FPS HTML5 Canvas visualizer driven by `requestAnimationFrame`.
   - **Zero State Thrashing:** Visualizer loop is completely decoupled from React state rendering directly to canvas.
   - 4 Dynamic Visualization Modes:
     - **Bars:** Equalizer spectrum with gravity-falling peak caps.
     - **Waveform:** Oscilloscope laser glow neon wave.
     - **Radial:** 360-degree circular equalizer with pulsing bass core.
     - **Particles:** Audio-reactive floating particle starfield.
   - Canvas-rendered FPS HUD displaying real-time FPS and frame time (ms).

5. **Security & Code Integrity (AI Failure Audit):**
   - Comprehensive `AI_FAILURE_AUDIT.md` covering the 3 Classic AI Failure Modes in UI Development:
     1. Raw `innerHTML` ingestion (XSS).
     2. Memory leaks (event listeners, leaked AudioBufferSourceNodes, zombie RAF loops).
     3. Phantom keys & state thrashing.

---

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```
