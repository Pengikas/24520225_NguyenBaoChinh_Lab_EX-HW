// src/AudioVisualizer.tsx
/**
 * HW 2: 60fps High-Performance Canvas Visualizer
 * Driven by requestAnimationFrame with ZERO state thrashing.
 * Decoupled from React render cycle; renders directly to 2D Canvas context.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FFTSize } from './audio-engine';

export type VisualizerMode = 'bars' | 'waveform' | 'radial' | 'particles';

interface AudioVisualizerProps {
    analyserNode: AnalyserNode | null;
    fftSize: FFTSize;
    isPlaying: boolean;
    onFFTSizeChange?: (size: FFTSize) => void;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number;
    color: string;
    freqIndex: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    analyserNode,
    fftSize,
    isPlaying,
    onFFTSizeChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mode, setMode] = useState<VisualizerMode>('bars');
    const [showFps, setShowFps] = useState<boolean>(true);

    // Refs used inside requestAnimationFrame to guarantee ZERO React re-renders per frame
    const modeRef = useRef<VisualizerMode>(mode);
    modeRef.current = mode;

    const analyserRef = useRef<AnalyserNode | null>(analyserNode);
    analyserRef.current = analyserNode;

    const isPlayingRef = useRef<boolean>(isPlaying);
    isPlayingRef.current = isPlaying;

    const showFpsRef = useRef<boolean>(showFps);
    showFpsRef.current = showFps;

    // Peak holders for falling gravity caps in 'bars' mode
    const peaksRef = useRef<Float32Array | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    // Frame metrics directly inside RAF
    const fpsTrackerRef = useRef<{
        frames: number;
        lastTime: number;
        currentFps: number;
        frameTimeMs: number;
    }>({
        frames: 0,
        lastTime: performance.now(),
        currentFps: 60,
        frameTimeMs: 16.6,
    });

    // Initialize particle field once
    const initParticles = useCallback((width: number, height: number) => {
        const count = 75;
        const particles: Particle[] = [];
        const colors = ['#00f2ff', '#0099ff', '#8a2be2', '#f000ff', '#ff3366'];

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                baseRadius: 2 + Math.random() * 3,
                radius: 3,
                color: colors[i % colors.length],
                freqIndex: Math.floor(Math.random() * 40),
            });
        }
        particlesRef.current = particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Buffers for audio frequency and time-domain data
        let freqData = new Uint8Array(analyserRef.current ? analyserRef.current.frequencyBinCount : 128);
        let timeData = new Uint8Array(analyserRef.current ? analyserRef.current.fftSize : 256);

        // Keep peaks array sized
        const updateBuffers = () => {
            if (analyserRef.current) {
                const binCount = analyserRef.current.frequencyBinCount;
                if (freqData.length !== binCount) {
                    freqData = new Uint8Array(binCount);
                    timeData = new Uint8Array(analyserRef.current.fftSize);
                    peaksRef.current = new Float32Array(binCount);
                }
            }
        };

        const renderFrame = (now: number) => {
            // Measure FPS and frame time without triggering React state updates
            const tracker = fpsTrackerRef.current;
            tracker.frames++;
            const delta = now - tracker.lastTime;
            if (delta >= 500) {
                tracker.currentFps = Math.round((tracker.frames * 1000) / delta);
                tracker.frameTimeMs = +(delta / tracker.frames).toFixed(1);
                tracker.frames = 0;
                tracker.lastTime = now;
            }

            updateBuffers();

            const width = canvas.width;
            const height = canvas.height;
            const currentMode = modeRef.current;
            const analyser = analyserRef.current;
            const playing = isPlayingRef.current;

            if (analyser && playing) {
                analyser.getByteFrequencyData(freqData);
                analyser.getByteTimeDomainData(timeData);
            } else {
                // If paused or stopped, decay frequency data smoothly to baseline
                for (let i = 0; i < freqData.length; i++) {
                    freqData[i] = Math.max(0, freqData[i] * 0.92 - 1);
                }
                for (let i = 0; i < timeData.length; i++) {
                    timeData[i] = 128; // flat center line
                }
            }

            // Clear frame with semi-transparent black for glowing motion trails
            ctx.fillStyle = 'rgba(8, 11, 17, 0.28)';
            ctx.fillRect(0, 0, width, height);

            // Render selected visualizer mode
            switch (currentMode) {
                case 'bars':
                    renderBarsMode(ctx, width, height, freqData, peaksRef.current);
                    break;
                case 'waveform':
                    renderWaveformMode(ctx, width, height, timeData);
                    break;
                case 'radial':
                    renderRadialMode(ctx, width, height, freqData);
                    break;
                case 'particles':
                    renderParticlesMode(ctx, width, height, freqData, particlesRef.current);
                    break;
            }

            // Render live 60fps diagnostic overlay on canvas (zero React state thrashing)
            if (showFpsRef.current) {
                renderDiagnosticsOverlay(ctx, tracker.currentFps, tracker.frameTimeMs, width, freqData.length);
            }

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        animationFrameId = requestAnimationFrame(renderFrame);

        // Explicit unmount cleanup to prevent memory leaks and zombie loops
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // ResizeObserver ensures crisp resolution without distortion
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            const w = Math.floor(rect.width * dpr);
            const h = Math.floor(rect.height * dpr);

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                initParticles(w, h);
            }
        };

        handleResize();
        const ro = new ResizeObserver(handleResize);
        ro.observe(container);

        return () => {
            ro.disconnect();
        };
    }, [initParticles]);

    return (
        <section
            aria-label="Real-time Audio Visualizer Engine"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                backgroundColor: '#0d131f',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            }}
        >
            {/* Visualizer Header Toolbar */}
            <header
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎛️</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                            Hardware-Accelerated Audio Visualizer
                        </h2>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            60 FPS • Web Audio AnalyserNode • Zero State Thrashing
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Visualizer Mode Switcher */}
                    <div
                        role="group"
                        aria-label="Visualizer Mode"
                        style={{
                            display: 'inline-flex',
                            backgroundColor: '#1e293b',
                            padding: '3px',
                            borderRadius: '8px',
                        }}
                    >
                        {(['bars', 'waveform', 'radial', 'particles'] as VisualizerMode[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                style={{
                                    border: 'none',
                                    background: mode === m ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
                                    color: mode === m ? '#ffffff' : '#94a3b8',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {/* FFT Size Selector (256 vs 512 bins) */}
                    <div
                        role="group"
                        aria-label="FFT Size"
                        style={{
                            display: 'inline-flex',
                            backgroundColor: '#1e293b',
                            padding: '3px',
                            borderRadius: '8px',
                        }}
                    >
                        {([256, 512] as FFTSize[]).map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => onFFTSizeChange?.(size)}
                                style={{
                                    border: 'none',
                                    background: fftSize === size ? '#8a2be2' : 'transparent',
                                    color: fftSize === size ? '#ffffff' : '#94a3b8',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                FFT {size} ({size / 2} bins)
                            </button>
                        ))}
                    </div>

                    {/* FPS Overlay Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowFps((prev) => !prev)}
                        style={{
                            border: '1px solid #334155',
                            background: showFps ? '#0f172a' : 'transparent',
                            color: showFps ? '#22c55e' : '#64748b',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                        title="Toggle 60FPS diagnostic telemetry overlay"
                    >
                        ⚡ FPS HUD
                    </button>
                </div>
            </header>

            {/* Canvas Viewport */}
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '280px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#080b11',
                    border: '1px solid #1e293b',
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>
        </section>
    );
};

/**
 * Mode 1: Frequency Equalizer Bars with Falling Peak Caps
 */
function renderBarsMode(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    peaks: Float32Array | null
) {
    const binsToRender = Math.min(freqData.length, 128);
    const barSpacing = 2;
    const barWidth = Math.max(1, (width - (binsToRender - 1) * barSpacing) / binsToRender);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#00f2ff');
    gradient.addColorStop(0.5, '#8a2be2');
    gradient.addColorStop(1, '#f000ff');

    ctx.fillStyle = gradient;

    for (let i = 0; i < binsToRender; i++) {
        const val = freqData[i];
        const barHeight = Math.max(2, (val / 255) * (height - 24));
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;

        // Draw frequency column
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak caps physics (gravity fall)
        if (peaks) {
            if (peaks[i] === undefined || barHeight > peaks[i]) {
                peaks[i] = barHeight;
            } else {
                peaks[i] = Math.max(0, peaks[i] - 1.2);
            }
            const peakY = height - peaks[i] - 3;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, peakY, barWidth, 2);
            ctx.fillStyle = gradient; // restore
        }
    }
}

/**
 * Mode 2: Oscilloscope Waveform (Laser Glow Neon Path)
 */
function renderWaveformMode(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeData: Uint8Array
) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f2ff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f2ff';

    ctx.beginPath();
    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0; // 0.0 - 2.0
        const y = (v * height) / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0; // reset
}

