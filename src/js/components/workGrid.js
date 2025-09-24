import { render } from '../../lib/render.js';
import { projects, featuredProjects } from '../../data/projects.js';

/** Build one Work tile matching your existing .work-item markup. */
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

/** Render a simple “featured” grid into a mount (fallback for single mount). */
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
