// src/js/components/workGrid.js
import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';
import { BASE } from '../paths.js';

/**
 * @file workGrid.js
 * @description Renders project cards into category/featured grids.
 * Uses <img.thumb data-src> so responsiveImages.js can hydrate to <picture>.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* URL + attribute helpers                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Resolve hrefs against the app BASE.
 * - External URLs: returned as-is.
 * - Hash anchors: rooted at the BASE (static-host friendly).
 * - Internal paths: normalized under BASE without doubling it.
 * @param {string} [href]
 * @returns {string}
 */
function resolveHref(href = '') {
  if (!href) return '#';

  // External or special schemes → passthrough
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) return href;

  // Already BASE-prefixed → keep
  if (href.startsWith(BASE)) return href;

  // Hash anchors → root at BASE (e.g. "/portfolio/#case-portfolio")
  if (href.startsWith('#')) return `${BASE}${href}`;

  // Normalize leading "./" or "/" under BASE
  const clean = href.replace(/^\.?\//, '');
  return `${BASE}${clean}`;
}

/**
 * Escape a string for safe use in HTML attribute contexts.
 * @param {string} [s]
 * @returns {string}
 */
function escAttr(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Tile + captions                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Build one Work tile matching your existing .work-item markup.
 * Uses data-src so responsiveImages.js can hydrate into <picture>.
 * @param {Object} p
 * @param {string} p.href
 * @param {string} p.imgSrc
 * @param {string} [p.imgAlt]
 * @param {string} [p.title]
 * @param {string} [p.caption]
 * @param {string} [p.aria]
 * @returns {string} HTML
 */
function WorkTile(p = {}) {
  const { href, imgSrc, imgAlt = '', title = '', caption = '', aria } = p;

  const label = aria || (title ? `View ${title} case study` : 'Open project');

  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a href="${resolveHref(href)}" class="work-link" aria-label="${escAttr(label)}">
          <!-- NOTE: data-src is used; responsiveImages.js replaces with <picture> -->
          <img class="thumb" data-src="${escAttr(imgSrc)}" alt="${escAttr(imgAlt)}" loading="lazy" decoding="async" />
          <div class="work-overlay"><h4>${escAttr(title)}</h4></div>
        </a>
      </div>
      <span class="mobile-title">${escAttr(title)}</span>
      <p class="work-caption">${caption}</p>
    </div>
  `;
}

/**
 * Compose the caption line used under each tile.
 * @param {import('../../data/projects.js').Project} p
 * @returns {string}
 */
function captionOf(p) {
  const tech = p.stack || 'HTML | CSS';
  const desc = p.desc || '';
  return `${tech}<br />${desc}`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public renderers                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Render a category list into a mount.
 * Safe to call multiple times; it overwrites the mount.
 * @param {string} mountSelector
 * @param {"website"|"design"|"logotype"} category
 * @returns {void}
 */
export function renderCategory(mountSelector, category) {
  const htmlList = projects
    .filter((p) => p.category === category)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        // Prefer hash anchors (caseUrl) — they work on static hosting and our router maps them.
        href: p.caseUrl || p.routeUrl || '#',
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
export function renderFeatured(mountSelector) {
  const htmlList = featuredProjects
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        href: p.caseUrl || p.routeUrl || '#',
        imgSrc: p.imgSrc,
        imgAlt: p.imgAlt,
        title: p.title,
        caption: captionOf(p),
      })
    )
    .join('');
  render(mountSelector, htmlList);
}
