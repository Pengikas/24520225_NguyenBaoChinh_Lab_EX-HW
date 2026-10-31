// src/App.tsx
/**
 * HW 2: Concurrent FIFO Audio Visualizer Queue Engine
 * Advanced async concurrency, audio frequency analysis, and zero memory leaks.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { AudioEngine, FFTSize, AudioEngineMetrics, PlaybackState } from './audio-engine';
import { AudioTaskQueue, AudioTask } from './audio-queue-controller';
import { AudioVisualizer } from './AudioVisualizer';
import { PRESET_TRACKS, PresetTrack } from './audio-synth';

// Singleton instances for persistent audio graph across renders
const audioEngine = new AudioEngine(256);
const audioQueue = new AudioTaskQueue(audioEngine.getAudioContext());

export const App: React.FC = () => {
    // UI reactive state
    const [queueItems, setQueueItems] = useState<readonly AudioTask[]>([]);
    const [activeTask, setActiveTask] = useState<AudioTask | null>(null);
    const [historyItems, setHistoryItems] = useState<readonly AudioTask[]>([]);
    const [isQueueProcessing, setIsQueueProcessing] = useState<boolean>(false);

    // Audio Playback state
    const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('No track loaded');
    const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.8);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [fftSize, setFftSize] = useState<FFTSize>(256);

    // Telemetry state
    const [metrics, setMetrics] = useState<AudioEngineMetrics>(audioEngine.getMetrics());

    // Custom URL input
    const [customUrl, setCustomUrl] = useState<string>('');
    const [customTitle, setCustomTitle] = useState<string>('');

    // Seek interval reference (polled at modest 4Hz for UI seek bar, decoupled from 60fps canvas)
    const progressTimerRef = useRef<number | null>(null);

    // Synchronize queue updates
    useEffect(() => {
        const updateQueueState = () => {
            setQueueItems(audioQueue.getQueue());
            setActiveTask(audioQueue.getActiveTask());
            setHistoryItems(audioQueue.getHistory());
            setIsQueueProcessing(audioQueue.getIsProcessing());
        };

        const unsubscribeQueue = audioQueue.subscribe(updateQueueState);
        updateQueueState();

        return () => {
            unsubscribeQueue();
        };
    }, []);

    // Synchronize audio engine updates
    useEffect(() => {
        const updateEngineState = () => {
            setPlaybackState(audioEngine.getPlaybackState());
            setMetrics(audioEngine.getMetrics());
            setDuration(audioEngine.getDuration());
            setVolume(audioEngine.getVolume());
            setIsMuted(audioEngine.getIsMuted());
            setFftSize(audioEngine.getFFTSize());
        };

        const unsubscribeEngine = audioEngine.subscribe(updateEngineState);
        updateEngineState();

        return () => {
            unsubscribeEngine();
        };
    }, []);

    // Low-frequency UI time tracker (250ms interval) to keep seek bar responsive without state thrashing
    useEffect(() => {
        if (playbackState === 'playing') {
            progressTimerRef.current = window.setInterval(() => {
                setCurrentTime(audioEngine.getCurrentPlaybackTime());
                setMetrics(audioEngine.getMetrics());
            }, 250);
        } else {
            if (progressTimerRef.current !== null) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
            }
            setCurrentTime(audioEngine.getCurrentPlaybackTime());
        }

        return () => {
            if (progressTimerRef.current !== null) {
                clearInterval(progressTimerRef.current);
            }
        };
    }, [playbackState]);

    /**
     * Enqueue a track into the FIFO Queue with AbortController concurrency management.
     */
    const handleEnqueueTrack = useCallback(async (url: string, title: string, autoPlay = true) => {
        try {
            audioEngine.ensureContext();
            const decodedBufferPromise = audioQueue.enqueue(url, title);
            const decodedBuffer = await decodedBufferPromise;

            if (autoPlay) {
                audioEngine.playBuffer(decodedBuffer);
                setCurrentTrackTitle(title);
            }
        } catch (err) {
            console.warn('Track enqueue or playback aborted/failed:', err);
        }
    }, []);

    /**
     * Enqueue a synthetic demo track
     */
    const handleEnqueuePreset = useCallback((preset: PresetTrack) => {
        const blobUrl = preset.generateUrl();
        handleEnqueueTrack(blobUrl, preset.title, true);
    }, [handleEnqueueTrack]);

    /**
     * Simulate high concurrency: queue all 4 preset tracks at once to showcase FIFO dispatch & decoding!
     */
    const handleSimulateConcurrentLoad = useCallback(() => {
        PRESET_TRACKS.forEach((track, idx) => {
            const blobUrl = track.generateUrl();
            // Automatically play the first one, let others queue in FIFO order
            handleEnqueueTrack(blobUrl, track.title, idx === 0);
        });
    }, [handleEnqueueTrack]);

    /**
     * Enqueue custom audio URL from user input
     */
    const handleEnqueueCustomUrl = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customUrl.trim()) return;
        const title = customTitle.trim() || customUrl.split('/').pop() || 'Remote Stream';
        handleEnqueueTrack(customUrl.trim(), title, true);
        setCustomUrl('');
        setCustomTitle('');
    };

    /**
     * Handle local audio file upload (MP3, WAV, OGG, FLAC)
     */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file, index) => {
            const objectUrl = URL.createObjectURL(file);
            handleEnqueueTrack(objectUrl, file.name, index === 0);
        });
    };

    /**
     * Transport playback controls
     */
    const handlePlayPause = () => {
        audioEngine.ensureContext();
        if (playbackState === 'playing') {
            audioEngine.pause();
        } else if (playbackState === 'paused') {
            audioEngine.resume();
        } else if (playbackState === 'stopped') {
            const currentBuf = audioEngine.getCurrentBuffer();
            if (currentBuf) {
                audioEngine.playBuffer(currentBuf);
            } else if (historyItems.length > 0 && historyItems[0].decodedBuffer) {
                audioEngine.playBuffer(historyItems[0].decodedBuffer);
                setCurrentTrackTitle(historyItems[0].title);
            }
        }
    };

    const handleStop = () => {
        audioEngine.stop();
        setCurrentTime(0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const targetTime = parseFloat(e.target.value);
        setCurrentTime(targetTime);
        audioEngine.seek(targetTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioEngine.setVolume(val);
    };

    const handleToggleMute = () => {
        audioEngine.toggleMute();
    };

    const handleFFTChange = (size: FFTSize) => {
        audioEngine.setFFTSize(size);
        setFftSize(size);
    };

    // Format seconds to mm:ss
    const formatTime = (sec: number): string => {
        if (!isFinite(sec) || isNaN(sec)) return '0:00';
        const mins = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="app-container">
            {/* Header Hero */}
            <header className="hero-header">
                <div className="hero-title-row">
                    <div>
                        <h1 className="hero-title">
                            HW 2: Concurrent FIFO Audio Visualizer Queue Engine
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                            Advanced async concurrency, audio frequency analysis, and zero memory leaks.
                        </p>
                    </div>

                    <div className="hero-badge-group">
                        <span className="badge badge-cyan">Web Audio API</span>
                        <span className="badge badge-purple">AnalyserNode ({fftSize / 2} bins)</span>
                        <span className="badge badge-green">FIFO Concurrency</span>
                        <span className="badge badge-cyan">AbortController Tokens</span>
                        <span className="badge badge-green">Zero Memory Leaks</span>
                        <span className="badge badge-purple">60 FPS Canvas</span>
                    </div>
                </div>
            </header>

            {/* Hardware-Accelerated Visualizer */}
            <AudioVisualizer
                analyserNode={audioEngine.getAnalyserNode()}
                fftSize={fftSize}
                isPlaying={playbackState === 'playing'}
                onFFTSizeChange={handleFFTChange}
            />

            {/* Playback Transport & Track Control Card */}
            <section className="card" aria-label="Audio Playback Controls">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Now Playing
                        </span>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                            {currentTrackTitle}
                        </h2>
                    </div>

                    {/* Time Counter */}
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', color: '#38bdf8' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                {/* Progress / Seek Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#64748b' }}>
                        {formatTime(currentTime)}
                    </span>
                    <input
                        type="range"
                        className="seek-bar"
                        min="0"
                        max={duration > 0 ? duration : 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        aria-label="Audio Seek Bar"
                        disabled={duration <= 0}
                    />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#64748b' }}>
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Buttons & Volume Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handlePlayPause}
                            title={playbackState === 'playing' ? 'Pause' : 'Play'}
                        >
                            {playbackState === 'playing' ? 'Pause' : 'Play'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleStop}
                            disabled={playbackState === 'stopped'}
                            title="Stop Playback and Clean Up AudioBufferSourceNode"
                        >
                            Stop
                        </button>
                    </div>

                    {/* Volume & Mute */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleToggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? 'Muted' : 'Sound'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            aria-label="Volume Slider"
                            style={{ width: '90px', cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#94a3b8', minWidth: '32px' }}>
                            {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                    </div>
                </div>
            </section>

            {/* Dashboard 2-Column Grid */}
            <div className="dashboard-grid">
                {/* Left Column: FIFO Concurrency Controller Panel */}
                <section className="card" aria-label="FIFO Queue Controller">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 className="card-title">
                            FIFO Concurrency Queue
                        </h2>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleSimulateConcurrentLoad}
                                title="Enqueue 4 tracks simultaneously to demonstrate FIFO queuing"
                            >
                                Concurrency Stress Test (4x)
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => audioQueue.clearQueue()}
                                disabled={queueItems.length === 0 && !activeTask}
                                title="Abort all pending and inflight tasks via AbortController tokens"
                            >
                                Abort All
                            </button>
                        </div>
                    </div>

                    {/* Active In-flight Task with AbortController Token */}
                    {activeTask ? (
                        <div
                            style={{
                                padding: '0.85rem',
                                backgroundColor: 'rgba(0, 242, 255, 0.05)',
                                border: '1px solid rgba(0, 242, 255, 0.25)',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <strong>Active Concurrency Task:</strong> {activeTask.title}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => audioQueue.cancelActive()}
                                    title="Cancel active task via AbortController"
                                >
                                    Cancel Token
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span>Status: <strong style={{ color: '#00f2ff', textTransform: 'capitalize' }}>{activeTask.status}</strong></span>
                                <span>•</span>
                                <span>Progress: {activeTask.progress}%</span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${activeTask.progress}%`,
                                        height: '100%',
                                        backgroundColor: '#00f2ff',
                                        transition: 'width 0.2s ease',
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.85rem', color: '#64748b', padding: '0.5rem 0' }}>
                            {isQueueProcessing ? 'Processing pipeline active...' : 'Queue idle. Select a track or enqueue new URLs below.'}
                        </div>
                    )}

                    {/* Pending FIFO Queue List */}
                    <div>
                        <h3 style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                            Pending Queue ({queueItems.length})
                        </h3>

                        {queueItems.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                No pending tracks in queue.
                            </div>
                        ) : (
                            <table className="queue-table" aria-label="Pending Audio Queue Table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>Track Title</th>
                                        <th>Status</th>
                                        <th style={{ width: '70px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queueItems.map((task, idx) => (
                                        <tr key={task.id}>
                                            <td style={{ fontFamily: 'JetBrains Mono', color: '#64748b' }}>{idx + 1}</td>
                                            <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{task.title}</td>
                                            <td>
                                                <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => audioQueue.cancelTask(task.id)}
                                                    title="Cancel task from queue"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Recent Processed History */}
                    {historyItems.length > 0 && (
                        <div>
                            <h3 style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                                Recent Processed Tasks ({historyItems.length})
                            </h3>
                            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                <table className="queue-table" aria-label="Task History Table">
                                    <thead>
                                        <tr>
                                            <th>Track Title</th>
                                            <th>Outcome</th>
                                            <th style={{ textAlign: 'right' }}>Play</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyItems.slice(0, 6).map((task) => (
                                            <tr key={task.id}>
                                                <td style={{ color: '#cbd5e1' }}>{task.title}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${task.status === 'completed'
                                                            ? 'badge-green'
                                                            : task.status === 'cancelled'
                                                                ? 'badge-amber'
                                                                : 'badge-danger'
                                                            }`}
                                                    >
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {task.decodedBuffer && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => {
                                                                audioEngine.playBuffer(task.decodedBuffer!);
                                                                setCurrentTrackTitle(task.title);
                                                            }}
                                                            title="Replay decoded buffer"
                                                        >
                                                            Play
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                 </table>
                             </div>
                         </div>
                     )}
                 </section>

                {/* Right Column: Track Ingestion & Diagnostics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Demo Preset Library Card */}
                    <section className="card" aria-label="Preset Tracks">
                        <h2 className="card-title">
                            Preset Audio Engine Library
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {PRESET_TRACKS.map((preset) => (
                                <div
                                    key={preset.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.65rem 0.85rem',
                                        backgroundColor: '#080b11',
                                        border: '1px solid #1e293b',
                                        borderRadius: '8px',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                                            {preset.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {preset.genre} • {preset.bpm} BPM • {preset.duration}s
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleEnqueuePreset(preset)}
                                        title="Enqueue into FIFO Audio Queue"
                                    >
                                        + Enqueue
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* File Upload & Custom URL Inputs */}
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                                Or Upload Custom Audio File:
                            </span>
                            <div style={{ marginTop: '0.35rem' }}>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    style={{
                                        fontSize: '0.8rem',
                                        color: '#cbd5e1',
                                        width: '100%',
                                    }}
                                />
                            </div>

                            {/* Custom URL Form */}
                            <form onSubmit={handleEnqueueCustomUrl} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                                    Enqueue Remote Track URL:
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/audio.mp3"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.4rem 0.6rem',
                                            backgroundColor: '#080b11',
                                            border: '1px solid #334155',
                                            borderRadius: '6px',
                                            color: '#f8fafc',
                                            fontSize: '0.8rem',
                                        }}
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={!customUrl.trim()}>
                                        Enqueue
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Memory Safety & Real-time Telemetry Card */}
                    <section className="card" aria-label="Memory Safety Telemetry">
                        <h2 className="card-title">
                            Memory Safety & Telemetry Monitor
                        </h2>
                        <div className="telemetry-grid">
                            <div className="telemetry-item">
                                <span className="telemetry-label">SourceNodes Created</span>
                                <span className="telemetry-val">{metrics.nodesCreated}</span>
                            </div>
                            <div className="telemetry-item">
                                <span className="telemetry-label">SourceNodes Cleaned</span>
                                <span className="telemetry-val" style={{ color: '#22c55e' }}>{metrics.nodesCleaned}</span>
                            </div>
                            <div className="telemetry-item">
                                <span className="telemetry-label">Active Node Status</span>
                                <span className="telemetry-val" style={{ color: metrics.activeSourceNode ? '#22c55e' : '#94a3b8' }}>
                                    {metrics.activeSourceNode ? 'Active (1)' : 'Idle (0)'}
                                </span>
                            </div>
                            <div className="telemetry-item">
                                <span className="telemetry-label">Audio Context</span>
                                <span className="telemetry-val" style={{ textTransform: 'capitalize' }}>
                                    {metrics.contextState}
                                </span>
                            </div>
                            <div className="telemetry-item">
                                <span className="telemetry-label">Sample Rate</span>
                                <span className="telemetry-val">{metrics.sampleRate} Hz</span>
                            </div>
                            <div className="telemetry-item">
                                <span className="telemetry-label">FFT Resolution</span>
                                <span className="telemetry-val">{fftSize} ({fftSize / 2} Bins)</span>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                            <strong>Zero Memory Leak Guarantee:</strong> AudioBufferSourceNodes are strictly single-use and explicitly cleaned up (stopped, disconnected, and de-referenced) upon every track transition, pause, or cancellation.
                        </div>
                    </section>
                </div>
            </div>

            {/* AI Failure Audit Reference Banner */}
            <footer
                style={{
                    padding: '1rem',
                    backgroundColor: '#0d131f',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                        Security & Code Integrity: AI Failure Mode Audit
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Documenting 3 detected bugs with DevTools proof and manual fixes in <code>AI_FAILURE_AUDIT.md</code>.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-cyan">1. Raw innerHTML Ingestion (XSS)</span>
                    <span className="badge badge-purple">2. Leaked AudioBufferSourceNodes</span>
                    <span className="badge badge-green">3. Phantom Keys & State Thrashing</span>
                </div>
            </footer>
        </div>
    );
};

export default App;