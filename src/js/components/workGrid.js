import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';

const BASE = (import.meta?.env?.BASE_URL || '/').replace(/\/$/, '');

// Is external?
function isExternal(href = '') {
  return /^(https?:|mailto:|tel:|data:|blob:)/i.test(href);
}

// BASE-aware href resolver
function resolveHref(href = '') {
  if (!href) return '#';
  if (href.startsWith('#')) return href; // in-page
  if (isExternal(href)) return href; // external
  if (href.startsWith('/')) return BASE + href; // absolute → prefix BASE
  return `${BASE}/${href}`; // relative → BASE + /
}

/** Build one Work tile */
function WorkTile(p = {}) {
  const { href, imgSrc, imgAlt = '', title = '', caption = '', aria } = p;
  return `
    <div class="work-item-wrapper">
      <div class="work-item">
        <a href="${resolveHref(href)}"
           class="work-link"
           aria-label="${aria || `View ${title} case study`}">
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

export function renderCategory(mountSelector, category) {
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

export function renderFeatured(mountSelector) {
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
