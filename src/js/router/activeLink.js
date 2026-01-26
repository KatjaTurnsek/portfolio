/**
 * @file activeLink.js
 * @description Active nav-link highlighting based on current route.
 */

import { ACTIVE_CLASS } from './config.js';
import { idToPath, normalizePathname } from './paths.js';

/**
 * Toggle active class on nav links based on current routed path.
 * @param {string} id
 * @returns {void}
 */
export function setActiveLinkById(id) {
  const routedPath = idToPath(id) || normalizePathname(location.pathname);

  document.querySelectorAll('nav a').forEach((a) => {
    let isActive = false;

    try {
      const href = a.getAttribute('href') || '';
      const u = new URL(href, location.href);
      isActive = normalizePathname(u.pathname) === routedPath;
    } catch {
      /* ignore malformed */
    }

    a.classList.toggle(ACTIVE_CLASS, isActive);
    a.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}
