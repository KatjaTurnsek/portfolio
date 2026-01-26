/**
 * @file animateMenuLinks.js
 * @description Fullscreen menu link word animation (same as original).
 */

import gsap from 'gsap';
import { RICH_MOBILE, REDUCED, SAFARI_LITE, textEase } from './profile.js';
import { safeSplit, safeRevert, clearInline } from './utils.js';

/**
 * Animate words inside fullscreen menu links.
 * @returns {void}
 */
export function animateMenuLinks() {
  const links = document.querySelectorAll('.fullscreen-menu nav a');

  links.forEach((link) => {
    const a = /** @type {HTMLElement} */ (link);

    safeRevert(a);
    a.classList.remove('animated');

    const split = safeSplit(a, { types: 'words', tagName: 'span' });
    // @ts-ignore
    const words = split?.words;
    if (!split || !words?.length) {
      a.style.opacity = '1';
      return;
    }

    a.classList.add('animated');
    a.style.willChange = 'transform, opacity';

    gsap.set(words, {
      y: 48,
      opacity: 0,
      ...(RICH_MOBILE && !REDUCED ? { scale: 0.94 } : {}),
      willChange: 'transform, opacity',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          clearInline(a, ['will-change', 'opacity', 'transform']);
        },
      })
      .to(words, {
        y: 0,
        opacity: 1,
        ...(RICH_MOBILE && !REDUCED ? { scale: 1 } : {}),
        duration: SAFARI_LITE ? 0.7 : 1.0,
        stagger: 0.07,
        clearProps: 'transform,opacity',
      });
  });
}
