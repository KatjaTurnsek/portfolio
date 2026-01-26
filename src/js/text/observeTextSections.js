/**
 * @file observeTextSections.js
 * @description Optional: animate only when sections become visible (same as original).
 */

import { animateTextInSection } from './animateTextInSection.js';

/**
 * Observe sections and run `animateTextInSection` when they enter the viewport.
 *
 * Usage:
 *   observeTextSections(document.querySelectorAll('.fullscreen-section'));
 *
 * Includes a fallback for environments without IntersectionObserver.
 *
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} sections
 * @param {string} [rootMargin='0px 0px -10% 0px']
 * @returns {void}
 */
export function observeTextSections(sections, rootMargin = '0px 0px -10% 0px') {
  if (!sections) return;
  const arr = Array.from(sections);

  // Fallback: animate immediately if IO is unavailable (older iOS / in-app views)
  if (typeof IntersectionObserver === 'undefined') {
    arr.forEach((s) => animateTextInSection(s));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateTextInSection(/** @type {HTMLElement} */ (entry.target));
          obs.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin, threshold: 0.15 }
  );

  arr.forEach((s) => io.observe(s));
}
