/**
 * toggle.js
 *
 * Handles light/dark theme switching:
 * - Applies stored or system theme on load
 * - Updates body theme classes and switcher state
 * - Switches logos depending on theme
 * - Saves user preference in localStorage
 */

const body = document.body;
const themeToggle = document.getElementById("theme-toggle");

/**
 * Updates the toggle switcher position (dark vs light).
 *
 * @function updateSwitcherPosition
 * @param {boolean} isDark - Whether dark mode is active.
 */
export function updateSwitcherPosition(isDark) {
  themeToggle.classList.toggle("dark-mode", isDark);
}

/**
 * Updates site logos based on theme and menu state.
 * Internal helper, not exported.
 */
function updateLogo() {
  const isDark = document.body.classList.contains("dark-theme");

  document.querySelectorAll(".site-logo").forEach((logo) => {
    const isMenuLogo = logo.classList.contains("site-logo-menu");
    logo.src = isMenuLogo
      ? isDark
        ? "assets/images/logo-katjadev-light.svg"
        : "assets/images/logo-katjadev-dark.svg"
      : "assets/images/logo-katjadev-dark.svg";
  });
}

// Apply stored or system theme on load
window.addEventListener("DOMContentLoaded", () => {
  const storedTheme = localStorage.getItem("theme");
  const isDark = storedTheme
    ? storedTheme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;

  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(isDark ? "dark-theme" : "light-theme");

  updateSwitcherPosition(isDark);
  updateLogo();
});

// Toggle theme on button click
themeToggle.addEventListener("click", () => {
  const isDark = body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";

  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(`${newTheme}-theme`);

  updateSwitcherPosition(newTheme === "dark");
  updateLogo();

  localStorage.setItem("theme", newTheme);
});
