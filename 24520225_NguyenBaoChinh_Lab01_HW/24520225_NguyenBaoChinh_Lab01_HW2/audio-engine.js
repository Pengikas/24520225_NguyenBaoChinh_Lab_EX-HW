export class AudioEngine {
    constructor() {
        this.context = null;
        this.buffers = new Map();
    }

    async initialize() {
        if (!this.context) {
            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;
            this.context = new AudioContextClass();
        }

        if (this.context.state === "suspended") {
            await this.context.resume();
        }
    }

    createSyntheticFallback(url) {
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
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * Math.exp(-i / (sampleRate * 0.02));
        }
        return buffer;
    }

    async load(url) {
        if (this.buffers.has(url)) {
            return this.buffers.get(url);
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Unable to load audio: ${url}`
                );
            }

            const arrayBuffer =
                await response.arrayBuffer();

            const audioBuffer =
                await this.context.decodeAudioData(
                    arrayBuffer
                );

            this.buffers.set(url, audioBuffer);

            return audioBuffer;
        } catch (error) {
            console.warn(
                `Loading ${url} via fetch failed (${error.message}). Using synthetic fallback.`
            );
            const fallbackBuffer = this.createSyntheticFallback(url);
            this.buffers.set(url, fallbackBuffer);
            return fallbackBuffer;
        }
    }

    async play(url) {
        await this.initialize();

        const buffer =
            await this.load(url);

        const source =
            this.context.createBufferSource();

        source.buffer = buffer;

        source.connect(
            this.context.destination
        );

        source.start();
    }
}