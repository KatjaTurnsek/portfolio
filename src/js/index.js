/**
 * @file index.js
 * @description App bootstrap:
 *  - Router setup (original behavior)
 *  - Safe section reveal + runtime min-height sizing (keeps footer flush)
 *  - Menu open/close + cleanup
 *  - Loader show/hide and visuals
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
  scheduleTopWavesAfterLCP,
  scheduleMenuWavesAfterLCP,
  scheduleBlobsAfterLCP,
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
  enableSafariWaveFallback,
  addSafariWillChange,
  revealImagesSequentially,
  enableNoSelectDuringInteraction,
} from './components/ux.js';

import { setupActions } from '../lib/actions.js';

/* Hard guard: never leave scroll locked */
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
/* Section visibility: hydrate + effects + resize-based min-height           */
/* ────────────────────────────────────────────────────────────────────────── */

document.addEventListener('sectionVisible', async (e) => {
  // @ts-ignore
  const { detail: sectionId } = e;
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Ensure footer sits at bottom on this section
  sizeSectionMinHeight(section);

  // Lazy-load case widgets
  if (sectionId.startsWith('case-')) {
    const { hydrateCaseSection } = await import('./components/caseAutoWidgets.js');
    hydrateCaseSection(section);
  }

  // About page adornments on demand
  if (sectionId === 'about') {
    const { animateTealBars } = await import('./animations.js');
    animateTealBars();
  }

  // Common text + image effects
  animateTextInSection(section);
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

/* Recompute min-height on resize for the visible section */
window.addEventListener(
  'resize',
  () => {
    const current = document.querySelector('.fullscreen-section.visible');
    if (current) sizeSectionMinHeight(current);
  },
  { passive: true }
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Menu animations (deferred start + cleanup on close)                       */
/* ────────────────────────────────────────────────────────────────────────── */

const menu = document.getElementById('menu');
let stopMenuWaves = null;

if (menu) {
  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      if (!stopMenuWaves) stopMenuWaves = scheduleMenuWavesAfterLCP();
      const { animateMenuLinks } = await import('./animatedTexts.js');
      animateMenuLinks();
    } else {
      if (stopMenuWaves) {
        stopMenuWaves();
        stopMenuWaves = null;
      }
      releaseScrollLock();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Actions (delegated UI events)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

setupActions({
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

  // Defer loader exit + visuals a bit.
  setTimeout(() => {
    hideLoader();
    releaseScrollLock();

    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const wavesCanvas = document.getElementById('top-waves-canvas');
    if (wavesCanvas && !isSafari) {
      gsap.fromTo(
        wavesCanvas,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, delay: 0.3, ease: 'power2.out' }
      );
      scheduleTopWavesAfterLCP();
    }

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
            scheduleBlobsAfterLCP();
          },
        }
      );
    }

    // Make sure the currently routed section is revealed + sized
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
    hireBtn.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
        revealSection('contact');
      }
    });
  }

  // Global fallbacks
  initSections(); // no-op with router; safe
  setupHeaderScrollEffect(); // header styling
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
