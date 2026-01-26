/**
 * @file ghPagesRestore.js
 * @description Restore GH Pages SPA deep-links and define window.__BASE_URL__.
 * This runs BEFORE router boot so the router sees the correct path.
 */

/**
 * Ensure a trailing slash.
 * @param {string} [s="/"]
 * @returns {string}
 */
function ensureTrail(s = '/') {
  return s.endsWith('/') ? s : `${s}/`;
}

/**
 * Normalize BASE and restore pretty paths that GitHub Pages transformed into
 * query-based deep links. Writes window.__BASE_URL__ for downstream modules.
 *
 * Cases:
 * 1) "?/path" → "/<BASE>/path"
 * 2) sessionStorage "gh_redirect" → restored URL
 *
 * @returns {void}
 */
export function restoreGhPagesDeepLink() {
  const l = window.location;

  const baseFromTag = document.querySelector('base')?.getAttribute('href') || '';
  const baseFromVite = import.meta?.env?.BASE_URL || '/';
  /** @type {string} */
  const BASE = ensureTrail(baseFromTag || baseFromVite || '/');

  // Case 1: "?/path" → restore to "/path"
  if (l.search && l.search.startsWith('?/')) {
    const restored = l.search.slice(2).replace(/~and~/g, '&');
    const target = `${BASE}${restored.replace(/^\//, '')}${l.hash}`;
    history.replaceState(null, '', target);
    window.__BASE_URL__ = BASE;
    return;
  }

  // Case 2: session-stashed path (from 404 redirect script)
  try {
    const saved = sessionStorage.getItem('gh_redirect');
    if (saved) {
      sessionStorage.removeItem('gh_redirect');
      const target = saved.startsWith('/') ? saved : `${BASE}${saved.replace(/^\//, '')}`;
      history.replaceState(null, '', target);
      window.__BASE_URL__ = BASE;
      return;
    }
  } catch {
    /* ignore storage errors */
  }

  window.__BASE_URL__ = BASE;
}
