/**
 * App bootstrap
 * - Router setup
 * - Safe section reveal + runtime min-height sizing
 * - Menu open/close (lazy-init menu wave image) + cleanup
 * - Loader show/hide + visuals (mobile-safe; animations handle reduced-motion internally)
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* GH Pages SPA deep-link restore (runs before router boot)                   */
/* ────────────────────────────────────────────────────────────────────────── */
(() => {
  const l = window.location;

  const baseFromTag = document.querySelector('base')?.getAttribute('href') || '';
  const baseFromVite = (import.meta?.env?.BASE_URL || '/').replace(/\/?$/, '/');
  const BASE = (baseFromTag || baseFromVite || '/').replace(/\/?$/, '/');

  if (l.search && l.search.startsWith('?/')) {
    const restored = l.search.slice(2).replace(/~and~/g, '&');
    const target = BASE + restored.replace(/^\//, '') + l.hash;
    history.replaceState(null, null, target);
    window.__BASE_URL__ = BASE;
    return;
  }

  try {
    const saved = sessionStorage.getItem('gh_redirect');
    if (saved) {
      sessionStorage.removeItem('gh_redirect');
      const target = saved.startsWith('/') ? saved : BASE + saved.replace(/^\//, '');
      history.replaceState(null, null, target);
      window.__BASE_URL__ = BASE;
      return;
    }
  } catch (_) {
    // ignore storage errors
  }

  window.__BASE_URL__ = BASE;
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Keep /portfolio/ base for internal navigation                              */
/* ────────────────────────────────────────────────────────────────────────── */
(() => {
  const RAW = window.__BASE_URL__ || '/portfolio/';
  const BASE_SLASH = RAW.replace(/\/?$/, '/');
  const BASE_NOSLASH = BASE_SLASH.slice(0, -1);

  /** @param {string} url */
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

  /** @type {(fn:History['pushState']) => History['pushState']} */
  const wrap = (fn) =>
    function (state, title, url) {
      return fn.call(this, state, title, normalize(url));
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
  setupStaticWaves,
  observeThemeChangesForWaves,
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

/* Load the router AFTER we’ve potentially rewritten the URL */
import('./router.js').then(() => {
  window.__routerActive = true;
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Utilities                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** Respect reduced motion */
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Release any scroll locks applied by menu overlays. */
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

/**
 * Build Work grids only if they are empty.
 * Safe to call multiple times (idempotent).
 */
function buildWorkGridsIfNeeded() {
  /** @param {string} sel */
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

/**
 * Reactions when a section becomes visible (emitted by your init/router).
 * - Sizes min-height to viewport
 * - Hydrates case widgets on demand
 * - Runs section-specific animations
 */
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

/* Recompute min-height on resize (rAF-throttled) */
(() => {
  let resizeScheduled = false;
  const onResize = () => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      const current = document.querySelector('.fullscreen-section.visible');
      if (current) sizeSectionMinHeight(current);
      resizeScheduled = false;
    });
  };
  window.addEventListener('resize', onResize, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Menu open/close                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const menu = document.getElementById('menu');
let stopWaveThemeObserver = /** @type {null | (() => void)} */ (null);
let menuWaveInited = false;

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      if (!menuWaveInited) {
        setupStaticWaves();
        const maybeDisposer = observeThemeChangesForWaves();
        if (typeof maybeDisposer === 'function') stopWaveThemeObserver = maybeDisposer;
        menuWaveInited = true;
      }

      const { animateMenuLinks } = await import('./animatedTexts.js');
      if (!prefersReducedMotion) animateMenuLinks();
    } else {
      if (typeof stopWaveThemeObserver === 'function') {
        stopWaveThemeObserver();
        stopWaveThemeObserver = null;
      }
      releaseScrollLock();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Actions                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Bind global UI actions used in templates.
 * Note: keep handlers idempotent and side-effect–safe.
 */
setupActions({
  'open-case': ({ el, ev }) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const href = el.getAttribute('href') || el.dataset.href || el.getAttribute('data-href');
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (target.id) window.revealSection?.(target.id);
        return;
      }
    }

    const cardTitle = el.closest('.card')?.querySelector('.card__title')?.textContent?.trim();
    if (cardTitle) alert(`Open case study: ${cardTitle}`);
  },
});

/* ────────────────────────────────────────────────────────────────────────── */
/* revealSection: idempotent, router-friendly                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Reveal/refresh logic per section.
 * Called by the router after it shows a section.
 * MUST be safe to call multiple times (idempotent).
 * @param {string} id - section element id (e.g. "home", "work", "contact", "case-portfolio")
 */
window.revealSection = function revealSection(id) {
  // 1) Close the menu on navigation
  const menuEl = document.getElementById('menu');
  const menuToggle = document.getElementById('menuToggle');
  if (menuEl?.classList.contains('open')) {
    menuEl.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    releaseScrollLock();
  }

  // 2) Core reveal (your original logic from init.js)
  coreRevealSection(id);

  // 3) (Re)hydrate responsive images within the section
  const sectionEl = document.getElementById(id) || document;
  const loaded = setupResponsiveImages(sectionEl);
  revealImagesSequentially(loaded);

  // 4) Build Work grids only if empty
  if (id === 'work') {
    buildWorkGridsIfNeeded();
  }

  // 5) Refresh any measurement-based libs
  window.ScrollTrigger?.refresh?.();
};

/* ────────────────────────────────────────────────────────────────────────── */
/* DOM ready                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) gsap.ticker.fps(50);

  // Pre-build grids only if their containers exist and are empty (idempotent)
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
