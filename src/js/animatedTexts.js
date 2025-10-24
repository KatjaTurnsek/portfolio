/**
 * Text reveal animations using GSAP + SplitType:
 * - H1: words (Safari/iOS-lite: lines)
 * - H2–H4: lines
 * - P: lines, but skip splitting very long paragraphs (fallback fade/slide)
 * - Menu links: words
 * - Optional IntersectionObserver with a no-IO fallback
 * - Respects prefers-reduced-motion
 */

import gsap from 'gsap';
import SplitType from 'split-type';

/* ────────────────────────────────────────────────────────────────────────── */
/* Environment & perf profile                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const ua = navigator.userAgent;
const IS_IOS =
  /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg|EdgiOS/.test(ua);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HW_THREADS = navigator.hardwareConcurrency || 4;

// “Lite” when Safari/iOS + modest cores, smaller viewport, or reduced motion
const SAFARI_LITE = (isSafari || IS_IOS) && (HW_THREADS <= 6 || window.innerWidth < 900 || REDUCED);

/** Default easing */
const textEase = SAFARI_LITE ? 'power1.out' : 'power2.out';

/** Skip selector (e.g., LCP text) */
const SKIP = ':not([data-no-reveal])';

/** Long paragraph threshold (slightly lower on very small screens) */
const LONG_P_THRESHOLD = window.innerWidth < 480 ? 360 : 560;

/* Utilities */
function safeSplit(el, opts) {
  try {
    return new SplitType(el, opts);
  } catch {
    return null;
  }
}
function markOnce(el) {
  if (el.dataset.revealed === '1') return false;
  el.dataset.revealed = '1';
  return true;
}
function clearInline(el, props) {
  for (const p of props) el.style.removeProperty(p);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main: animate all text in a section                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @param {HTMLElement} section
 */
export function animateTextInSection(section) {
  if (!section) return;

  // Reduced motion: just show
  if (REDUCED) {
    section
      .querySelectorAll(`h1${SKIP}, h2${SKIP}, h3${SKIP}, h4${SKIP}, p${SKIP}`)
      .forEach((el) => (el.style.opacity = 1));
    return;
  }

  // ⚠️ Do NOT use CSS containment here (breaks SplitType line metrics on iOS)

  /* H1 — hero headings */
  section.querySelectorAll(`h1${SKIP}`).forEach((heading) => {
    if (!markOnce(heading)) return;

    const types = SAFARI_LITE ? 'lines' : 'words';
    const split = safeSplit(heading, { types, tagName: 'span' });
    if (!split) {
      heading.style.opacity = 1;
      return;
    }

    const items = SAFARI_LITE ? split.lines : split.words;
    if (!items?.length) {
      split.revert();
      heading.style.opacity = 1;
      return;
    }

    gsap.set(heading, { opacity: 1 });
    heading.style.willChange = 'transform, opacity';

    gsap.set(items, {
      y: SAFARI_LITE ? 40 : 60,
      opacity: 0,
      ...(SAFARI_LITE ? {} : { scale: 0.92 }),
      willChange: 'transform, opacity',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: SAFARI_LITE ? 'power1.out' : 'elastic.out(1, 0.4)' },
        onComplete: () => {
          split.revert();
          clearInline(heading, ['will-change', 'opacity', 'transform']);
        },
      })
      .to(items, {
        y: 0,
        opacity: 1,
        ...(SAFARI_LITE ? {} : { scale: 1 }),
        duration: SAFARI_LITE ? 0.9 : 1.6,
        stagger: SAFARI_LITE ? 0.05 : 0.06,
        clearProps: 'transform,opacity',
      });
  });

  /* H2–H4 — subheadings (lines) */
  section.querySelectorAll(`h2${SKIP}, h3${SKIP}, h4${SKIP}`).forEach((el) => {
    if (!markOnce(el)) return;

    const split = safeSplit(el, { types: 'lines', tagName: 'span' });
    if (!split?.lines?.length) {
      split?.revert?.();
      el.style.opacity = 1;
      return;
    }

    el.style.willChange = 'transform, opacity';

    gsap.set(split.lines, {
      yPercent: 100,
      opacity: 0,
      willChange: 'transform, opacity',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          clearInline(el, ['will-change', 'opacity', 'transform']);
        },
      })
      .to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration: SAFARI_LITE ? 0.85 : 1.2,
        stagger: 0.1,
        clearProps: 'transform,opacity',
      });
  });

  /* Paragraphs — lines (skip very long ones) */
  section.querySelectorAll(`p${SKIP}`).forEach((el) => {
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
    if (!split?.lines?.length) {
      split?.revert?.();
      el.style.opacity = 1;
      return;
    }

    el.style.willChange = 'transform, opacity';

    gsap.set(split.lines, {
      yPercent: 100,
      opacity: 0,
      willChange: 'transform, opacity',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          (clearInline(el, ['will-change', 'opacity', 'transform']),
            // ensure final layout is clean
            0);
        },
      })
      .to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration: SAFARI_LITE ? 0.9 : 1.2,
        stagger: 0.1,
        delay: 0.05,
        clearProps: 'transform,opacity',
      });
  });

  // Optional: light hint on the section, then clear
  section.style.willChange = 'opacity';
  requestAnimationFrame(() => clearInline(section, ['will-change']));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Fullscreen menu links                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export function animateMenuLinks() {
  const links = document.querySelectorAll('.fullscreen-menu nav a');

  links.forEach((link) => {
    try {
      SplitType.revert(link);
    } catch {}
    link.classList.remove('animated');

    const split = safeSplit(link, { types: 'words', tagName: 'span' });
    if (!split?.words?.length) {
      link.style.opacity = 1;
      return;
    }

    const words = split.words;
    link.classList.add('animated');

    link.style.willChange = 'transform, opacity';

    gsap.set(words, {
      y: 48,
      opacity: 0,
      ...(SAFARI_LITE ? {} : { scale: 0.94 }),
      willChange: 'transform, opacity',
      force3D: false,
    });

    gsap
      .timeline({
        defaults: { ease: textEase },
        onComplete: () => {
          split.revert();
          clearInline(link, ['will-change', 'opacity', 'transform']);
        },
      })
      .to(words, {
        y: 0,
        opacity: 1,
        ...(SAFARI_LITE ? {} : { scale: 1 }),
        duration: SAFARI_LITE ? 0.7 : 1.0,
        stagger: 0.07,
        clearProps: 'transform,opacity',
      });
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Optional: animate only when visible                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} sections
 * @param {string} rootMargin
 */
export function observeTextSections(sections, rootMargin = '0px 0px -10% 0px') {
  if (!sections) return;
  const arr = Array.from(sections);

  // Fallback for older iOS or in-app webviews
  if (typeof IntersectionObserver === 'undefined') {
    arr.forEach((s) => animateTextInSection(s));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateTextInSection(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin, threshold: 0.15 }
  );

  arr.forEach((s) => io.observe(s));
}
