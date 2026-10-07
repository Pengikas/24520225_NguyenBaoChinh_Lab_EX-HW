// Fallback for file:// protocol where browsers block ES Modules (type="module") via CORS
(function () {
    window.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            if (window.__DRUM_KIT_LOADED__) {
                return;
            }

            console.warn(
                "Running in file:// mode: ES modules blocked by CORS, activating fallback engine."
            );

            class FallbackBeatRecorder {
                constructor() {
                    this.events = [];
                    this.isRecording = false;
                    this.startTime = 0;
                }

                start() {
                    this.events = [];
                    this.isRecording = true;
                    this.startTime = performance.now();
                }

                stop() {
                    this.isRecording = false;
                }

                record(key) {
                    if (!this.isRecording) return;
                    const timestamp = performance.now() - this.startTime;
                    this.events.push({ key, timestamp });
                }

                clear() {
                    this.events = [];
                    this.isRecording = false;
                    this.startTime = 0;
                }

                getEvents() {
                    return [...this.events];
                }
            }

            class FallbackAudioEngine {
                constructor() {
                    this.context = null;
                    this.buffers = new Map();
                }

                async initialize() {
                    if (!this.context) {
                        const AudioContextClass =
                            window.AudioContext || window.webkitAudioContext;
                        this.context = new AudioContextClass();
                    }
                    if (this.context.state === "suspended") {
                        await this.context.resume();
                    }
                }

                createSyntheticBuffer(url) {
                    const sampleRate = this.context.sampleRate;
                    const normalized = String(url).toLowerCase();

                    if (normalized.includes("kick")) {
                        const duration = 0.4;
                        const length = Math.floor(sampleRate * duration);
                        const buffer = this.context.createBuffer(1, length, sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < length; i++) {
                            const t = i / sampleRate;
                            const phase = 2 * Math.PI * (45 * t + (105 / 25) * (1 - Math.exp(-t * 25)));
                            const amp = Math.exp(-t * 10);
                            const click = Math.exp(-t * 120) * 0.4 * Math.sin(2 * Math.PI * 900 * t);
                            data[i] = (Math.sin(phase) + click) * amp;
                        }
                        return buffer;
                    }

                    if (normalized.includes("snare")) {
                        const duration = 0.3;
                        const length = Math.floor(sampleRate * duration);
                        const buffer = this.context.createBuffer(1, length, sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < length; i++) {
                            const t = i / sampleRate;
                            const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 28) * 0.45;
                            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.7;
                            data[i] = tone + noise;
                        }
                        return buffer;
                    }

                    if (normalized.includes("hihat")) {
                        const duration = 0.08;
                        const length = Math.floor(sampleRate * duration);
                        const buffer = this.context.createBuffer(1, length, sampleRate);
                        const data = buffer.getChannelData(0);
                        let last = 0;
                        for (let i = 0; i < length; i++) {
                            const t = i / sampleRate;
                            const raw = Math.random() * 2 - 1;
                            const hp = raw - last * 0.8;
                            last = raw;
                            const metal = (Math.sin(2 * Math.PI * 7500 * t) + Math.sin(2 * Math.PI * 9200 * t)) * 0.25;
                            data[i] = (hp * 0.75 + metal) * Math.exp(-t * 55);
                        }
                        return buffer;
                    }

                    if (normalized.includes("clap")) {
                        const duration = 0.35;
                        const length = Math.floor(sampleRate * duration);
                        const buffer = this.context.createBuffer(1, length, sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < length; i++) {
                            const t = i / sampleRate;
                            let env = 0;
                            if (t < 0.011) {
                                env = Math.exp(-t * 140) * 0.6;
                            } else if (t < 0.024) {
                                env = Math.exp(-(t - 0.011) * 140) * 0.7;
                            } else if (t < 0.038) {
                                env = Math.exp(-(t - 0.024) * 140) * 0.85;
                            } else {
                                env = Math.exp(-(t - 0.038) * 16) * 0.75;
                            }
                            data[i] = (Math.random() * 2 - 1) * env;
                        }
                        return buffer;
                    }

                    const buffer = this.context.createBuffer(1, Math.floor(sampleRate * 0.1), sampleRate);
                    return buffer;
                }

                async play(url) {
                    await this.initialize();
                    if (!this.buffers.has(url)) {
                        this.buffers.set(url, this.createSyntheticBuffer(url));
                    }
                    const buffer = this.buffers.get(url);
                    const source = this.context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this.context.destination);
                    source.start();
                }
            }

            const recorder = new FallbackBeatRecorder();
            const engine = new FallbackAudioEngine();
            const pads = [...document.querySelectorAll(".drum-pad")];
            const recordButton = document.querySelector("#record-button");
            const playButton = document.querySelector("#play-button");
            const clearButton = document.querySelector("#clear-button");
            const status = document.querySelector("#record-status");

            function getPadByKey(key) {
                const normalized = key.toLowerCase();
                return pads.find((pad) => pad.dataset.key === normalized);
            }

            function animatePad(pad) {
                pad.classList.add("active");
                setTimeout(() => pad.classList.remove("active"), 100);
            }

            async function triggerPad(pad, shouldRecord = true) {
                if (!pad) return;
                const sound = pad.dataset.sound;
                const key = pad.dataset.key;
                await engine.play(sound);
                animatePad(pad);
                if (shouldRecord) {
                    recorder.record(key);
                }
            }

            pads.forEach((pad) => {
                pad.addEventListener("click", () => triggerPad(pad));
            });

            document.addEventListener("keydown", (event) => {
                if (event.repeat) return;
                const pad = getPadByKey(event.key);
                triggerPad(pad);
            });

            recordButton.addEventListener("click", () => {
                if (recorder.isRecording) {
                    recorder.stop();
                    recordButton.textContent = "Record";
                    status.textContent = "Recording stopped";
                    return;
                }
                recorder.start();
                recordButton.textContent = "Stop";
                status.textContent = "Recording...";
            });

            clearButton.addEventListener("click", () => {
                recorder.clear();
                recordButton.textContent = "Record";
                status.textContent = "Recording cleared";
            });

            playButton.addEventListener("click", () => {
                const events = recorder.getEvents();
                if (events.length === 0) {
                    status.textContent = "No beat recorded";
                    return;
                }
                status.textContent = "Playing recording";
                events.forEach(({ key, timestamp }) => {
                    setTimeout(() => {
                        const pad = getPadByKey(key);
                        triggerPad(pad, false);
                    }, timestamp);
                });
                const finalEvent = events[events.length - 1];
                setTimeout(() => {
                    status.textContent = "Playback finished";
                }, finalEvent.timestamp + 300);
            });
        }, 50);
    });
})();
