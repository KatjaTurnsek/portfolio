/**
 * App bootstrap
 * - Router setup
 * - Safe section reveal + runtime min-height sizing
 * - Menu open/close (lazy-init menu wave image) + cleanup
 * - Loader show/hide + visuals (respects reduced-motion)
 */

const baseFromTag = document.querySelector('base')?.getAttribute('href') || '/';
const baseFromVite = import.meta?.env?.BASE_URL || '/';
window.__BASE_URL__ = (baseFromTag || baseFromVite).replace(/\/?$/, '/');

import '../css/main.css';
import './router.js';
window.__routerActive = true;

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
  revealSection,
  setupHeaderScrollEffect,
  sizeSectionMinHeight,
} from './init.js';
import { animateTextInSection } from './animatedTexts.js';

/* Split components */
import { renderCategory, renderFeatured } from './components/workGrid.js';
import {
  isSafari,
  addSafariWillChange,
  revealImagesSequentially,
  enableNoSelectDuringInteraction,
} from './components/ux.js';

import { setupActions } from '../lib/actions.js';

/* ────────────────────────────────────────────────────────────────────────── */
/* Utilities                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** @type {boolean} Honor user’s reduced-motion setting. */
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Remove any scroll locking side effects that could linger after menu close.
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Section visibility: hydrate + effects + resize-based min-height            */
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
    if (!prefersReducedMotion) animateTealBars();
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
/* Menu open/close (lazy-init menu wave; animate links)                       */
/* ────────────────────────────────────────────────────────────────────────── */

/** @type {HTMLElement|null} */
const menu = document.getElementById('menu');
/** @type {null | (() => void)} */
let stopWaveThemeObserver = null;
/** @type {boolean} */
let menuWaveInited = false;

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      // Initialize MENU wave image on first open (header wave is CSS-only)
      if (!menuWaveInited) {
        setupStaticWaves();
        const maybeDisposer = observeThemeChangesForWaves();
        if (typeof maybeDisposer === 'function') stopWaveThemeObserver = maybeDisposer;
        menuWaveInited = true;
      }

      const { animateMenuLinks } = await import('./animatedTexts.js');
      if (!prefersReducedMotion) animateMenuLinks();
    } else {
      // Optionally stop observing while menu is closed
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
/* Actions (delegated UI events)                                              */
/* ────────────────────────────────────────────────────────────────────────── */

setupActions({
  /**
   * Open a case card or smooth-scroll to in-page anchor.
   * @param {{el:HTMLElement, ev?:Event}} args
   */
  'open-case': ({ el, ev }) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const href = el.getAttribute('href') || el.dataset.href || el.getAttribute('data-href');
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (target.id) revealSection(target.id);
        return;
      }
    }

    const cardTitle = el.closest('.card')?.querySelector('.card__title')?.textContent?.trim();
    if (cardTitle) alert(`Open case study: ${cardTitle}`);
  },
});

/* ────────────────────────────────────────────────────────────────────────── */
/* DOM ready: boot loader, mounts, and global effects                         */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) gsap.ticker.fps(50);

  // Mount project grids if their mounts exist.
  if (document.getElementById('dev-cards')) renderCategory('#dev-cards', 'website');
  if (document.getElementById('design-cards')) renderCategory('#design-cards', 'design');
  if (document.getElementById('logo-cards')) renderCategory('#logo-cards', 'logotype');
  if (document.getElementById('work-cards')) renderFeatured('#work-cards');

  // Defer loader exit + most visuals a bit.
  setTimeout(() => {
    hideLoader();
    releaseScrollLock();

    insertWaveLines();
    if (!prefersReducedMotion) {
      animateWaveLine();
      animateCustomWaveLines();
    }

    if (!prefersReducedMotion) {
      const blobWrapper = document.querySelector('.morphing-blob-wrapper');
      if (blobWrapper) {
        gsap.fromTo(
          blobWrapper,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.5,
            delay: 0.8,
            ease: 'power2.out',
            onStart: () => {
              deferHeavy(() => {
                animateGooeyBlobs();
                enableInteractiveJellyBlob();
              });
            },
          }
        );
      }
    }

    const currentId = window.__currentSectionId || 'home';
    const currentEl = document.getElementById(currentId);
    if (currentEl) {
      revealSection(currentId);
      sizeSectionMinHeight(currentEl);
    }
  }, 1500);

  // CTA → scroll to contact
  const hireBtn = document.getElementById('hireBtn');
  if (hireBtn) {
    hireBtn.addEventListener(
      'click',
      () => {
        const contact = document.getElementById('contact');
        if (contact) {
          contact.scrollIntoView({ behavior: 'smooth' });
          revealSection('contact');
        }
      },
      { passive: true }
    );
  }

  // Global fallbacks / effects
  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
