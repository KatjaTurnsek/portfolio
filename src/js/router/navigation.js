/**
 * @file navigation.js
 * @description Rendering + history state updates.
 */

import { BASE_SLASH, routes } from './config.js';
import { immediateShow } from './dom.js';
import { idToPath, pathToId, normalizePathname } from './paths.js';
import { setMetaFromSection } from './meta.js';
import { setActiveLinkById } from './activeLink.js';

/**
 * Initial render from current URL (path or hash).
 * @param {string} path
 * @param {string|null} hash
 * @returns {void}
 */
export function initialShow(path, hash) {
  const fallback = 'home';
  const hashId = hash && document.getElementById(hash) ? hash : null;
  const id = hashId || pathToId(path) || routes['/'] || fallback;
  const el = document.getElementById(id);
  if (!el) return;

  window.__currentSectionId = id;
  immediateShow(id);
  setMetaFromSection(el);
  setActiveLinkById(id);

  const newPath = idToPath(id);
  history.replaceState({ path: newPath }, '', BASE_SLASH + newPath.replace(/^\//, ''));

  if (typeof window.revealSection === 'function') window.revealSection(id);
}

/**
 * Core render: show a path and update history.
 * @param {string} path normalized path (e.g. "/work/slug")
 * @param {{ replace?: boolean }} [opts]
 * @returns {void}
 */
export function render(path, { replace = false } = {}) {
  const fallback = 'home';
  const id = pathToId(path) || routes['/'] || fallback;
  window.__currentSectionId = id;

  immediateShow(id);

  const el = document.getElementById(id);
  if (el) {
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Make first heading focusable once for a11y
    const h = el.querySelector('h1, h2, h3, [role="heading"]');
    if (h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    if (h) setTimeout(() => h.focus?.(), 50);

    setMetaFromSection(el);
    setActiveLinkById(id);

    if (typeof window.revealSection === 'function') window.revealSection(id);
  }

  const state = { path };
  const url = BASE_SLASH + path.replace(/^\//, '');
  if (replace) history.replaceState(state, '', url);
  else history.pushState(state, '', url);
}

/**
 * Smart back: try history.back(), and if it didn't change, interpret href.
 * @param {string} href
 * @returns {void}
 */
export function smartBack(href) {
  const before = location.href;
  const popOnce = () => window.removeEventListener('popstate', popOnce);
  window.addEventListener('popstate', popOnce, { once: true });
  history.back();

  setTimeout(() => {
    if (location.href === before) {
      const url = new URL(href, location.origin);
      const path = normalizePathname(url.pathname);
      const id = pathToId(path);
      if (id) render(path);
      else location.assign(href);
    }
  }, 250);
}
