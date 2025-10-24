/**
 * Text reveal animations using GSAP + SplitType:
 * - H1: words (with subtle scale/blur on capable mobiles), else lines
 * - H2–H4: lines (tiny skew/blur on capable mobiles)
 * - P: lines; skip splitting only for truly long paragraphs on weak devices
 * - Fullscreen menu links: words
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

/** Devices considered strong enough for richer mobile animations */
const RICH_MOBILE = HW_THREADS >= 6 && !REDUCED;

/** “Lite” only when clearly constrained iOS/Safari */
const SAFARI_LITE = (isSafari || IS_IOS) && !RICH_MOBILE;

/** Default easing */
const textEase = SAFARI_LITE ? 'power1.out' : 'power2.out';

/** Skip selector (e.g., LCP text) */
const SKIP = ':not([data-no-reveal])';

/** Long paragraph threshold (encourage line splits on capable phones) */
const LONG_P_THRESHOLD = RICH_MOBILE && !REDUCED ? 999 : window.innerWidth < 480 ? 360 : 560;

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

  // Reduced motion: show without anims
  if (REDUCED) {
    section
      .querySelectorAll(`h1${SKIP}, h2${SKIP}, h3${SKIP}, h4${SKIP}, p${SKIP}`)
      .forEach((el) => (el.style.opacity = 1));
    return;
  }

  // ⚠️ Avoid CSS containment during SplitType measuring (breaks iOS line metrics)

  /* H1 — hero headings */
  section.querySelectorAll(`h1${SKIP}`).forEach((heading) => {
    if (!markOnce(heading)) return;

    // Use words on capable mobiles (gives "desktop-like" feel)
    const useWords = RICH_MOBILE || !SAFARI_LITE;
    const types = useWords ? 'words' : 'lines';
    const split = safeSplit(heading, { types, tagName: 'span' });

    const items = useWords ? split?.words : split?.lines;
    if (!split || !items?.length) {
      split?.revert?.();
      heading.style.opacity = 1;
      return;
    }

    gsap.set(heading, { opacity: 1 });
    heading.style.willChange = 'transform, opacity';

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
          clearInline(heading, ['will-change', 'opacity', 'transform', 'filter']);
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
  section.querySelectorAll(`h2${SKIP}, h3${SKIP}, h4${SKIP}`).forEach((el) => {
    if (!markOnce(el)) return;

    const split = safeSplit(el, { types: 'lines', tagName: 'span' });
    if (!split?.lines?.length) {
      split?.revert?.();
      el.style.opacity = 1;
      return;
    }

    const rich = RICH_MOBILE && !REDUCED;
    el.style.willChange = 'transform, opacity';

    gsap.set(split.lines, {
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
      .to(split.lines, {
        yPercent: 0,
        opacity: 1,
        ...(rich ? { skewY: 0, filter: 'blur(0px)' } : {}),
        duration: SAFARI_LITE ? 0.85 : 1.05,
        stagger: 0.085,
        clearProps: 'transform,opacity,filter',
      });
  });

  /* Paragraphs — lines (skip truly long ones on weaker devices) */
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

    const rich = RICH_MOBILE && !REDUCED;
    el.style.willChange = 'transform, opacity';

    gsap.set(split.lines, {
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
      .to(split.lines, {
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Fullscreen menu links                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Animate menu navigation links (`.fullscreen-menu nav a`) word-by-word.
 * Call this each time the menu opens.
 */
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
      ...(RICH_MOBILE && !REDUCED ? { scale: 0.94 } : {}),
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
        ...(RICH_MOBILE && !REDUCED ? { scale: 1 } : {}),
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
 * Observe sections and run `animateTextInSection` when they enter the viewport.
 * Usage:
 *   observeTextSections(document.querySelectorAll('.fullscreen-section'));
 *
 * Includes a fallback for environments without IntersectionObserver.
 *
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} sections
 * @param {string} rootMargin
 */
export function observeTextSections(sections, rootMargin = '0px 0px -10% 0px') {
  if (!sections) return;
  const arr = Array.from(sections);

  // Fallback: animate immediately if IO is unavailable (older iOS / in-app views)
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
