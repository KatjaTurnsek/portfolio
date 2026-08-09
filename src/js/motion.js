/**
 * @file motion.js
 * @description Shared access to motion preferences and animation speed.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_ANIMATION_QUERY = '(max-width: 767px)';
const MOBILE_ANIMATION_SPEED = 1.4;

/** @type {MediaQueryList|null} */
const motionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_MOTION_QUERY)
    : null;

/** @type {MediaQueryList|null} */
const mobileAnimationQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_ANIMATION_QUERY)
    : null;

/**
 * Return the current reduced-motion preference.
 *
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return motionQuery?.matches ?? false;
}

/**
 * Return the animation speed for the current viewport.
 * Mobile animations run faster so they feel as responsive as desktop motion.
 *
 * @returns {number}
 */
export function getAnimationSpeed() {
  if (prefersReducedMotion()) return 1;

  return mobileAnimationQuery?.matches ? MOBILE_ANIMATION_SPEED : 1;
}
