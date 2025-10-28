/**
 * @file helpers-assets-and-demos.js
 * @description Asset URL helpers + demo links renderer with SVG sprite icons.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Base + asset helpers                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Resolve the app's base path from runtime or build-time sources.
 * - window.__BASE_URL__ is injected in head.hbs
 * - import.meta.env.BASE_URL is set by Vite (e.g. '/portfolio/')
 */
const RAW_BASE =
  (typeof window !== 'undefined' && window.__BASE_URL__) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) ||
  '/';

/** Ensure a trailing slash and collapse duplicate slashes (path only). */
function normalizeBase(b) {
  const withSlash = b.endsWith('/') ? b : b + '/';
  // collapse '///' → '/' but keep leading single slash
  return withSlash.replace(/\/{2,}/g, '/');
}

/** App base with a guaranteed trailing slash (e.g. "/portfolio/"). */
export const BASE = normalizeBase(RAW_BASE);

/**
 * Build an absolute URL from a path under the same origin.
 * @param {string} path
 * @returns {string}
 */
function abs(path) {
  const origin =
    (typeof window !== 'undefined' && window.location && window.location.origin) ||
    'http://localhost';
  return new URL(path.replace(/^\/+/, '/'), origin).href;
}

/**
 * Build an absolute image URL under the app base.
 * @param {string} file - "foo.webp" or "icons/foo.svg"
 * @returns {string}
 */
export const img = (file) => abs(`${BASE}assets/images/${String(file).replace(/^\/+/, '')}`);

/**
 * Build an absolute PDF URL under the app base.
 * @param {string} file - "doc.pdf"
 * @returns {string}
 */
export const pdf = (file) => abs(`${BASE}assets/pdf/${String(file).replace(/^\/+/, '')}`);

/**
 * Build a generic absolute asset URL under the app base.
 * @param {string} path - e.g. "video/intro.mp4"
 * @returns {string}
 */
export const asset = (path) => abs(`${BASE}assets/${String(path).replace(/^\/+/, '')}`);

/* ────────────────────────────────────────────────────────────────────────── */
/* Demo links: SVG icon generation                                            */
/* ────────────────────────────────────────────────────────────────────────── */

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

/**
 * @typedef {Object} DemoLink
 * @property {string} label - Visible link text.
 * @property {string} href - Link URL.
 * @property {boolean} [blank=true] - Open in new tab.
 * @property {string} [icon] - Explicit sprite href (e.g. "#i-github").
 * @property {string} [className] - Extra classes for the <a>.
 */

/**
 * Render a list of demo links into a container, using SVG sprite icons.
 * Replaces existing contents.
 * @param {HTMLElement} container
 * @param {DemoLink[]} links
 * @returns {void}
 */
export function renderDemoLinks(container, links) {
  if (!container || !Array.isArray(links)) return;
  const html = links
    .map((link) => {
      const blank = link.blank !== false;
      const iconHref = link.icon || iconHrefFor(link.href);
      const icon = svgIcon(iconHref, 'icon icon-18 arrow-icon');
      const extra = link.className ? ` ${link.className}` : '';
      const targetRel = blank ? ` target="_blank" rel="noopener noreferrer"` : '';
      return `
        <a href="${link.href}" class="label-link online-demo-label${extra}"${targetRel}>
          <span class="label-text">${link.label}</span>
          ${icon}
        </a>
      `;
    })
    .join('');
  container.innerHTML = html;
}

/**
 * Simple registry of demo links keyed by identifiers.
 * Keys supported:
 *  - exact caseId (e.g. "portfolio-design")
 *  - group (e.g. "portfolio")
 *  - "group-category" (e.g. "portfolio-design")
 *  - id without the "case-" prefix (e.g. "portfolio-design")
 */
export const DEMO_LINKS = new Map();

/* ────────────────────────────────────────────────────────────────────────── */
/* Hydration                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Derive candidate lookup keys for a .demo-links element in priority order.
 * Sources:
 *  1) data-case / data-project / data-key
 *  2) closest ancestor id="case-…": push "portfolio-design"
 *  3) simplified forms: "portfolio" by stripping "-design/-logotype/-website"
 * @param {HTMLElement} el
 * @returns {string[]} unique, truthy keys
 */
function candidateKeysFor(el) {
  const keys = [];

  const fromAttr =
    el.getAttribute('data-case') ||
    el.getAttribute('data-project') ||
    el.getAttribute('data-key') ||
    '';
  if (fromAttr) keys.push(fromAttr);

  const host = el.closest('[id^="case-"]');
  if (host && typeof host.id === 'string') {
    const raw = host.id.replace(/^case-/, '');
    if (raw && !keys.includes(raw)) keys.push(raw);
  }

  const addSimplified = (k) => {
    if (!k) return;
    const simplified = k.replace(/-(design|logotype|website)$/, '');
    if (simplified && simplified !== k && !keys.includes(simplified)) keys.push(simplified);
  };

  [...keys].forEach(addSimplified);

  return [...new Set(keys)].filter(Boolean);
}

/**
 * Find .demo-links[data-auto="demo"] (optionally within `root`) and render links
 * by searching DEMO_LINKS with derived candidate keys.
 * @param {ParentNode} [root=document]
 * @returns {void}
 */
export function hydrateDemoLinks(root = document) {
  root.querySelectorAll('.demo-links[data-auto="demo"]').forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    const keys = candidateKeysFor(el);
    for (const k of keys) {
      const links = DEMO_LINKS.get(k);
      if (links && links.length) {
        renderDemoLinks(el, links);
        return;
      }
    }
    // No known links → leave authoring fallback content intact
  });
}
