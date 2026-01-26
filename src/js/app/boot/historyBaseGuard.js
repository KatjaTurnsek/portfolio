/**
 * @file historyBaseGuard.js
 * @description Keeps internal navigation inside the configured BASE path.
 * Wraps history.pushState/replaceState so relative URLs are coerced to BASE.
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
 * Install wrappers for pushState/replaceState so internal URLs
 * always respect window.__BASE_URL__ (or "/portfolio/" fallback).
 *
 * @returns {void}
 */
export function installHistoryBaseGuard() {
  const RAW = window.__BASE_URL__ || '/portfolio/';
  const BASE_SLASH = ensureTrail(RAW);
  const BASE_NOSLASH = BASE_SLASH.slice(0, -1);

  /**
   * Normalize app-internal URLs against BASE.
   * @param {string} url
   * @returns {string}
   */
  const normalize = (url) => {
    if (typeof url !== 'string') return url;
    if (url === '' || url === '/') return BASE_SLASH;
    if (url === BASE_NOSLASH) return BASE_SLASH;
    if (url.startsWith(BASE_SLASH) || url.startsWith(`${BASE_NOSLASH}/`)) return url;
    if (url.startsWith('/')) return `${BASE_SLASH}${url.replace(/^\//, '')}`;
    if (!/^[a-z]+:/i.test(url) && !url.startsWith('#')) {
      return `${BASE_SLASH}${url.replace(/^\.?\//, '')}`;
    }
    return url;
  };

  /**
   * Wrap a history method and normalize its url argument.
   * @param {History['pushState']} fn
   * @returns {History['pushState']}
   */
  const wrap = (fn) =>
    function (state, title, url) {
      return fn.call(this, state, title, normalize(/** @type {string} */ (url)));
    };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
}
