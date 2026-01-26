/**
 * @file utils.js
 * @description Utilities for text reveal animations (SplitType safety + cleanup).
 */

import SplitType from 'split-type';

/**
 * Create a SplitType instance safely.
 * @param {Element} el
 * @param {import('split-type').SplitOptions} opts
 * @returns {import('split-type').default | null}
 */
export function safeSplit(el, opts) {
  try {
    return new SplitType(el, opts);
  } catch {
    return null;
  }
}

/**
 * Ensure each element is animated once per page view.
 * @param {HTMLElement} el
 * @returns {boolean} true if marked for the first time
 */
export function markOnce(el) {
  if (el.dataset.revealed === '1') return false;
  el.dataset.revealed = '1';
  return true;
}

/**
 * Remove inline styles set by GSAP/setup to leave DOM clean.
 * @param {HTMLElement} el
 * @param {string[]} props
 * @returns {void}
 */
export function clearInline(el, props) {
  for (const p of props) el.style.removeProperty(p);
}

/**
 * Best-effort revert of SplitType on an element.
 * @param {HTMLElement} el
 * @returns {void}
 */
export function safeRevert(el) {
  try {
    SplitType.revert(el);
  } catch {
    /* ignore */
  }
}
