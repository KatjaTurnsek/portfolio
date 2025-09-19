/**
 * toggle.js — Light/Dark theme switcher (hardened)
 * - Applies saved or system theme on load
 * - Toggles body classes (light-theme / dark-theme)
 * - Updates switcher state and swaps logos
 * - Persists preference; follows OS changes if no explicit choice
 * - Idempotent boot; cross-tab + OS change sync
 */

const THEME_KEY = "theme";
const LOGO_LIGHT = "assets/images/logo-katjadev-light.svg";
const LOGO_DARK = "assets/images/logo-katjadev-dark.svg";

/**
 * Update site logos.
 * Rule (matches your working version):
 * - .site-logo-menu flips with theme (dark → light logo, light → dark logo)
 * - All other .site-logo use the dark logo always
 */
function updateLogo(isDark) {
  document.querySelectorAll(".site-logo").forEach((img) => {
    const isMenuLogo = img.classList.contains("site-logo-menu");
    img.src = isMenuLogo ? (isDark ? LOGO_LIGHT : LOGO_DARK) : LOGO_DARK;
  });
}

/** Toggle button visual state */
export function updateSwitcherPosition(isDark) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.classList.toggle("dark-mode", !!isDark);
}

/** Apply theme classes + UI affordances */
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

/** Resolve initial theme from storage or OS */
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Click handler for the toggle button */
function onToggleClick(e) {
  e?.preventDefault?.();
  const next = document.body.classList.contains("dark-theme")
    ? "light"
    : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/** One-time initializer */
function boot() {
  applyTheme(getInitialTheme());

  const btn = document.getElementById("theme-toggle");
  if (btn && !btn.__themeBound) {
    btn.__themeBound = true;
    btn.addEventListener("click", onToggleClick);
  }

  // Follow OS theme when there's no explicit user choice
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener?.("change", (evt) => {
    if (!localStorage.getItem(THEME_KEY))
      applyTheme(evt.matches ? "dark" : "light");
  });

  // Cross-tab sync
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
