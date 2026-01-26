/**
 * @file sectionVisibleHandler.js
 * @description Handles `sectionVisible` events fired by init.js revealSection().
 * Keeps page init file small and focused.
 */

import { sizeSectionMinHeight } from '../init.js';
import { animateTextInSection } from '../animatedTexts.js';
import { setupResponsiveImages } from '../responsiveImages.js';
import { revealImagesSequentially } from './ux.js';

/**
 * Bind the `sectionVisible` event listener once.
 * @returns {void}
 */
export function bindSectionVisibleHandler() {
  if (document.__sectionVisibleHandlerBound) return;
  document.__sectionVisibleHandlerBound = true;

  document.addEventListener('sectionVisible', async (e) => {
    /** @type {{detail:string}} @ts-ignore */
    const { detail: sectionId } = e;

    const section = document.getElementById(sectionId);
    if (!section) return;

    sizeSectionMinHeight(section);

    if (sectionId.startsWith('case-')) {
      const { hydrateCaseSection } = await import('./caseAutoWidgets.js');
      hydrateCaseSection(section);
    }

    if (sectionId === 'about') {
      const { animateTealBars } = await import('../animations.js');
      animateTealBars();
    }

    animateTextInSection(section);
    const loadedImages = setupResponsiveImages(section);
    revealImagesSequentially(loadedImages);
  });
}
