/**
 * @file env.js
 * @description Shared animation environment helpers for text animations.
 */

import gsap from 'gsap';

/**
 * Check reduced motion preference (safe in browser).
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export { gsap };
