/**
 * @file ux.js
 * @description Small UX/perf utilities used across the app.
 */

import gsap from 'gsap';

/** True if current browser is Safari (simple UA heuristic). */
export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/* ────────────────────────────────────────────────────────────────────────── */
/* Safari: light GPU hints                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Add light will-change hints on frequently animated elements in Safari only.
 * Keeps GPU hints restrained to avoid over-allocating surfaces.
 * @returns {void}
 */
export function addSafariWillChange() {
  if (!isSafari) return;
  const selectors = [
    '.blob-group',
    '.blob',
    '.bar-bg',
    '.bar-1',
    '.bar-2',
    '.bar-3',
    '.bar-label',
    '.wavy-line',
    '.wavy-polyline',
    '.top-waves .waves-fallback',
    '.menu-waves .waves-fallback',
  ];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      /** @type {HTMLElement} */ (el).style.willChange = 'transform, opacity';
    });
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Progressive image reveal                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Sequentially fade in a batch of images (cards, gallery, etc).
 * Images are expected to start with CSS `opacity:0; filter:blur(10px);`.
 * @param {HTMLImageElement[]} images
 * @param {{ baseDelay?: number, step?: number, duration?: number }} [opts]
 * @returns {void}
 */
export function revealImagesSequentially(images, opts = {}) {
  if (!Array.isArray(images) || images.length === 0) return;

  const baseDelay = Math.max(0, opts.baseDelay ?? 0);
  const step = Math.max(0.01, opts.step ?? 0.075);
  const duration = Math.max(0.2, opts.duration ?? 0.5);

  let i = 0;
  const fadeIn = (img, idx) => {
    gsap.to(img, {
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      delay: baseDelay + step * idx,
      ease: 'power2.out',
    });
  };

  const tryProcess = (img, idx) => {
    if (img.complete && img.naturalWidth > 0) {
      fadeIn(img, idx);
      return true;
    }
    return false;
  };

  images.forEach((img) => {
    const idx = i++;
    if (tryProcess(img, idx)) return;

    const onLoad = () => fadeIn(img, idx);
    const onError = () => {
      gsap.to(img, { opacity: 1, filter: 'blur(0px)', duration: 0.3 });
    };

    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* No-select helper                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Prevent text selection during drag interactions (minor UX polish).
 * Idempotent: calling multiple times won’t add duplicate listeners.
 * @returns {void}
 */
export function enableNoSelectDuringInteraction() {
  const body = document.body;
  if (!body || body.dataset.noSelectBound === '1') return;

  const addNoSelect = () => body.classList.add('no-select');
  const removeNoSelect = () => body.classList.remove('no-select');

  document.addEventListener('mousedown', addNoSelect, { passive: true });
  document.addEventListener('mouseup', removeNoSelect, { passive: true });

  document.addEventListener('touchstart', addNoSelect, { passive: true });
  document.addEventListener('touchend', removeNoSelect, { passive: true });
  document.addEventListener('touchcancel', removeNoSelect, { passive: true });

  body.dataset.noSelectBound = '1';
}
