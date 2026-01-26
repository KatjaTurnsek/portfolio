/**
 * @file resizeMinHeight.js
 * @description Keeps the currently visible fullscreen section sized correctly on resize.
 */

/**
 * Bind a throttled resize handler that updates min-height for the currently visible section.
 * @param {(section: HTMLElement) => void} sizeFn
 * @returns {void}
 */
export function bindResizeMinHeight(sizeFn) {
  let resizeScheduled = false;

  /** @returns {void} */
  const onResize = () => {
    if (resizeScheduled) return;
    resizeScheduled = true;

    requestAnimationFrame(() => {
      const current = document.querySelector('.fullscreen-section.visible');
      if (current) sizeFn(/** @type {HTMLElement} */ (current));
      resizeScheduled = false;
    });
  };

  window.addEventListener('resize', onResize, { passive: true });
}
