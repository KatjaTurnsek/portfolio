/**
 * toggle.js
 * Theme switcher that toggles body theme classes + persists preference.
 * NOTE: Header logo is intentionally NOT swapped (dark logo is used in both themes).
 * EXCEPTION: Menu logo swaps so it stays readable (light logo in dark theme).
 */

const THEME_KEY = 'theme';

/** Safe storage helpers */
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

/**
 * Reflect the current theme on the toggle button.
 * @param {boolean} isDark
 */
function updateSwitcherPosition(isDark) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.classList.toggle('dark-mode', !!isDark);
  btn.setAttribute('aria-pressed', String(!!isDark));
  btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

/**
 * Swap ONLY the menu logo based on theme (keeps header logo unchanged).
 * Uses:
 *  - data-logo-light="..."
 *  - data-logo-dark="..."
 * @param {boolean} isDark
 */
function updateMenuLogo(isDark) {
  const menuLogo = document.querySelector('.site-logo-menu');
  if (!menuLogo) return;

  const lightSrc = menuLogo.getAttribute('data-logo-light');
  const darkSrc = menuLogo.getAttribute('data-logo-dark');
  if (!lightSrc || !darkSrc) return;

  // In dark theme we want the LIGHT logo in the menu for contrast.
  menuLogo.src = isDark ? lightSrc : darkSrc;
}

/**
 * Apply theme classes/attributes and related UI.
 * Dispatches "theme:change" with { detail: 'light' | 'dark' }.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  const body = document.body;
  if (!body) return;

  const isDark = theme === 'dark';

  body.classList.remove('light-theme', 'dark-theme');
  body.classList.add(isDark ? 'dark-theme' : 'light-theme');
  body.setAttribute('data-theme', theme);

  updateSwitcherPosition(isDark);
  updateMenuLogo(isDark);

  // Notify anything that cares (waves, etc.)
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

function boot() {
  applyTheme(getInitialTheme());

  const btn = document.getElementById('theme-toggle');
  if (btn && !btn.__themeBound) {
    btn.__themeBound = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      safeStorage.set(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // OS preference watcher (only if user hasn't explicitly chosen)
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const mqHandler = (evt) => {
    if (!safeStorage.get(THEME_KEY)) applyTheme(evt.matches ? 'dark' : 'light');
  };
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', mqHandler);
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
