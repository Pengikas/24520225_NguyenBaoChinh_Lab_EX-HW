document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");

    links.forEach((link) => {
        link.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                link.blur();
            }
        });
    });
});