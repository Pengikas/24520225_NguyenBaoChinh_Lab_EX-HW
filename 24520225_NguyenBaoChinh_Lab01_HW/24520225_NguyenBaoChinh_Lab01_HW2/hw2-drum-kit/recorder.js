export class BeatRecorder {
    constructor() {
        this.events = [];
        this.isRecording = false;
        this.startTime = 0;
    }

    start() {
        this.events = [];
        this.isRecording = true;
        this.startTime =
            performance.now();
    }

    stop() {
        this.isRecording = false;
    }

    record(key) {
        if (!this.isRecording) {
            return;
        }

        const timestamp =
            performance.now()
            - this.startTime;

        this.events.push({
            key,
            timestamp
        });
    }

    clear() {
        this.events = [];
        this.isRecording = false;
        this.startTime = 0;
    }

    getEvents() {
        return [
            ...this.events
        ];
    }
}