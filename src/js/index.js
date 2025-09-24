/**
 * @file index.js
 * @description App bootstrap & orchestration (slim entry):
 *  - Router setup
 *  - Section visibility hooks (lazy hydration)
 *  - Menu open/close with lazy menu animations + cleanup
 *  - Page-wide effects and fallbacks
 */

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
  animateGooeyBlobs,
  enableInteractiveJellyBlob,
  animateTopDrippingWaves,
  // animateMenuDrippingWaves is lazily imported when the menu opens
} from './animations.js';
import { initSections, revealSection, setupHeaderScrollEffect } from './init.js';
import { animateTextInSection } from './animatedTexts.js';

/* Split components */
import { renderCategory, renderFeatured } from './components/workGrid.js';
import {
  isSafari,
  enableSafariWaveFallback,
  addSafariWillChange,
  revealImagesSequentially,
  enableNoSelectDuringInteraction,
} from './components/ux.js';

import { setupActions } from '../lib/actions.js';

/* ────────────────────────────────────────────────────────────────────────── */
/* Section visibility: lazy hydrate case widgets & run per-section effects   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Handle custom `sectionVisible` events fired by your section initializer.
 */
document.addEventListener('sectionVisible', async (e) => {
  /** @type {{ detail: string }} */
  // @ts-ignore - CustomEvent typing
  const { detail: sectionId } = e;
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Lazy-load case widgets only when a case section becomes visible.
  if (sectionId.startsWith('case-')) {
    const { hydrateCaseSection } = await import('./components/caseAutoWidgets.js');
    hydrateCaseSection(section);
  }

  // On-demand About effects.
  if (sectionId === 'about') {
    const { animateTealBars } = await import('./animations.js');
    animateTealBars();
  }

  // Common text + image effects.
  animateTextInSection(section);
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Menu animations (lazy load + cleanup)                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const menu = document.getElementById('menu');
let menuWavesCleanup /** @type {null | (() => void)} */ = null;

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      // Start menu dripping waves (and animate menu links) lazily.
      if (!menuWavesCleanup) {
        const { animateMenuDrippingWaves } = await import('./animations.js');
        menuWavesCleanup = animateMenuDrippingWaves(); // may be a noop on Safari/reduced-motion
      }
      const { animateMenuLinks } = await import('./animatedTexts.js');
      animateMenuLinks();
    } else {
      // Menu closed: stop & cleanup the canvas ticker/listeners.
      if (menuWavesCleanup) {
        menuWavesCleanup();
        menuWavesCleanup = null;
      }
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Actions (delegated UI events)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Wire app-wide action handlers.
 */
setupActions({
  /**
   * Open a case via in-page anchor or fallback alert from a card.
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
/* DOM ready: boot loader, mounts, and global effects                        */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) {
    gsap.ticker.fps(50);
    enableSafariWaveFallback();
  }

  // Mount project grids if their mounts exist.
  if (document.getElementById('dev-cards')) renderCategory('#dev-cards', 'website');
  if (document.getElementById('design-cards')) renderCategory('#design-cards', 'design');
  if (document.getElementById('logo-cards')) renderCategory('#logo-cards', 'logotype');
  if (document.getElementById('work-cards')) renderFeatured('#work-cards');

  // Defer loader exit + hero/menu visuals slightly.
  setTimeout(() => {
    hideLoader();

    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    // Start top dripping waves with a smooth fade (no cleanup needed unless you want to).
    const wavesCanvas = document.getElementById('top-waves-canvas');
    if (wavesCanvas && !isSafari) {
      gsap.fromTo(
        wavesCanvas,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          ease: 'power2.out',
          onStart: animateTopDrippingWaves, // returns a cleanup if you ever need it
        }
      );
    }

    // Gooey blobs appear after content—animate + enable jelly interaction.
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
            animateGooeyBlobs(); // returns cleanup; not stored since it’s global background
            enableInteractiveJellyBlob();
          },
        }
      );
    }
  }, 1500);

  // CTA → scroll to contact
  const hireBtn = document.getElementById('hireBtn');
  if (hireBtn) {
    hireBtn.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
        revealSection('contact');
      }
    });
  }

  // Global section system + UX helpers
  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
