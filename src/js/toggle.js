/**
 * @file toggle.js
 * @description Theme switcher that updates the page theme, swaps site logos,
 * and persists the user's preference.
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

  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* Storage can be unavailable in privacy-restricted contexts. */
    }
  },
};

/**
 * Reflect the current theme on the toggle button.
 * @param {boolean} isDark
 * @returns {void}
 */
function updateSwitcherPosition(isDark) {
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  button.classList.toggle('dark-mode', isDark);
  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
}

/**
 * Update all site logos for the current theme.
 *
 * Uses:
 * - data-logo-light for the light-coloured logo
 * - data-logo-dark for the dark-coloured logo
 *
 * @param {boolean} isDark
 * @returns {void}
 */
function updateLogos(isDark) {
  const logos = document.querySelectorAll('.site-logo');

  logos.forEach((logo) => {
    const lightLogo = logo.getAttribute('data-logo-light');
    const darkLogo = logo.getAttribute('data-logo-dark');

    if (!lightLogo || !darkLogo) return;

    logo.setAttribute('src', isDark ? lightLogo : darkLogo);
  });
}

/**
 * Apply theme classes, attributes, and related UI.
 * Dispatches "theme:change" with { detail: 'light' | 'dark' }.
 *
 * @param {'light'|'dark'} theme
 * @returns {void}
 */
function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark';

  root.classList.remove('light-theme', 'dark-theme');
  root.classList.add(isDark ? 'dark-theme' : 'light-theme');
  root.setAttribute('data-theme', theme);

  updateSwitcherPosition(isDark);
  updateLogos(isDark);

  document.dispatchEvent(
    new CustomEvent('theme:change', {
      detail: theme,
    })
  );
}

/**
 * Determine the initial theme from the early head script,
 * saved preference, or operating system.
 *
 * @returns {'light'|'dark'}
 */
function getInitialTheme() {
  const initialTheme = document.documentElement.dataset.theme;

  if (initialTheme === 'light' || initialTheme === 'dark') {
    return initialTheme;
  }

  const savedTheme = safeStorage.get(THEME_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Initialise theme behaviour.
 * @returns {void}
 */
function boot() {
  applyTheme(getInitialTheme());

  const button = document.getElementById('theme-toggle');

  if (button && !button.__themeBound) {
    button.__themeBound = true;

    button.addEventListener('click', (event) => {
      event.preventDefault();

      const nextTheme = document.documentElement.classList.contains('dark-theme')
        ? 'light'
        : 'dark';

      safeStorage.set(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = (event) => {
    if (!safeStorage.get(THEME_KEY)) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleSystemThemeChange);
  }

  window.addEventListener('storage', (event) => {
    const isValidTheme = event.newValue === 'light' || event.newValue === 'dark';

    if (event.key === THEME_KEY && isValidTheme) {
      applyTheme(event.newValue);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
