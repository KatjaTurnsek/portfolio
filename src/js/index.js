/**
 * @file index.js
 * @overview App initialization & wiring:
 *  - Router setup
 *  - Safe section reveal + runtime min-height sizing
 *  - Menu open/close + cleanup
 *  - Loader show/hide + visuals (animations respect reduced-motion)
 *
 * Assumptions:
 *  - Browser-only module (DOM APIs available)
 *  - Vite environment (optional import.meta.env.BASE_URL)
 */

import '../css/main.css';

import './toggle.js';

import { restoreGhPagesDeepLink } from './app/boot/ghPagesRestore.js';
import { installHistoryBaseGuard } from './app/boot/historyBaseGuard.js';
import { bindAppHandlers } from './app/boot/bindAppHandlers.js';
import { bootOnDomReady } from './app/boot/domReady.js';

import { revealSection as coreRevealSection, sizeSectionMinHeight } from './init.js';
import { buildWorkGridsIfNeeded } from './components/workGridMounts.js';
import { releaseScrollLock } from './components/scrollLock.js';
import { setupActions } from '../lib/actions.js';

/* ────────────────────────────────────────────────────────────────────────── */
/* GH Pages boot (must run BEFORE router boot)                                */
/* ────────────────────────────────────────────────────────────────────────── */

function bootGhPages() {
  restoreGhPagesDeepLink();
  installHistoryBaseGuard();
}

bootGhPages();

/**
 * Load the router AFTER we’ve potentially rewritten the URL so it sees the final path.
 * Marks window.__routerActive when ready.
 */
import('./router.js').then(() => {
  window.__routerActive = true;
});

/* ────────────────────────────────────────────────────────────────────────── */
/* App handlers                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

bindAppHandlers({
  prefersReducedMotion,
  sizeFn: sizeSectionMinHeight,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Actions                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

setupActions({
  'open-case': ({ el, ev }) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const href = el.getAttribute('href') || el.dataset.href || el.getAttribute('data-href') || '';

    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (target.id) window.revealSection?.(target.id);
        return;
      }
    }

    if (href) {
      if (window.__routerActive && !/^[a-z]+:/i.test(href)) {
        history.pushState({}, '', href);
        const idGuess = href.split('/').filter(Boolean).pop();
        if (idGuess) window.revealSection?.(idGuess);
      } else {
        location.assign(href);
      }
    }
  },
});

/* ────────────────────────────────────────────────────────────────────────── */
/* revealSection: idempotent, router-friendly                                 */
/* ────────────────────────────────────────────────────────────────────────── */

window.revealSection = function revealSection(id) {
  const menuEl = document.getElementById('menu');
  const menuToggle = document.getElementById('menuToggle');

  if (menuEl?.classList.contains('open')) {
    menuEl.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    releaseScrollLock();
  }

  coreRevealSection(id);

  if (id === 'work') buildWorkGridsIfNeeded();

  window.ScrollTrigger?.refresh?.();
};

/* ────────────────────────────────────────────────────────────────────────── */
/* DOM ready                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', bootOnDomReady);
