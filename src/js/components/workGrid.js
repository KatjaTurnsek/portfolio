// src/js/components/workGrid.js
import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';
import { BASE } from '../paths.js';

/**
 * Resolve hrefs against the app BASE.
 * - External URLs are returned as-is.
 * - Hash anchors are rooted at the site base (works on static hosts).
 * - Relative/absolute internal paths are normalized under BASE.
 * @param {string} [href]
 * @returns {string}
 */
function resolveHref(href = '') {
  if (!href) return '#';

  // External or special schemes → passthrough
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) return href;

  // In-page section anchors (prefer rooting them at BASE for static hosts)
  if (href.startsWith('#')) return `${BASE}${href.replace(/^#/, '#')}`;

  // Already absolute within this origin but missing BASE → normalize
  if (href.startsWith('/')) {
    const clean = href.replace(/^\//, '');
    return `${BASE}${clean}`;
  }

  // Relative path → join to BASE
  return `${BASE}${href.replace(/^\.?\//, '')}`;
}

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
  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a href="${resolveHref(href)}" class="work-link" aria-label="${aria || `View ${title} case study`}">
          <!-- NOTE: data-src is used; responsiveImages.js replaces with <picture> -->
          <img class="thumb" data-src="${imgSrc}" alt="${imgAlt}" loading="lazy" />
          <div class="work-overlay"><h4>${title}</h4></div>
        </a>
      </div>
      <span class="mobile-title">${title}</span>
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

/**
 * Render a category list into a mount.
 * Safe to call multiple times; it overwrites the mount.
 * @param {string} mountSelector
 * @param {"website"|"design"|"logotype"} category
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
 */
export function renderFeatured(mountSelector) {
  const htmlList = featuredProjects
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
