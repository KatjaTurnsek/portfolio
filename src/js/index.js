/**
 * @file app.js
 * @overview App initialization & wiring:
 *  - Router setup
 *  - Safe section reveal + runtime min-height sizing
 *  - Menu open/close (lazy-init menu wave image) + cleanup
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
    // Expose for other modules
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

/** Respect reduced motion */
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Release any scroll locks applied by menu overlays.
 * @returns {void}
 */
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
 * Build Work grids only if they are empty. Safe to call multiple times.
 * @returns {void}
 */
function buildWorkGridsIfNeeded() {
  /**
   * @param {string} sel
   * @returns {boolean}
   */
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
 * Fired by the router/init when a section becomes visible.
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
      if (current) sizeSectionMinHeight(/** @type {HTMLElement} */ (current));
      resizeScheduled = false;
    });
  };
  window.addEventListener('resize', onResize, { passive: true });
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Menu open/close                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/** Menu element reference and theme wave observer cleanup. */
const menu = document.getElementById('menu');
/** @type {null | (() => void)} */
let stopWaveThemeObserver = null;
let menuWaveInited = false;

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      // Lazily init static wave images once (menu context)
      if (!menuWaveInited) {
        setupStaticWaves();
        const maybeDisposer = observeThemeChangesForWaves();
        if (typeof maybeDisposer === 'function') stopWaveThemeObserver = maybeDisposer;
        menuWaveInited = true;
      }

      // Animate menu link words when opening (if motion allowed)
      const { animateMenuLinks } = await import('./animatedTexts.js');
      if (!prefersReducedMotion) animateMenuLinks();
    } else {
      // Clean up observers and release any scroll locks
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
 * Handlers should be idempotent and side-effect–safe.
 */
setupActions({
  /**
   * Open a case either by in-page #hash scroll or by navigating to href.
   * (No alerts/console in production.)
   */
  'open-case': ({ el, ev }) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const href = el.getAttribute('href') || el.dataset.href || el.getAttribute('data-href') || '';

    // If it's an in-page anchor, scroll and reveal
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (target.id) window.revealSection?.(target.id);
        return;
      }
    }

    // If it's an absolute URL or app-relative path, navigate
    if (href) {
      // Use router-friendly push if available; fallback to location.assign
      if (window.__routerActive && !/^[a-z]+:/i.test(href)) {
        history.pushState({}, '', href);
        // Router will handle reveal; as a safety, try to reveal by id from path end
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

/**
 * Reveal/refresh logic per section.
 * Called by the router after it shows a section.
 * MUST be safe to call multiple times (idempotent).
 * @param {string} id - section element id (e.g. "home", "work", "contact", "case-portfolio")
 * @returns {void}
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

  // 2) Core reveal (original logic from init.js)
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

/**
 * Initial boot:
 * - Menu toggle + loader show
 * - Optional Safari ticker tuning
 * - Pre-build grids (idempotent)
 * - Hide loader, run decorative animations (waves, blobs), reveal current section
 * - Hook up "Hire Me" CTA smooth scroll
 * - Init sections, header scroll effect, UX helpers
 */
document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) gsap.ticker.fps(50);

  // Pre-build grids only if their containers exist and are empty (idempotent)
  buildWorkGridsIfNeeded();

  setTimeout(() => {
    hideLoader();
    releaseScrollLock();

    // Headings: line decorations
    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    // Blob ambience (deferred heavy work)
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

    // Reveal the current section (from router/init), default to 'home'
    const currentId = window.__currentSectionId || 'home';
    const currentEl = document.getElementById(currentId);
    if (currentEl) {
      window.revealSection?.(currentId);
      sizeSectionMinHeight(currentEl);
    }
  }, 1500);

  // Smooth scroll to contact from "Hire Me" button (no alerts)
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

  // Core app wiring
  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
