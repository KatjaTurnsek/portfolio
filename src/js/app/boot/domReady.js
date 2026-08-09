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
import { setupHeaderScrollEffect } from '../../init.js';
import { buildWorkGridsIfNeeded } from '../../components/workGridMounts.js';
import { releaseScrollLock } from '../../components/scrollLock.js';
import { addSafariWillChange, enableNoSelectDuringInteraction } from '../../components/ux.js';
import { prefersReducedMotion } from '../../motion.js';

const LOADER_MAX_WAIT_MS = 800;

/**
 * Wait for the router to select the initial page, then allow one browser
 * frame before hiding the loader. The timeout is only a fallback.
 *
 * @param {number} [maxWait=LOADER_MAX_WAIT_MS]
 * @returns {Promise<void>}
 */
function waitForInitialRoute(maxWait = LOADER_MAX_WAIT_MS) {
  return new Promise((resolve) => {
    let finished = false;
    let frameId = 0;
    let timeoutId = 0;

    const finish = () => {
      if (finished) return;

      finished = true;
      window.clearTimeout(timeoutId);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      resolve();
    };

    const checkRouter = () => {
      if (finished) return;

      if (window.__routerActive) {
        frameId = window.requestAnimationFrame(finish);
        return;
      }

      frameId = window.requestAnimationFrame(checkRouter);
    };

    timeoutId = window.setTimeout(finish, maxWait);

    checkRouter();
  });
}

/**
 * Boot everything that should run on DOMContentLoaded.
 *
 * @returns {void}
 */
export function bootOnDomReady() {
  setupMenuToggle();
  showLoader();

  buildWorkGridsIfNeeded();

  waitForInitialRoute().then(() => {
    hideLoader();
    releaseScrollLock();

    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const blobWrapper = document.querySelector('.morphing-blob-wrapper');

    if (blobWrapper) {
      if (prefersReducedMotion()) {
        gsap.set(blobWrapper, { opacity: 1 });
      } else {
        gsap.fromTo(
          blobWrapper,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.2,
            delay: 0.6,
            ease: 'power2.out',
          }
        );
      }

      deferHeavy(() => {
        animateGooeyBlobs();
        enableInteractiveJellyBlob();
      }, 800);
    }
  });

  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
}
