/**
 * @file index.js
 * @description App bootstrap: loader orchestration, animations, router-aware section reveals,
 *              Safari fallbacks, menu interactions, per-section effects, and JS UI components mount.
 */

import './router.js';
window.__routerActive = true;

import gsap from 'gsap';
import './toggle.js';
import { hideLoader, showLoader } from './loader.js';
import { setupMenuToggle } from './nav.js';
import { setupResponsiveImages } from './responsiveImages.js';
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  animateGooeyBlobs,
  enableInteractiveJellyBlob,
  animateTopDrippingWaves,
  animateMenuDrippingWaves,
  animateTealBars,
} from './animations.js';
import { initSections, revealSection, setupHeaderScrollEffect } from './init.js';
import { animateTextInSection, animateMenuLinks } from './animatedTexts.js';

/* === Components (reusable UI) =========================================== */
import { render } from '../lib/render.js';
import { setupActions } from '../lib/actions.js';
import { projects, featuredProjects } from '../data/projects.js';

/** True on Safari (excludes Chrome/Android). */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Hide animated wave canvases and show static fallbacks on Safari.
 * @returns {void}
 */
function enableSafariWaveFallback() {
  const topCanvas = document.getElementById('top-waves-canvas');
  if (topCanvas) topCanvas.style.display = 'none';
  const menuCanvas = document.getElementById('menu-waves-canvas');
  if (menuCanvas) menuCanvas.style.display = 'none';
  const topWaves = document.querySelector('.top-waves');
  if (topWaves) topWaves.style.display = 'block';
  const menuWaves = document.querySelector('.menu-waves');
  if (menuWaves) menuWaves.style.display = 'block';
}

/**
 * Apply `will-change` to frequently animated elements (Safari only).
 * @returns {void}
 */
function addSafariWillChange() {
  if (!isSafari) return;
  [
    '.blob-group',
    '.blob',
    '.bar-bg',
    '.bar-1',
    '.bar-2',
    '.bar-3',
    '.bar-label',
    '.wavy-line',
    '.wavy-polyline',
    '#top-waves-canvas',
    '#menu-waves-canvas',
    '.top-waves img',
    '.menu-waves img',
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.willChange = 'transform, opacity';
    });
  });
}

/**
 * Blur→sharp + fade-in sequence for images.
 * @param {HTMLImageElement[]} images
 * @returns {void}
 */
function revealImagesSequentially(images) {
  let delay = 0;
  const fadeIn = (img, onComplete) => {
    gsap.to(img, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      delay,
      ease: 'power2.out',
      onComplete,
    });
    delay += 0.075;
  };
  const loadNext = (i) => {
    if (i >= images.length) return;
    const img = images[i];
    if (img.complete) {
      fadeIn(img, () => loadNext(i + 1));
    } else {
      img.onload = () => fadeIn(img, () => loadNext(i + 1));
      img.onerror = () => loadNext(i + 1);
    }
  };
  loadNext(0);
}

/* === Components: Work tiles (matches your .work-item markup) ============= */

/**
 * Build one Work tile matching your current HTML/CSS.
 * @param {Object} p
 * @param {string} p.href
 * @param {string} p.imgSrc
 * @param {string} [p.imgAlt]
 * @param {string} p.title
 * @param {string} p.caption
 * @param {string} [p.aria]
 * @returns {string} HTML
 */
