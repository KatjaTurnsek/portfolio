/**
 * @file icons.js
 * @description Demo link SVG sprite icon helpers.
 */

/** Known sprite symbol hrefs for common links (sync with your sprite). */
export const ICONS = {
  arrowRight: '#i-arrow-right',
  arrowUpRight: '#i-arrow-up-right',
  arrowLeft: '#i-arrow-left',
  arrowDown: '#i-arrow-down',
  chevronRight: '#i-chevron-right',
  external: '#i-external',
  github: '#i-github',
  figma: '#i-figma',
  globe: '#i-globe',
};

/**
 * Pick an appropriate icon for a given href.
 * @param {string} href
 * @param {string} [fallback=ICONS.arrowRight]
 * @returns {string} Sprite href like "#i-globe".
 */
export function iconHrefFor(href, fallback = ICONS.arrowRight) {
  try {
    const u = new URL(
      href,
      (typeof window !== 'undefined' && window.location && window.location.href) ||
        'http://localhost'
    );
    const host = u.hostname.toLowerCase();
    if (host.includes('github.')) return ICONS.github;
    if (host.includes('figma.')) return ICONS.figma;
    if (u.protocol === 'http:' || u.protocol === 'https:') return ICONS.globe;
  } catch {
    // hash/mailto/tel or invalid URL → use fallback
  }
  return fallback;
}

/**
 * Return an inline SVG string that references a sprite symbol.
 * (Sprite must be present in the document via {{> sprite}}.)
 * @param {string} spriteHref - e.g. "#i-arrow-right"
 * @param {string} [className="icon icon-18 arrow-icon"]
 * @returns {string} HTML string for <svg>.
 */
export function svgIcon(spriteHref, className = 'icon icon-18 arrow-icon') {
  return `<svg class="${className}" aria-hidden="true"><use href="${spriteHref}"></use></svg>`;
}
