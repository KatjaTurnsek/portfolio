/**
 * @file sizeSectionMinHeight.js
 * @description Computes and applies a min-height so the footer sits at the bottom.
 */

/**
 * Ensure the visible section is tall enough to keep the footer at the bottom.
 * Uses viewport height minus header & footer heights.
 * @param {HTMLElement} section
 * @returns {void}
 */
export function sizeSectionMinHeight(section) {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const vh = window.innerHeight;
  const hH = header?.offsetHeight || 0;
  const fH = footer?.offsetHeight || 0;
  const min = Math.max(0, vh - hH - fH);
  section.style.minHeight = `${min}px`;
}
