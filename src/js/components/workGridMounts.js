/**
 * @file workGridMounts.js
 * @description Lazy-build project grids when their mounts exist and are empty.
 */

import { renderCategory, renderFeatured } from './workGrid.js';

/**
 * Build work grids if containers exist and are still empty.
 * Safe to call multiple times.
 *
 * @returns {void}
 */
export function buildWorkGridsIfNeeded() {
  /**
   * Check if a mount exists and has no children.
   * @param {string} sel
   * @returns {boolean}
   */
  const empty = (sel) => {
    const el = document.querySelector(sel);
    return !!el && el.childElementCount === 0;
  };

  if (document.getElementById('dev-cards') && empty('#dev-cards')) {
    renderCategory('#dev-cards', 'website');
  }
  if (document.getElementById('design-cards') && empty('#design-cards')) {
    renderCategory('#design-cards', 'design');
  }
  if (document.getElementById('logo-cards') && empty('#logo-cards')) {
    renderCategory('#logo-cards', 'logotype');
  }
  if (document.getElementById('work-cards') && empty('#work-cards')) {
    renderFeatured('#work-cards');
  }
}
