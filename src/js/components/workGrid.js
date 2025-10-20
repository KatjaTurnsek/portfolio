import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';

// Resolve hrefs against <base href> (or Vite BASE_URL)
function resolveHref(href = '') {
  if (!href) return '#';
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) return href;

  const baseFromTag = document.querySelector('base')?.getAttribute('href') || '/';
  const baseFromVite = (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) || '/';
  const BASE = (baseFromTag || baseFromVite).replace(/\/?$/, '/');

  // Anchor links should jump from the site root (works on static hosts)
  if (href.startsWith('#')) {
    return `${BASE}${href}`;
  }

  // Avoid escaping BASE when given a leading slash
  const clean = href.replace(/^\//, '');
  return BASE + clean;
}

/** Build one Work tile matching your existing .work-item markup. */
function WorkTile(p = {}) {
  const { href, imgSrc, imgAlt = '', title = '', caption = '', aria } = p;
  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a href="${resolveHref(href)}" class="work-link" aria-label="${aria || `View ${title} case study`}">
          <img class="thumb" src="${imgSrc}" alt="${imgAlt}" loading="lazy" />
          <div class="work-overlay"><h4>${title}</h4></div>
        </a>
      </div>
      <span class="mobile-title">${title}</span>
      <p class="work-caption">${caption}</p>
    </div>
  `;
}

function captionOf(p) {
  const tech = p.stack || 'HTML | CSS';
  const desc = p.desc || '';
  return `${tech}<br />${desc}`;
}

/** Render a category list into a mount. */
export function renderCategory(mountSelector, category) {
  const htmlList = projects
    .filter((p) => p.category === category)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) =>
      WorkTile({
        // Prefer hash anchors (caseUrl) — they work on static hosting
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

/** Render a simple “featured” grid into a mount (fallback for single mount). */
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
