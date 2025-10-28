/**
 * @file toggle.js
 * @description Light/Dark theme switcher (hardened).
 * - Initializes from saved preference or OS setting
 * - Updates body classes + data-theme
 * - Swaps appropriate logos
 * - Persists user choice (safe storage)
 * - Stays in sync with OS changes and other tabs
 * - Dispatches "theme:change" CustomEvent
 * - Idempotent boot; safe to import multiple times
 */

/** Resolve base (Vite BASE_URL or <base href>). Result has no trailing slash. */
const BASE = (
  (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) ??
  document.querySelector('base')?.getAttribute('href') ??
  '/'
).replace(/\/$/, '');

/** Storage key for theme preference */
const THEME_KEY = 'theme';

/** Logo URLs (base-aware) */
const LOGO_LIGHT = `${BASE}/assets/images/logo-katjadev-light.svg`;
const LOGO_DARK = `${BASE}/assets/images/logo-katjadev-dark.svg`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Safe storage                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      window.localStorage.setItem(key, val);
    } catch {
      /* no-op */
    }
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Logo swap                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Update site logos according to theme.
 * Rule:
 *  - `.site-logo-menu` flips with theme (dark → light logo, light → dark logo)
 *  - All other `.site-logo` always use the dark logo
 * @param {boolean} isDark
 * @returns {void}
 */
function updateLogo(isDark) {
  document.querySelectorAll('.site-logo').forEach((node) => {
    if (!(node instanceof HTMLImageElement)) return;
    const isMenuLogo = node.classList.contains('site-logo-menu');
    const nextSrc = isMenuLogo ? (isDark ? LOGO_LIGHT : LOGO_DARK) : LOGO_DARK;
    if (node.src !== nextSrc) node.src = nextSrc;
    // Improve paint on swap
    if (!node.decoding) node.decoding = 'async';
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Toggle affordance                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Reflect the current theme on the toggle button.
 * @param {boolean} isDark
 * @returns {void}
 */
export function updateSwitcherPosition(isDark) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.classList.toggle('dark-mode', !!isDark);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Theme application                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Apply theme classes/attributes and related UI.
 * Also dispatches a "theme:change" event with { detail: 'light' | 'dark' }.
 * @param {'light'|'dark'} theme
 * @returns {void}
 */
function applyTheme(theme) {
  const body = document.body;
  if (!body) return;

  const isDark = theme === 'dark';

  // Classes + data attribute (some observers watch data-theme)
  body.classList.remove('light-theme', 'dark-theme');
  body.classList.add(isDark ? 'dark-theme' : 'light-theme');
  body.setAttribute('data-theme', theme);

  // Toggle UI bits
  updateSwitcherPosition(isDark);
  updateLogo(isDark);

  // ARIA/title on the toggle
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // Notify interested components
  document.dispatchEvent(new CustomEvent('theme:change', { detail: theme }));
}

/**
 * Determine initial theme from saved pref or OS.
 * @returns {'light'|'dark'}
 */
function getInitialTheme() {
  const saved = safeStorage.get(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Events                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Handle toggle button clicks.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onToggleClick(e) {
  e?.preventDefault?.();
  const next = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  safeStorage.set(THEME_KEY, next);
  applyTheme(next);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Boot                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * One-time initializer: applies initial theme, wires events, and sets up
 * OS preference and cross-tab synchronization.
 * @returns {void}
 */
function boot() {
  applyTheme(getInitialTheme());

  const btn = document.getElementById('theme-toggle');
  if (btn && !btn.__themeBound) {
    btn.__themeBound = true;
    btn.addEventListener('click', onToggleClick);
  }

  // OS preference watcher (prefers-color-scheme)
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const mqHandler = (evt) => {
    // Only auto-switch if user hasn't explicitly chosen
    if (!safeStorage.get(THEME_KEY)) applyTheme(evt.matches ? 'dark' : 'light');
  };
  // Modern
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', mqHandler);
  // Legacy Safari
  else if (typeof mq.addListener === 'function') mq.addListener(mqHandler);

  // Cross-tab sync
  window.addEventListener('storage', (evt) => {
    if (evt.key === THEME_KEY && (evt.newValue === 'light' || evt.newValue === 'dark')) {
      applyTheme(evt.newValue);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
