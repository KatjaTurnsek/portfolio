/**
 * @file bindAppHandlers.js
 * @description Central place to bind app-wide listeners/observers.
 */

import { bindSectionVisibleHandler } from '../../components/sectionVisibleHandler.js';
import { bindResizeMinHeight } from '../../components/resizeMinHeight.js';
import { releaseScrollLock } from '../../components/scrollLock.js';

/**
 * Bind global app handlers (safe to call once).
 * @param {{ prefersReducedMotion: boolean, sizeFn: (section: HTMLElement) => void }} opts
 * @returns {void}
 */
export function bindAppHandlers(opts) {
  bindSectionVisibleHandler();
  bindResizeMinHeight(opts.sizeFn);

  const menu = document.getElementById('menu');
  if (!menu) return;

  const observer = new MutationObserver(async () => {
    const open = menu.classList.contains('open');

    if (open) {
      // Animate menu link words when opening (if motion allowed)
      const { animateMenuLinks } = await import('../../animatedTexts.js');
      if (!opts.prefersReducedMotion) animateMenuLinks();
    } else {
      releaseScrollLock();
    }
  });

  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}
