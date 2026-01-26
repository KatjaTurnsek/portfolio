/**
 * @file startRouter.js
 * @description Router startup (boot + listeners).
 */

import { purgeInlineSectionStyles } from './dom.js';
import { normalizePathname } from './paths.js';
import { initialShow } from './navigation.js';
import { onClick, onPopState, ensureSectionSync } from './handlers.js';

/**
 * Initialize router and bind events.
 * @returns {void}
 */
export function startRouter() {
  if (typeof window !== 'undefined') window.__routerActive = true;

  // Mark document as JS-enabled (CSS can provide a default visible section)
  document.documentElement.classList.add('js-ready');

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  purgeInlineSectionStyles();

  const initialPath = normalizePathname(location.pathname);
  const initialHash = location.hash ? location.hash.slice(1) : null;

  initialShow(initialPath, initialHash);

  document.addEventListener('click', onClick, { passive: false });
  window.addEventListener('popstate', onPopState);

  window.addEventListener('pageshow', () => {
    ensureSectionSync();
    setTimeout(ensureSectionSync, 60);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ensureSectionSync();
  });
}
