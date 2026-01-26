/**
 * @file animateTextInSection.js
 * @description Main text reveal logic (same behavior as your original animatedTexts.js).
 */

import gsap from 'gsap';
import { REDUCED, RICH_MOBILE, SAFARI_LITE, textEase, SKIP, LONG_P_THRESHOLD } from './profile.js';
import { safeSplit, markOnce, clearInline } from './utils.js';

/**
 * Animate headings and paragraphs inside a given section element.
 * Respects prefers-reduced-motion and avoids double-initialization.
 * @param {HTMLElement} section
 * @returns {void}
 */
export function animateTextInSection(section) {
  if (!section) return;

  // Reduced motion: reveal without animation
  if (REDUCED) {
    section
      .querySelectorAll(`h1${SKIP}, h2${SKIP}, h3${SKIP}, h4${SKIP}, p${SKIP}`)
      .forEach((el) => /** @type {HTMLElement} */ (el.style.opacity = '1'));
    return;
  }

  /* H1 — hero headings */
  section.querySelectorAll(`h1${SKIP}`).forEach((heading) => {
    const h = /** @type {HTMLElement} */ (heading);
    if (!markOnce(h)) return;

    const useWords = RICH_MOBILE || !SAFARI_LITE;
    const types = useWords ? 'words' : 'lines';
    const split = safeSplit(h, { types, tagName: 'span' });

    /** @type {HTMLElement[]|undefined} */
    // @ts-ignore SplitType typing: words/lines arrays are HTMLElements
    const items = useWords ? split?.words : split?.lines;

    if (!split || !items?.length) {
      split?.revert?.();
      h.style.opacity = '1';
      return;
    }

    gsap.set(h, { opacity: 1 });
    h.style.willChange = 'transform, opacity';

    gsap.set(items, {
      y: 40,
      opacity: 0,
      ...(useWords ? { scale: 0.96, filter: 'blur(2px)' } : {}),
      willChange: 'transform, opacity, filter',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: useWords ? 'elastic.out(1, 0.5)' : 'power1.out' },
        onComplete: () => {
          split.revert();
          clearInline(h, ['will-change', 'opacity', 'transform', 'filter']);
        },
      })
      .to(items, {
        y: 0,
        opacity: 1,
        ...(useWords ? { scale: 1, filter: 'blur(0px)' } : {}),
        duration: useWords ? 1.2 : 0.9,
        stagger: useWords ? 0.06 : 0.05,
        clearProps: 'transform,opacity,filter',
      });
  });

  /* H2–H4 — subheadings (lines) */
  section.querySelectorAll(`h2${SKIP}, h3${SKIP}, h4${SKIP}`).forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    if (!markOnce(el)) return;

    const split = safeSplit(el, { types: 'lines', tagName: 'span' });
    // @ts-ignore
    const lines = split?.lines;
    if (!split || !lines?.length) {
      split?.revert?.();
      el.style.opacity = '1';
      return;
    }

    const rich = RICH_MOBILE && !REDUCED;
    el.style.willChange = 'transform, opacity';

    gsap.set(lines, {
      yPercent: 100,
      opacity: 0,
      ...(rich ? { skewY: 3, filter: 'blur(1.2px)' } : {}),
      transformOrigin: '0% 100%',
      willChange: 'transform, opacity, filter',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          clearInline(el, ['will-change', 'opacity', 'transform', 'filter']);
        },
      })
      .to(lines, {
        yPercent: 0,
        opacity: 1,
        ...(rich ? { skewY: 0, filter: 'blur(0px)' } : {}),
        duration: SAFARI_LITE ? 0.85 : 1.05,
        stagger: 0.085,
        clearProps: 'transform,opacity,filter',
      });
  });

  /* Paragraphs — lines (skip truly long ones on weaker devices) */
  section.querySelectorAll(`p${SKIP}`).forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    if (!markOnce(el)) return;

    const isLong = (el.textContent?.trim().length || 0) > LONG_P_THRESHOLD;

    if (isLong) {
      // Cheaper: no splitting; simple fade/slide
      el.style.willChange = 'transform, opacity';
      gsap.set(el, { y: 24, opacity: 0, force3D: false });
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: textEase,
        delay: 0.05,
        onComplete: () => clearInline(el, ['will-change', 'opacity', 'transform']),
      });
      return;
    }

    const split = safeSplit(el, { types: 'lines', tagName: 'span' });
    // @ts-ignore
    const lines = split?.lines;
    if (!split || !lines?.length) {
      split?.revert?.();
      el.style.opacity = '1';
      return;
    }

    const rich = RICH_MOBILE && !REDUCED;
    el.style.willChange = 'transform, opacity';

    gsap.set(lines, {
      yPercent: 100,
      opacity: 0,
      ...(rich ? { filter: 'blur(1px)' } : {}),
      willChange: 'transform, opacity, filter',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          clearInline(el, ['will-change', 'opacity', 'transform', 'filter']);
        },
      })
      .to(lines, {
        yPercent: 0,
        opacity: 1,
        ...(rich ? { filter: 'blur(0px)' } : {}),
        duration: SAFARI_LITE ? 0.9 : 1.05,
        stagger: 0.085,
        delay: 0.03,
        clearProps: 'transform,opacity,filter',
      });
  });

  // Light hint on the section, then clear
  section.style.willChange = 'opacity';
  requestAnimationFrame(() => clearInline(section, ['will-change']));
}
