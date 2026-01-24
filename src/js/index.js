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

/* ────────────────────────────────────────────────────────────────────────── */
/* GH Pages SPA deep-link restore (runs before router boot)                   */
/* ────────────────────────────────────────────────────────────────────────── */
/**
 * Normalize BASE and restore pretty paths that GitHub Pages transformed into
 * query-based deep links. Writes window.__BASE_URL__ for downstream modules.
 */
(() => {
  const l = window.location;

  const baseFromTag = document.querySelector('base')?.getAttribute('href') || '';
  const baseFromVite = (import.meta?.env?.BASE_URL || '/').replace(/\/?$/, '/');
  /** @type {string} */
  const BASE = (baseFromTag || baseFromVite || '/').replace(/\/?$/, '/');

  // Case 1: "?/path" → restore to "/path"
  if (l.search && l.search.startsWith('?/')) {
    const restored = l.search.slice(2).replace(/~and~/g, '&');
    const target = BASE + restored.replace(/^\//, '') + l.hash;
    history.replaceState(null, '', target);
    window.__BASE_URL__ = BASE;
    return;
  }

  // Case 2: session-stashed path (from 404 redirect script)
  try {
    const saved = sessionStorage.getItem('gh_redirect');
    if (saved) {
      sessionStorage.removeItem('gh_redirect');
      const target = saved.startsWith('/') ? saved : BASE + saved.replace(/^\//, '');
      history.replaceState(null, '', target);
      window.__BASE_URL__ = BASE;
      return;
    }
  } catch {
    /* ignore storage errors */
  }

  window.__BASE_URL__ = BASE;
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Keep /portfolio/ base for internal navigation                              */
/* ────────────────────────────────────────────────────────────────────────── */
/**
 * Wrap pushState/replaceState so any relative app URLs are coerced to the
 * configured BASE. Avoids accidental double-/ or wrong-root navigation.
 */
(() => {
  const RAW = window.__BASE_URL__ || '/portfolio/';
  const BASE_SLASH = RAW.replace(/\/?$/, '/');
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
    if (url.startsWith(BASE_SLASH) || url.startsWith(BASE_NOSLASH + '/')) return url;
    if (url.startsWith('/')) return BASE_SLASH + url.replace(/^\//, '');
    if (!/^[a-z]+:/i.test(url) && !url.startsWith('#')) {
      return BASE_SLASH + url.replace(/^\.?\//, '');
    }
    return url;
  };

  /** @param {History['pushState']} fn */
  const wrap = (fn) =>
    function (state, title, url) {
      return fn.call(this, state, title, normalize(/** @type {string} */ (url)));
    };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Imports                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
import '../css/main.css';

import gsap from 'gsap';
import './toggle.js';
import { hideLoader, showLoader } from './loader.js';
import { setupMenuToggle } from './nav.js';
import { setupResponsiveImages } from './responsiveImages.js';
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  deferHeavy,
  animateGooeyBlobs,
  enableInteractiveJellyBlob,
} from './animations.js';
import {
  initSections,
  revealSection as coreRevealSection,
  setupHeaderScrollEffect,
  sizeSectionMinHeight,
} from './init.js';
import { animateTextInSection } from './animatedTexts.js';
import { renderCategory, renderFeatured } from './components/workGrid.js';
import {
  isSafari,
  addSafariWillChange,
  revealImagesSequentially,
  enableNoSelectDuringInteraction,
} from './components/ux.js';
import { setupActions } from '../lib/actions.js';

/**
 * Load the router AFTER we’ve potentially rewritten the URL so it sees the final path.
 * Marks window.__routerActive when ready.
 */
import('./router.js').then(() => {
  window.__routerActive = true;
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Utilities                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function releaseScrollLock() {
  [document.documentElement, document.body].forEach((el) => {
    el.classList.remove('menu-open', 'no-scroll', 'overflow-hidden', 'locked');
    el.style.overflow = '';
    el.style.overflowY = '';
    el.style.position = '';
    el.style.top = '';
    el.style.width = '';
  });
}

function buildWorkGridsIfNeeded() {
  const empty = (sel) => {
    const el = document.querySelector(sel);
    return !!el && el.childElementCount === 0;
  };

  if (document.getElementById('dev-cards') && empty('#dev-cards')) {
    renderCategory('#dev-cards', 'website');
  }
  if (document.getElementById('design-cards') && empty('#design-cards')) {
    renderCategory('#design-cards', 'design');
  }
  if (document.getElementById('logo-cards') && empty('#logo-cards')) {
    renderCategory('#logo-cards', 'logotype');
  }
  if (document.getElementById('work-cards') && empty('#work-cards')) {
    renderFeatured('#work-cards');
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Section visibility                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('sectionVisible', async (e) => {
  /** @type {{detail:string}} @ts-ignore */
  const { detail: sectionId } = e;
  const section = document.getElementById(sectionId);
  if (!section) return;

  sizeSectionMinHeight(section);

  if (sectionId.startsWith('case-')) {
    const { hydrateCaseSection } = await import('./components/caseAutoWidgets.js');
    hydrateCaseSection(section);
  }

  if (sectionId === 'about') {
    const { animateTealBars } = await import('./animations.js');
    animateTealBars();
  }

  animateTextInSection(section);
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

(() => {
  let resizeScheduled = false;
  const onResize = () => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      const current = document.querySelector('.fullscreen-section.visible');
      if (current) sizeSectionMinHeight(/** @type {HTMLElement} */ (current));
      resizeScheduled = false;
    });
  };
  window.addEventListener('resize', onResize, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Menu open/close                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const menu = document.getElementById('menu');

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      // Animate menu link words when opening (if motion allowed)
      const { animateMenuLinks } = await import('./animatedTexts.js');
      if (!prefersReducedMotion) animateMenuLinks();
    } else {
      releaseScrollLock();
    }
  });

  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}

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

  const sectionEl = document.getElementById(id) || document;
  const loaded = setupResponsiveImages(sectionEl);
  revealImagesSequentially(loaded);

  if (id === 'work') buildWorkGridsIfNeeded();

  window.ScrollTrigger?.refresh?.();
};

/* ────────────────────────────────────────────────────────────────────────── */
/* DOM ready                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) gsap.ticker.fps(50);

  buildWorkGridsIfNeeded();

  setTimeout(() => {
    hideLoader();
    releaseScrollLock();

    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const blobWrapper = document.querySelector('.morphing-blob-wrapper');
    if (blobWrapper) {
      gsap.fromTo(
        blobWrapper,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 0.6, ease: 'power2.out' }
      );

      deferHeavy(() => {
        animateGooeyBlobs();
        enableInteractiveJellyBlob();
      }, 800);
    }

    const currentId = window.__currentSectionId || 'home';
    const currentEl = document.getElementById(currentId);
    if (currentEl) {
      window.revealSection?.(currentId);
      sizeSectionMinHeight(currentEl);
    }
  }, 1500);

  const hireBtn = document.getElementById('hireBtn');
  if (hireBtn) {
    hireBtn.addEventListener(
      'click',
      () => {
        const contact = document.getElementById('contact');
        if (contact) {
          contact.scrollIntoView({ behavior: 'smooth' });
          window.revealSection?.('contact');
        }
      },
      { passive: true }
    );
  }

  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
