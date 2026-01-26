/**
 * @file init.js
 * @description Router-friendly section initialization and reveal utilities.
 * Exposes `revealSection` (also assigned to `window.revealSection` for router use).
 * Safari-safe: never transform section containers—animate only inner content.
 */

import gsap from 'gsap';
import { sizeSectionMinHeight } from './utils/sizeSectionMinHeight.js';
export { sizeSectionMinHeight } from './utils/sizeSectionMinHeight.js';

/**
 * Reveal a section by id:
 * - Hides other `.fullscreen-section` elements (no transforms left behind)
 * - Shows the target and animates only its inner content ('.rows' or first child)
 * - Dispatches a `sectionVisible` CustomEvent with `{ detail: targetId }`
 *
 * @param {string} targetId
 * @returns {void}
 */
export function revealSection(targetId) {
  const section = /** @type {HTMLElement|null} */ (document.getElementById(targetId));
  if (!section) return;

  document.querySelectorAll('.fullscreen-section').forEach((s) => {
    if (s === section) return;
    const el = /** @type {HTMLElement} */ (s);
    el.classList.remove('visible');
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
    el.style.transform = 'none';
    el.style.opacity = '0';
    el.style.minHeight = '';
  });

  section.style.display = 'block';
  section.style.visibility = 'visible';
  section.style.pointerEvents = 'auto';
  section.style.transform = 'none';
  section.style.opacity = '1';
  section.classList.add('visible');

  sizeSectionMinHeight(section);

  const content =
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

if (typeof window !== 'undefined') {
  window.revealSection = revealSection;
}

/**
 * Initialize sections when no router is active.
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

/**
 * Toggle a `.scrolled` class on <header> when the page is scrolled.
 * @returns {void}
 */
export function setupHeaderScrollEffect() {
  const header = document.querySelector('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
