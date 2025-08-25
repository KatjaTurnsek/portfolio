/**
 * animatedTexts.js
 *
 * Handles text reveal animations using GSAP + SplitType:
 * - Animates headings (H1–H4) and paragraphs within sections
 * - Animates fullscreen menu links word-by-word
 * - Provides Safari-specific fallbacks for smoother text easing
 */

import gsap from "gsap";
import SplitType from "split-type";

/**
 * True if current browser is Safari (lighter ease applied).
 * @constant {boolean}
 */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Default easing used for text animations, adjusted for Safari.
 * @constant {string}
 */
const textEase = isSafari ? "power1.out" : "power2.out";

/**
 * Animates all text elements within a given section:
 * - H1: springs in word-by-word
 * - H2–H4: slides in line-by-line (Safari: only lines)
 * - P: slides in line-by-line with slight delay
 *
 * Uses GSAP + SplitType to split text into animatable spans.
 * Falls back to simple opacity if SplitType fails.
 *
 * @function animateTextInSection
 * @param {HTMLElement} section - The section element containing text to animate.
 * @returns {void}
 */
export function animateTextInSection(section) {
  if (!section) return;

  // Animate H1s
  const h1s = section.querySelectorAll("h1");
  h1s.forEach((heading) => {
    document.fonts.ready.then(() => {
      try {
        const split = new SplitType(heading, {
          types: "words",
          tagName: "span",
        });
        const words = split.words;
        gsap.set(heading, { opacity: 1 });

        gsap
          .timeline({
            defaults: { ease: isSafari ? "power1.out" : "elastic.out(1, 0.4)" },
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
  });

  // Animate H2–H4
  const headings = section.querySelectorAll("h2, h3, h4");
  headings.forEach((el) => {
    try {
      const split = new SplitType(el, {
        types: isSafari ? "lines" : "lines, words",
        tagName: "span",
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

  // Animate paragraphs
  const paragraphs = section.querySelectorAll("p");
  paragraphs.forEach((el) => {
    try {
      const split = new SplitType(el, {
        types: isSafari ? "lines" : "lines, words",
        tagName: "span",
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
 * Animates menu navigation links (`.fullscreen-menu nav a`)
 * word-by-word when the menu is opened.
 * Uses SplitType to split link text, then GSAP to animate in sequence.
 *
 * @function animateMenuLinks
 * @returns {void}
 */
export function animateMenuLinks() {
  const links = document.querySelectorAll(".fullscreen-menu nav a");

  links.forEach((link) => {
    try {
      SplitType.revert(link);
      link.classList.remove("animated");

      const split = new SplitType(link, { types: "words", tagName: "span" });
      const words = split.words;
      link.classList.add("animated");

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
