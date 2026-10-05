export class AudioEngine {
    constructor() {
        this.context = null;
        this.buffers = new Map();
    }

    async initialize() {
        if (!this.context) {
            this.context = new AudioContext();
        }

        if (this.context.state === "suspended") {
            await this.context.resume();
        }
    }

    async load(url) {
        if (this.buffers.has(url)) {
            return this.buffers.get(url);
        }

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