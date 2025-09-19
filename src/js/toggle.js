/**
 * @file toggle.js
 * @description Light/Dark theme switcher (hardened).
 * Initializes theme from saved preference or OS setting, updates body classes,
 * swaps appropriate logos, persists user choice, and stays in sync with OS
 * changes and other tabs. Safe to import multiple times (idempotent boot).
 */

/** @constant {string} - Prefix for asset URLs (Vite BASE_URL or <base href>) */
const BASE = (
  import.meta?.env?.BASE_URL ??
  document.querySelector("base")?.getAttribute("href") ??
  "/"
).replace(/\/$/, "");

/** @constant {string} - localStorage key for theme preference */
const THEME_KEY = "theme";

/** @constant {string} - Light logo path (base-aware) */
const LOGO_LIGHT = `${BASE}/assets/images/logo-katjadev-light.svg`;

/** @constant {string} - Dark logo path (base-aware) */
const LOGO_DARK = `${BASE}/assets/images/logo-katjadev-dark.svg`;

/**
 * Update site logos according to theme.
 * Rule:
 *  - `.site-logo-menu` flips with theme (dark → light logo, light → dark logo)
 *  - All other `.site-logo` always use the dark logo
 * @param {boolean} isDark - Whether the dark theme is active.
 * @returns {void}
 */
function updateLogo(isDark) {
  document.querySelectorAll(".site-logo").forEach((img) => {
    const isMenuLogo = img.classList.contains("site-logo-menu");
    img.src = isMenuLogo ? (isDark ? LOGO_LIGHT : LOGO_DARK) : LOGO_DARK;
  });
}

/**
 * Reflect the current theme on the toggle button.
 * @param {boolean} isDark - Whether the dark theme is active.
 * @returns {void}
 */
export function updateSwitcherPosition(isDark) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.classList.toggle("dark-mode", !!isDark);
}

/**
 * Apply theme classes and related UI affordances.
 * @param {"light"|"dark"} theme - Theme to apply.
 * @returns {void}
 */
function applyTheme(theme) {
  const isDark = theme === "dark";
  const body = document.body;
  if (!body) return;

  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(isDark ? "dark-theme" : "light-theme");

  updateSwitcherPosition(isDark);
  updateLogo(isDark);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute(
      "title",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }
}

/**
 * Determine initial theme from localStorage or OS preference.
 * @returns {"light"|"dark"}
 */
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Handle toggle button clicks.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onToggleClick(e) {
  e?.preventDefault?.();
  const next = document.body.classList.contains("dark-theme")
    ? "light"
    : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/**
 * One-time initializer: applies initial theme, wires events, and sets up
 * OS preference and cross-tab synchronization.
 * @returns {void}
 */
function boot() {
  applyTheme(getInitialTheme());

  const btn = document.getElementById("theme-toggle");
  if (btn && !btn.__themeBound) {
    btn.__themeBound = true;
    btn.addEventListener("click", onToggleClick);
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener?.("change", (evt) => {
    if (!localStorage.getItem(THEME_KEY))
      applyTheme(evt.matches ? "dark" : "light");
  });

  window.addEventListener("storage", (evt) => {
    if (
      evt.key === THEME_KEY &&
      (evt.newValue === "light" || evt.newValue === "dark")
    ) {
      applyTheme(evt.newValue);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