function WorkTile(p = {}) {
  const { href, imgSrc, imgAlt = '', title = '', caption = '', aria } = p;
  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a href="${href}" class="work-link" aria-label="${aria || `View ${title} case study`}">
          <img class="thumb" src="${imgSrc}" alt="${imgAlt}" loading="lazy" />
          <div class="work-overlay"><h4>${title}</h4></div>
        </a>
      </div>
      <span class="mobile-title">${title}</span>
      <p class="work-caption">${caption}</p>
    </div>
  `;
}

/**
 * Format caption lines like your static HTML.
 * @param {Object} p
 * @param {string} [p.stack]
 * @param {string} [p.desc]
 * @returns {string}
 */
function captionOf(p) {
  const tech = p.stack || 'HTML | CSS';
  const desc = p.desc || '';
  return `${tech}<br />${desc}`;
}

/**
 * Render a category list into a mount.
 * Looks for `routeUrl` (preferred) else `caseUrl`.
 * @param {string} mountSelector
 * @param {"website"|"design"|"logotype"} category
 * @returns {void}
 */
function renderCategory(mountSelector, category) {
  const htmlList = projects
    .filter((p) => p.category === category)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        href: p.routeUrl || p.caseUrl || '#',
        imgSrc: p.imgSrc,
        imgAlt: p.imgAlt,
        title: p.title,
        caption: captionOf(p),
        aria: p.aria,
      })
    )
    .join('');
  render(mountSelector, htmlList);
}

/**
 * Render a simple “featured” grid into a mount (fallback for single mount).
 * @param {string} mountSelector
 * @returns {void}
 */
function renderFeatured(mountSelector) {
  const htmlList = featuredProjects
    .map((p) =>
      WorkTile({
        href: p.routeUrl || p.caseUrl || '#',
        imgSrc: p.imgSrc,
        imgAlt: p.imgAlt,
        title: p.title,
        caption: captionOf(p),
      })
    )
    .join('');
  render(mountSelector, htmlList);
}

/* ===== Auto-widgets for Case sections (demo links + project switcher) ===== */

const SWITCHER_LABELS = {
  website: 'Web Development',
  design: 'Web & Interaction Design',
  logotype: 'Graphic Design',
};

/**
 * Return the 3 sibling variants (website/design/logotype) for a project.
 * @param {any} p
 */
function siblingVariants(p) {
  const base = p.caseId.replace(/-(design|logotype)$/, '');
  const ids = [base, `${base}-design`, `${base}-logotype`];
  const order = { website: 1, design: 2, logotype: 3 };
  return projects
    .filter((q) => ids.includes(q.caseId) && ['website', 'design', 'logotype'].includes(q.category))
    .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99));
}

/**
 * Render demo links into `.demo-links[data-auto="demo"]`, replacing any old nodes.
 * Accepts optional `demoLinks` on the project item. If none, preserves existing markup.
 * @param {HTMLElement} el
 * @param {any} p
 */
function renderDemoLinksAuto(el, p) {
  if (!el) return;
  if (el.dataset.wired === '1' || el.querySelector('a')) return; // already filled
  const links = Array.isArray(p.demoLinks) ? p.demoLinks : [];
  if (!links.length) return;

  const frag = document.createDocumentFragment();
  for (const { href, label } of links) {
    const a = document.createElement('a');
    a.className = 'label-link online-demo-label';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="label-text">${label}</span>
      <i class="fa-solid fa-arrow-right arrow-icon" aria-hidden="true"></i>
    `;
    frag.appendChild(a);
  }
  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

/**
 * Render the 3 “pill” links into `.project-switcher[data-auto="switcher"]`.
 * Replaces once to avoid duplicates (idempotent).
 * @param {HTMLElement} el
 * @param {any} p
 */
