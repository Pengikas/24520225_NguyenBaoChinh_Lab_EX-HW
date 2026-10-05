import { AudioEngine }
from "./audio-engine.js";

const engine = new AudioEngine();

const pads = [
    ...document.querySelectorAll(
        ".drum-pad"
    )
];

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

async function triggerPad(pad) {
    if (!pad) {
        return;
    }

    const sound =
        pad.dataset.sound;

    await engine.play(sound);

    animatePad(pad);
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