import { AudioEngine }
from "./audio-engine.js";

import { BeatRecorder }
from "./recorder.js";

window.__DRUM_KIT_LOADED__ = true;

const recorder =
    new BeatRecorder();

const engine = new AudioEngine();

const pads = [
    ...document.querySelectorAll(
        ".drum-pad"
    )
];

const recordButton = 
    document.querySelector(
        "#record-button"
    );

const playButton =
    document.querySelector(
        "#play-button"
    );

const clearButton =
    document.querySelector(
        "#clear-button"
    );

const status =
    document.querySelector(
        "#record-status"
    );

function getPadByKey(key) {
    const normalizedKey =
        key.toLowerCase();

    return pads.find(
        (pad) =>
            pad.dataset.key ===
            normalizedKey
    );
}

function animatePad(pad) {
    pad.classList.add("active");

    window.setTimeout(() => {
        pad.classList.remove(
            "active"
        );
    }, 100);
}

async function triggerPad(
    pad,
    shouldRecord = true
) {
    if (!pad) {
        return;
    }

    const sound =
        pad.dataset.sound;

    const key =
        pad.dataset.key;

    await engine.play(sound);

    animatePad(pad);

    if (shouldRecord) {
        recorder.record(key);
    }
}

pads.forEach((pad) => {
    pad.addEventListener(
        "click",
        () => triggerPad(pad)
    );
});

document.addEventListener(
    "keydown",
    (event) => {
        if (event.repeat) {
            return;
        }

        const pad =
            getPadByKey(event.key);

        triggerPad(pad);
    }
);

recordButton.addEventListener(
    "click",
    () => {
        if (
            recorder.isRecording
        ) {
            recorder.stop();

            recordButton.textContent =
                "Record";

            status.textContent =
                "Recording stopped";

            return;
        }

        recorder.start();

        recordButton.textContent =
            "Stop";

        status.textContent =
            "Recording...";
    }
);

clearButton.addEventListener(
    "click",
    () => {
        recorder.clear();

        recordButton.textContent =
            "Record";

        status.textContent =
            "Recording cleared";
    }
);

playButton.addEventListener(
    "click",
    () => {
        const events =
            recorder.getEvents();

        if (
            events.length === 0
        ) {
            status.textContent =
                "No beat recorded";

            return;
        }

        status.textContent =
            "Playing recording";

        events.forEach(
            ({ key, timestamp }) => {
                window.setTimeout(
                    () => {
                        const pad =
                            getPadByKey(
                                key
                            );

                        triggerPad(
                            pad,
                            false
                        );
                    },
                    timestamp
                );
            }
        );

        const finalEvent =
            events[
                events.length - 1
            ];

        window.setTimeout(
            () => {
                status.textContent =
                    "Playback finished";
            },
            finalEvent.timestamp
                + 300
        );
    }
);