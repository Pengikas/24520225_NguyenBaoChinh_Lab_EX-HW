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