function renderProjectSwitcherAuto(el, p) {
  if (!el) return;
  if (el.dataset.wired === '1' || el.querySelector('.pill')) return; // already filled

  const sibs = siblingVariants(p);
  const frag = document.createDocumentFragment();

  for (const s of sibs) {
    const a = document.createElement('a');
    a.href = s.routeUrl || s.caseUrl || '#';
    a.className = 'pill';
    a.textContent = SWITCHER_LABELS[s.category] || s.title;
    if (s.caseId === p.caseId) a.setAttribute('aria-current', 'page');
    frag.appendChild(a);
  }

  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

/**
 * Resolve the project for a given case section.
 * Supports either inferring from the section id (e.g. "case-agilitybandits-design")
 * or using an explicit data-case="agilitybandits" on the section.
 * @param {HTMLElement} section
 * @returns {any|undefined}
 */
function deriveProjectForSection(section) {
  const id = section?.id || '';
  if (!id.startsWith('case-')) return undefined;

  // Derive category from id suffix
  let category = 'website';
  if (/-design$/.test(id)) category = 'design';
  else if (/-logotype$/.test(id)) category = 'logotype';

  // Derive base slug from id, then prefer data-case if provided
  const baseFromId = id.replace(/^case-/, '').replace(/-(design|logotype)$/, '');
  const base = section.dataset.case || baseFromId;

  const wantedCaseId = category === 'website' ? base : `${base}-${category}`;

  return projects.find((p) => p.caseId === wantedCaseId);
}

/**
 * Hydrate one case section (id starts with "case-").
 * @param {HTMLElement} section
 */
function hydrateCaseSection(section) {
  const proj = deriveProjectForSection(section);
  if (!proj) return;

  const demoEl = section.querySelector('.demo-links[data-auto="demo"]');
  const switcherEl = section.querySelector('.project-switcher[data-auto="switcher"]');

  renderDemoLinksAuto(demoEl, proj);
  renderProjectSwitcherAuto(switcherEl, proj);
}

/* ======================================================================== */

document.addEventListener('sectionVisible', (e) => {
  // @ts-ignore
  const { detail: sectionId } = e;
  const section = document.getElementById(sectionId);
  if (!section) return;

  if (sectionId.startsWith('case-')) hydrateCaseSection(section);
  if (sectionId === 'about') animateTealBars();

  animateTextInSection(section);
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

const menu = document.getElementById('menu');
if (menu) {
  const observer = new MutationObserver(() => {
    if (menu.classList.contains('open')) {
      if (!isSafari) animateMenuDrippingWaves();
      animateMenuLinks();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
}

/**
 * Prevent accidental text selection during drag/touch interactions.
 * @returns {void}
 */
function enableNoSelectDuringInteraction() {
  const body = document.body;
  const addNoSelect = () => body.classList.add('no-select');
  const removeNoSelect = () => body.classList.remove('no-select');
  document.addEventListener('mousedown', addNoSelect);
  document.addEventListener('mouseup', removeNoSelect);
  document.addEventListener('touchstart', addNoSelect);
  document.addEventListener('touchend', removeNoSelect);
}

/* Components: action handlers */
setupActions({
  'open-case': ({ el, ev }) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();

    const href = el.getAttribute('href') || el.dataset.href || el.getAttribute('data-href');
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (target.id) revealSection(target.id);
        return;
      }
    }

    const cardTitle = el.closest('.card')?.querySelector('.card__title')?.textContent?.trim();
    if (cardTitle) alert(`Open case study: ${cardTitle}`);
  },
});

document.addEventListener('DOMContentLoaded', () => {
  setupMenuToggle();
  showLoader();

  if (isSafari) {
    gsap.ticker.fps(50);
    enableSafariWaveFallback();
  }

  /* Components: mounts (render only if the element exists) */
  if (document.getElementById('dev-cards')) renderCategory('#dev-cards', 'website');
  if (document.getElementById('design-cards')) renderCategory('#design-cards', 'design');
  if (document.getElementById('logo-cards')) renderCategory('#logo-cards', 'logotype');
  if (document.getElementById('work-cards')) renderFeatured('#work-cards'); // single-mount fallback

  // NOTE: Removed eager "hydrate all case sections" pass to avoid double work.
  // Case sections will hydrate when they become visible via the `sectionVisible` event.

  setTimeout(() => {
    hideLoader();

    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const wavesCanvas = document.getElementById('top-waves-canvas');
    if (wavesCanvas && !isSafari) {
      gsap.fromTo(
        wavesCanvas,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          ease: 'power2.out',
          onStart: animateTopDrippingWaves,
        }
      );
    }

    const blobWrapper = document.querySelector('.morphing-blob-wrapper');
    if (blobWrapper) {
      gsap.fromTo(
        blobWrapper,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.8,
          ease: 'power2.out',
          onStart: () => {
            animateGooeyBlobs();
            enableInteractiveJellyBlob();
          },
        }
      );
    }
  }, 1500);

  const hireBtn = document.getElementById('hireBtn');
  if (hireBtn) {
    hireBtn.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
        revealSection('contact');
      }
    });
  }

  initSections();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();
  addSafariWillChange();
});
