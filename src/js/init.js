/**
 * @file init.js
 * @description Router-friendly section initialization and reveal utilities.
 * Exposes `revealSection` (also on `window`). Safari-safe: never transform containers.
 */

import gsap from 'gsap';

/** Ensure visible section is tall enough to push footer to page bottom */
export function sizeSectionMinHeight(section) {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const vh = window.innerHeight;
  const hH = header?.offsetHeight || 0;
  const fH = footer?.offsetHeight || 0;
  const min = Math.max(0, vh - hH - fH);
  section.style.minHeight = `${min}px`;
}

/**
 * Reveal a section:
 * - Hide others (no transforms left behind)
 * - Show target and animate only its inner content ('.rows' or first child)
 * - Dispatch `sectionVisible`
 */
export function revealSection(targetId) {
  const section = document.getElementById(targetId);
  if (!section) return;

  // Hide others
  document.querySelectorAll('.fullscreen-section').forEach((s) => {
    if (s === section) return;
    s.classList.remove('visible');
    s.style.display = 'none';
    s.style.visibility = 'hidden';
    s.style.pointerEvents = 'none';
    s.style.transform = 'none'; // do not keep transforms on containers
    s.style.opacity = '0';
    s.style.minHeight = ''; // clear sizing from previous visibility
  });

  // Show target container in normal flow (no transform animation on container)
  section.style.display = 'block';
  section.style.visibility = 'visible';
  section.style.pointerEvents = 'auto';
  section.style.transform = 'none';
  section.style.opacity = '1';
  section.classList.add('visible');

  // Make it at least viewport - header - footer tall
  sizeSectionMinHeight(section);

  // Animate only inner content (safe for Safari layout)
  const content = section.querySelector('.rows') || section.firstElementChild || section;

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

/** For router usage */
if (typeof window !== 'undefined') window.revealSection = revealSection;

/** Non-router init (no-op if router is active) */
export function initSections() {
  if (window.__routerActive) return;

  const sections = document.querySelectorAll('.fullscreen-section');
  sections.forEach((section) => {
    section.style.display = 'none';
    section.style.opacity = '0';
    section.style.transform = 'none';
    section.style.visibility = 'hidden';
    section.style.pointerEvents = 'none';
    section.classList.remove('visible');
    section.style.minHeight = '';
  });

  const home = document.getElementById('home');
  if (home) revealSection('home');
}

/** Header scroll effect */
export function setupHeaderScrollEffect() {
  const header = document.querySelector('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
