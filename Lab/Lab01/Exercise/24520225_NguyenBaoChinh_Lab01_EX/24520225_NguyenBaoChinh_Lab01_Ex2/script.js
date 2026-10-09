const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeText = document.querySelector("#theme-text");
const contactForm = document.querySelector("#contact-form");

const savedTheme = localStorage.getItem("theme");

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.documentElement.dataset.theme = theme;

    themeToggle.setAttribute(
        "aria-pressed",
        String(isDark)
    );

    themeToggle.setAttribute(
        "aria-label",
        isDark
            ? "Switch to light theme"
            : "Switch to dark theme"
    );

    themeIcon.textContent = isDark ? "🌙" : "☀️";
    themeText.textContent = isDark
        ? "Dark mode"
        : "Light mode";
}

const initialTheme =
    savedTheme === "light"
        ? "light"
        : "dark";

applyTheme(initialTheme);

themeToggle.addEventListener("click", () => {

    const currentTheme =
        document.documentElement.dataset.theme;

    const nextTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";

    localStorage.setItem("theme", nextTheme);

    applyTheme(nextTheme);
});


contactForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const formData = new FormData(contactForm);

    const name = formData.get("name");

    alert(
        `Thank you, ${name}! Your message has been received.`
    );

    contactForm.reset();
});