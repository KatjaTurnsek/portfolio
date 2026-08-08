/**
 * @file motion.js
 * @description Shared access to the user's reduced-motion preference.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** @type {MediaQueryList|null} */
const motionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY)
    : null;

/**
 * Return the current reduced-motion preference.
 * Reading the MediaQueryList each time also respects changes made while the
 * page is open.
 *
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return motionQuery?.matches ?? false;
}
