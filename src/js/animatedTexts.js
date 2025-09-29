/**
 * animatedTexts.js
 *
 * Handles text reveal animations using GSAP + SplitType:
 * - Animates headings (H1–H4) and paragraphs within sections
 * - Animates fullscreen menu links word-by-word
 * - Provides Safari-specific fallbacks for smoother text easing
 * - Skips any element marked with [data-no-reveal] (e.g., LCP text)
 */

import gsap from 'gsap';
import SplitType from 'split-type';

/** True if current browser is Safari (lighter ease applied). */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** Default easing used for text animations, adjusted for Safari. */
const textEase = isSafari ? 'power1.out' : 'power2.out';

/** Selector suffix to skip elements you don’t want animated (e.g., LCP). */
const SKIP = ':not([data-no-reveal])';

/**
 * Animates all text elements within a given section:
 * - H1: springs in word-by-word
 * - H2–H4: slides in line-by-line (Safari: only lines)
 * - P: slides in line-by-line with slight delay
 *
 * Elements with [data-no-reveal] are NOT animated.
 * Respects prefers-reduced-motion (renders text visible, no motion).
 *
 * @param {HTMLElement} section
 * @returns {void}
 */
export function animateTextInSection(section) {
  if (!section) return;

  // Respect reduced motion: just ensure visibility and bail.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section
      .querySelectorAll(`h1${SKIP}, h2${SKIP}, h3${SKIP}, h4${SKIP}, p${SKIP}`)
      .forEach((el) => (el.style.opacity = 1));
    return;
  }

  // H1 (words)
  section.querySelectorAll(`h1${SKIP}`).forEach((heading) => {
    try {
      const split = new SplitType(heading, { types: 'words', tagName: 'span' });
      const words = split.words;
      gsap.set(heading, { opacity: 1 });

      gsap
        .timeline({
          defaults: { ease: isSafari ? 'power1.out' : 'elastic.out(1, 0.4)' },
          onComplete: () => split.revert(),
        })
        .fromTo(
          words,
          { y: 60, opacity: 0, scale: 0.85 },
          { y: 0, opacity: 1, scale: 1, duration: 1.8, stagger: 0.06 }
        );
    } catch {
      heading.style.opacity = 1;
    }
  });

  // H2–H4 (lines; Safari: lines only)
  section.querySelectorAll(`h2${SKIP}, h3${SKIP}, h4${SKIP}`).forEach((el) => {
    try {
      const split = new SplitType(el, {
        types: isSafari ? 'lines' : 'lines, words',
        tagName: 'span',
      });

      gsap.set(split.lines, { yPercent: 100, opacity: 0 });

      gsap
        .timeline({
          defaults: { ease: textEase },
          onComplete: () => split.revert(),
        })
        .to(split.lines, {
          yPercent: 0,
          opacity: 1,
          duration: 1.4,
          stagger: 0.12,
        });
    } catch {
      el.style.opacity = 1;
    }
  });

  // Paragraphs (lines)
  // NOTE: Anything with [data-no-reveal] (e.g., your LCP p.align-right-60) is skipped.
  section.querySelectorAll(`p${SKIP}`).forEach((el) => {
    try {
      const split = new SplitType(el, {
        types: isSafari ? 'lines' : 'lines, words',
        tagName: 'span',
      });

      gsap.set(split.lines, { yPercent: 100, opacity: 0 });

      gsap
        .timeline({
          defaults: { ease: textEase },
          onComplete: () => split.revert(),
        })
        .to(split.lines, {
          yPercent: 0,
          opacity: 1,
          duration: 1.6,
          stagger: 0.12,
          delay: 0.1,
        });
    } catch {
      el.style.opacity = 1;
    }
  });
}

/**
 * Animates menu navigation links (`.fullscreen-menu nav a`) word-by-word.
 * @returns {void}
 */
export function animateMenuLinks() {
  const links = document.querySelectorAll('.fullscreen-menu nav a');

  links.forEach((link) => {
    try {
      // Revert any previous split on this element, then re-split.
      SplitType.revert(link);
      link.classList.remove('animated');

      const split = new SplitType(link, { types: 'words', tagName: 'span' });
      const words = split.words;
      link.classList.add('animated');

      gsap
        .timeline({ defaults: { ease: textEase } })
        .fromTo(
          words,
          { y: 50, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.08 }
        );
    } catch {
      link.style.opacity = 1;
    }
  });
}
