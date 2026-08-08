// src/js/components/workGrid.js
import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';
import { BASE } from '../paths.js';

/**
 * @file workGrid.js
 * @description Renders project cards into category and featured grids.
 * Uses <img.thumb data-src> so responsiveImages.js can hydrate it to <picture>.
 */

/* -------------------------------------------------------------------------- */
/* URL + text helpers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Resolve hrefs against the app BASE.
 *
 * - External URLs: returned as-is.
 * - Hash anchors: rooted at BASE (static-host friendly).
 * - Internal paths: normalized under BASE without doubling it.
 *
 * @param {string} [href]
 * @returns {string}
 */
function resolveHref(href = '') {
  if (!href) return '#';

  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) return href;
  if (href.startsWith(BASE)) return href;
  if (href.startsWith('#')) return `${BASE}${href}`;

  const clean = href.replace(/^\.?\//, '');
  return `${BASE}${clean}`;
}

/**
 * Escape a string for safe use as text or inside a quoted HTML attribute.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Turn pipe-separated stack values into a cleaner metadata line.
 * Example: "HTML | CSS | JavaScript" becomes "HTML · CSS · JavaScript".
 *
 * @param {string|string[]} [stack]
 * @returns {string}
 */
function formatStack(stack = 'HTML | CSS') {
  const items = Array.isArray(stack) ? stack : String(stack).split(/\s*[|·]\s*/);

  return items
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(' · ');
}

/* -------------------------------------------------------------------------- */
/* Tile                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Build one work tile matching the existing .work-item markup.
 * Uses data-src so responsiveImages.js can hydrate the image into <picture>.
 *
 * @param {Object} p
 * @param {string} p.href
 * @param {string} p.imgSrc
 * @param {string} [p.imgAlt]
 * @param {string} [p.title]
 * @param {string|string[]} [p.stack]
 * @param {string} [p.description]
 * @param {string} [p.aria]
 * @returns {string} HTML
 */
function WorkTile(p = {}) {
  const { href, imgSrc, imgAlt = '', title = '', stack = 'HTML | CSS', description = '', aria } = p;

  const label = aria || (title ? `View ${title} case study` : 'Open project');
  const descriptionMarkup = description
    ? `<p class="work-description">${escapeHtml(description)}</p>`
    : '';

  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a
          href="${resolveHref(href)}"
          class="work-link"
          aria-label="${escapeHtml(label)}"
        >
          <!-- data-src is replaced by responsiveImages.js -->
          <img
            class="thumb"
            data-src="${escapeHtml(imgSrc)}"
            alt="${escapeHtml(imgAlt)}"
            loading="lazy"
            decoding="async"
          />
          <div class="work-overlay">
            <h4>${escapeHtml(title)}</h4>
          </div>
        </a>
      </div>

      <span class="mobile-title">${escapeHtml(title)}</span>

      <div class="work-caption">
        <p class="work-tech">${escapeHtml(formatStack(stack))}</p>
        ${descriptionMarkup}
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Public renderers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Render a category list into a mount.
 * Safe to call multiple times; it overwrites the mount.
 *
 * @param {string} mountSelector
 * @param {'website'|'design'|'logotype'} category
 * @returns {void}
 */
export function renderCategory(mountSelector, category) {
  const htmlList = projects
    .filter((p) => p.category === category)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        // Prefer hash anchors: they work on static hosting and the router maps them.
        href: p.caseUrl || p.routeUrl || '#',
        imgSrc: p.imgSrc,
        imgAlt: p.imgAlt,
        title: p.title,
        stack: p.stack,
        description: p.desc,
        aria: p.aria,
      })
    )
    .join('');

  render(mountSelector, htmlList);
}

/**
 * Render a simple featured grid into a mount (fallback for a single mount).
 *
 * @param {string} mountSelector
 * @returns {void}
 */
export function renderFeatured(mountSelector) {
  const htmlList = [...featuredProjects]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        href: p.caseUrl || p.routeUrl || '#',
        imgSrc: p.imgSrc,
        imgAlt: p.imgAlt,
        title: p.title,
        stack: p.stack,
        description: p.desc,
        aria: p.aria,
      })
    )
    .join('');

  render(mountSelector, htmlList);
}
