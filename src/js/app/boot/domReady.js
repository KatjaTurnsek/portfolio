/**
 * @file domReady.js
 * @description DOM-ready boot sequence (menu, loader, animations, initial section reveal).
 */

import gsap from 'gsap';

import { hideLoader, showLoader } from '../../loader.js';
import { setupMenuToggle } from '../../nav.js';
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  deferHeavy,
  animateGooeyBlobs,
  enableInteractiveJellyBlob,
} from '../../animations.js';
import { initSections, sizeSectionMinHeight } from '../../init.js';
import { buildWorkGridsIfNeeded } from '../../components/workGridMounts.js';
import { releaseScrollLock } from '../../components/scrollLock.js';
import { bindHireButton } from '../../components/hireButton.js';
import {
  isSafari,
  addSafariWillChange,
  enableNoSelectDuringInteraction,
} from '../../components/ux.js';
import { setupHeaderScrollEffect } from '../../init.js';

/**
 * Boot everything that should run on DOMContentLoaded.
 * @returns {void}
 */
export function bootOnDomReady() {
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

  bindHireButton();

  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
}
