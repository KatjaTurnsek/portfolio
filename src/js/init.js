/**
 * @file init.js
 * @description Router-friendly section initialization and reveal utilities.
 * Exposes `revealSection` (also assigned to `window.revealSection` for router use).
 * Safari-safe: never transform section containers—animate only inner content.
 */

import gsap from 'gsap';

/* ────────────────────────────────────────────────────────────────────────── */
/* Utilities                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Ensure the visible section is tall enough to keep the footer at the bottom.
 * Uses viewport height minus header & footer heights.
 * @param {HTMLElement} section
 * @returns {void}
 */
export function sizeSectionMinHeight(section) {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const vh = window.innerHeight;
  const hH = header?.offsetHeight || 0;
  const fH = footer?.offsetHeight || 0;
  const min = Math.max(0, vh - hH - fH);
  section.style.minHeight = `${min}px`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Reveal logic                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Reveal a section by id:
 * - Hides other `.fullscreen-section` elements (no transforms left behind)
 * - Shows the target and animates only its inner content ('.rows' or first child)
 * - Dispatches a `sectionVisible` CustomEvent with `{ detail: targetId }`
 *
 * Idempotent and router-safe.
 *
 * @param {string} targetId
 * @returns {void}
 */
export function revealSection(targetId) {
  /** @type {HTMLElement|null} */
  const section = document.getElementById(targetId);
  if (!section) return;

  // Hide others
  document.querySelectorAll('.fullscreen-section').forEach((s) => {
    if (s === section) return;
    /** @type {HTMLElement} */ (s).classList.remove('visible');
    /** @type {HTMLElement} */ (s).style.display = 'none';
    /** @type {HTMLElement} */ (s).style.visibility = 'hidden';
    /** @type {HTMLElement} */ (s).style.pointerEvents = 'none';
    /** @type {HTMLElement} */ (s).style.transform = 'none'; // never keep transforms on containers (Safari-safe)
    /** @type {HTMLElement} */ (s).style.opacity = '0';
    /** @type {HTMLElement} */ (s).style.minHeight = ''; // clear any previous sizing
  });

  // Show target container in normal flow (no transform on container)
  section.style.display = 'block';
  section.style.visibility = 'visible';
  section.style.pointerEvents = 'auto';
  section.style.transform = 'none';
  section.style.opacity = '1';
  section.classList.add('visible');

  // Ensure min-height fits viewport minus header/footer
  sizeSectionMinHeight(section);

  // Animate only inner content (safe for Safari layout)
  /** @type {HTMLElement} */
  let content =
    /** @type {HTMLElement|null} */ (section.querySelector('.rows')) ||
    /** @type {HTMLElement|null} */ (section.firstElementChild) ||
    section;

  if (content !== section) {
    content.style.transform = '';
    content.style.opacity = '';
  }

  gsap.fromTo(
    content,
    { opacity: 0, y: 28 },
    {
      duration: 0.5,
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      onStart: () => {
        document.dispatchEvent(new CustomEvent('sectionVisible', { detail: targetId }));
      },
    }
  );
}

/**
 * For router usage: expose `revealSection` on window in browser environments.
 */
if (typeof window !== 'undefined') {
  window.revealSection = revealSection;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Non-router initialization                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Initialize sections when no router is active:
 * - Hides all `.fullscreen-section`
 * - Reveals `#home` by default (if present)
 * No-op when `window.__routerActive` is truthy (router handles reveal).
 *
 * @returns {void}
 */
export function initSections() {
  if (window.__routerActive) return;

  document.querySelectorAll('.fullscreen-section').forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    el.style.display = 'none';
    el.style.opacity = '0';
    el.style.transform = 'none';
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
    el.classList.remove('visible');
    el.style.minHeight = '';
  });

  const home = /** @type {HTMLElement|null} */ (document.getElementById('home'));
  if (home) revealSection('home');
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Header scroll effect                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Toggle a `.scrolled` class on <header> when the page is scrolled.
 * Uses a passive scroll listener and runs once on init.
 *
 * @returns {void}
 */
export function setupHeaderScrollEffect() {
  const header = document.querySelector('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
