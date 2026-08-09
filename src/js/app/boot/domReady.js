/**
 * @file domReady.js
 * @description DOM-ready boot sequence (menu, loader, animations, initial section reveal).
 */

import gsap from 'gsap';

import { hideLoader, showLoader } from '../../loader.js';
import { setupMenuToggle } from '../../nav.js';
import { initWaveAnimations, initBlobAnimations, deferHeavy } from '../../animations.js';
import { setupHeaderScrollEffect } from '../../init.js';
import { buildWorkGridsIfNeeded } from '../../components/workGridMounts.js';
import { releaseScrollLock } from '../../components/scrollLock.js';
import { addSafariWillChange, enableNoSelectDuringInteraction } from '../../components/ux.js';
import { getAnimationSpeed, prefersReducedMotion } from '../../motion.js';
import { setupContactForm } from '../../components/contactForm.js';

const LOADER_MAX_WAIT_MS = 800;

/** @type {null|(() => void)} */
let cleanupBootAnimations = null;

/**
 * Wait for the router to select the initial page, then allow one browser
 * frame before hiding the loader. The timeout is only a fallback.
 *
 * @param {number} [maxWait=LOADER_MAX_WAIT_MS]
 * @returns {{promise: Promise, cancel: () => void}}
 */
function waitForInitialRoute(maxWait = LOADER_MAX_WAIT_MS) {
  let cancel = () => {};

  const promise = new Promise((resolve) => {
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

    cancel = finish;

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

  return { promise, cancel };
}

/**
 * Boot everything that should run on DOMContentLoaded.
 *
 * @returns {() => void} Cleanup function for deferred and active animation work.
 */
export function bootOnDomReady() {
  cleanupBootAnimations?.();

  let disposed = false;

  /** @type {null|(() => void)} */
  let cleanupWaves = null;

  /** @type {null|(() => void)} */
  let cleanupBlobs = null;

  /** @type {null|(() => void)} */
  let cancelDeferredBlobs = null;

  /** @type {gsap.core.Tween|null} */
  let blobIntroTween = null;

  const routeWait = waitForInitialRoute();

  const cleanup = () => {
    if (disposed) return;

    disposed = true;

    routeWait.cancel();
    cancelDeferredBlobs?.();
    cleanupBlobs?.();
    cleanupWaves?.();

    blobIntroTween?.scrollTrigger?.kill();
    blobIntroTween?.kill();

    cancelDeferredBlobs = null;
    cleanupBlobs = null;
    cleanupWaves = null;
    blobIntroTween = null;

    if (cleanupBootAnimations === cleanup) {
      cleanupBootAnimations = null;
    }
  };

  cleanupBootAnimations = cleanup;

  gsap.globalTimeline.timeScale(getAnimationSpeed());

  setupMenuToggle();
  setupContactForm();
  showLoader();

  buildWorkGridsIfNeeded();

  routeWait.promise.then(() => {
    if (disposed) return;

    hideLoader();
    releaseScrollLock();

    cleanupWaves = initWaveAnimations();

    const blobWrapper = document.querySelector('.morphing-blob-wrapper');

    if (blobWrapper) {
      gsap.killTweensOf(blobWrapper);

      if (prefersReducedMotion()) {
        gsap.set(blobWrapper, { opacity: 1 });
      } else {
        blobIntroTween = gsap.fromTo(
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

      cancelDeferredBlobs = deferHeavy(() => {
        cancelDeferredBlobs = null;

        if (disposed) return;

        cleanupBlobs = initBlobAnimations();
      }, 800);
    }
  });

  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();

  return cleanup;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupBootAnimations?.();
  });
}