/**
 * Mode 3: Radial Circular Equalizer (360-Degree Audio Ring)
 */
function renderRadialMode(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array
) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.45;
    const binCount = Math.min(freqData.length, 96);
    const angleStep = (Math.PI * 2) / binCount;

    // Glowing center core
    const bassAvg = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / (4 * 255);
    const pulseRadius = baseRadius * (1 + bassAvg * 0.25);

    const radialGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, pulseRadius);
    radialGradient.addColorStop(0, 'rgba(240, 0, 255, 0.4)');
    radialGradient.addColorStop(0.7, 'rgba(0, 242, 255, 0.2)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Radial spokes
    ctx.lineWidth = 2.5;
    for (let i = 0; i < binCount; i++) {
        const angle = i * angleStep;
        const val = freqData[i] / 255;
        const barLen = val * (Math.min(centerX, centerY) * 0.4);

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barLen);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barLen);

        ctx.strokeStyle = `hsl(${(i / binCount) * 300}, 100%, 65%)`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

/**
 * Mode 4: Audio-Reactive Particle Starfield
 */
function renderParticlesMode(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    particles: Particle[]
) {
    const bass = (freqData[0] + freqData[1] + freqData[2]) / (3 * 255);

    for (const p of particles) {
        const freqVal = (freqData[p.freqIndex % freqData.length] || 0) / 255;
        p.radius = p.baseRadius + freqVal * 6 + bass * 4;

        // Position update
        p.x += p.vx * (1 + bass * 2);
        p.y += p.vy * (1 + bass * 2);

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

/**
 * Live 60 FPS Telemetry HUD rendered directly on canvas (Zero State Thrashing)
 */
function renderDiagnosticsOverlay(
    ctx: CanvasRenderingContext2D,
    fps: number,
    frameTime: number,
    width: number,
    bins: number
) {
    const text = `RAF: ${fps} FPS • ${frameTime}ms • ${bins} Bins • Zero State Thrashing`;
    ctx.font = '11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(width - textWidth - 20, 8, textWidth + 12, 22);

    ctx.fillStyle = fps >= 55 ? '#22c55e' : fps >= 30 ? '#eab308' : '#ef4444';
    ctx.fillText(text, width - textWidth - 14, 23);
}
