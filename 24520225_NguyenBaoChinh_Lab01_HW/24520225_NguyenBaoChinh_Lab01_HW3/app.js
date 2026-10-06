const countdownElement = document.getElementById("countdown");

const targetTime = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
);

function updateCountdown() {
    const now = new Date();

    const remaining = targetTime.getTime() - now.getTime();

    if (remaining <= 0) {
        countdownElement.textContent = "Launched!";
        return;
    }

    const totalSeconds = Math.floor(remaining / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent =
        `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

updateCountdown();

setInterval(updateCountdown, 250);

const form = document.getElementById("signup-form");
const emailInput = document.getElementById("email");
const submitButton = document.getElementById("submit-button");
const formStatus = document.getElementById("form-status");

const FORM_STATES = {
    IDLE: "IDLE",
    SUBMITTING: "SUBMITTING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR"
};

let currentState = FORM_STATES.IDLE;

function setFormState(newState) {
    currentState = newState;

    switch (currentState) {

        case FORM_STATES.IDLE:
            submitButton.disabled = false;
            submitButton.textContent = "Notify Me";
            formStatus.textContent = "";
            break;

        case FORM_STATES.SUBMITTING:
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
            formStatus.textContent = "Submitting your request...";
            break;

        case FORM_STATES.SUCCESS:
            submitButton.disabled = false;
            submitButton.textContent = "Submitted";
            formStatus.textContent =
                "Thank you! We will notify you.";
            break;

        case FORM_STATES.ERROR:
            submitButton.disabled = false;
            submitButton.textContent = "Try Again";
            formStatus.textContent =
                "Something went wrong. Please try again.";
            break;
    }
}

function submitForm() {
    return new Promise((resolve, reject) => {

        setTimeout(() => {

            const successful = true;

            if (successful) {
                resolve();
            } else {
                reject(new Error("Submission failed"));
            }

        }, 1000);
    });
}

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    setFormState(FORM_STATES.SUBMITTING);

    try {

        await submitForm();

        setFormState(FORM_STATES.SUCCESS);

    } catch (error) {

        setFormState(FORM_STATES.ERROR);
    }
});

setFormState(FORM_STATES.IDLE);