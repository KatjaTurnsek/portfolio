/**
 * Resolve the app's base path from runtime or build-time sources.
 * - window.__BASE_URL__ is injected in head.hbs
 * - import.meta.env.BASE_URL is set by Vite (base: '/portfolio/')
 */
const RAW_BASE =
  (typeof window !== 'undefined' && window.__BASE_URL__) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) ||
  '/';

/** App base with a guaranteed trailing slash (e.g. "/portfolio/"). */
export const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

/**
 * Build an absolute image URL under the app base.
 * @param {string} file - File name like "foo.webp" or subpath like "icons/foo.svg".
 * @returns {string} Absolute URL.
 */
export const img = (file) =>
  new URL(
    `${BASE}assets/images/${String(file).replace(/^\/+/, '')}`,
    (typeof window !== 'undefined' && window.location.origin) || 'http://localhost'
  ).href;

/**
 * Build an absolute PDF URL under the app base.
 * @param {string} file - File name like "doc.pdf".
 * @returns {string} Absolute URL.
 */
export const pdf = (file) =>
  new URL(
    `${BASE}assets/pdf/${String(file).replace(/^\/+/, '')}`,
    (typeof window !== 'undefined' && window.location.origin) || 'http://localhost'
  ).href;

/**
 * Build a generic absolute asset URL under the app base.
 * @param {string} path - Relative asset path under /assets (e.g. "video/intro.mp4").
 * @returns {string} Absolute URL.
 */
export const asset = (path) =>
  new URL(
    `${BASE}assets/${String(path).replace(/^\/+/, '')}`,
    (typeof window !== 'undefined' && window.location.origin) || 'http://localhost'
  ).href;

/* ────────────────────────────────────────────────────────────────────────── */
/* Demo links: SVG icon generation                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Known sprite symbol hrefs for common links.
 * Keep these in sync with your sprite (<symbol id="…">).
 */
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
 * - github.com → GitHub icon
 * - figma.com  → Figma icon
 * - http(s)    → Globe (treat as “visit site”)
 * - otherwise  → fallback (arrowRight)
 *
 * @param {string} href - Anchor href.
 * @param {string} [fallback=ICONS.arrowRight] - Fallback sprite href.
 * @returns {string} Sprite href like "#i-globe".
 */
export function iconHrefFor(href, fallback = ICONS.arrowRight) {
  try {
    const u = new URL(
      href,
      (typeof window !== 'undefined' && window.location.href) || 'http://localhost'
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
 *
 * @param {string} spriteHref - Symbol href (e.g. "#i-arrow-right").
 * @param {string} [className="icon icon-18 arrow-icon"] - Classes for sizing/styling.
 * @returns {string} HTML string for an <svg> element.
 */
export function svgIcon(spriteHref, className = 'icon icon-18 arrow-icon') {
  return `<svg class="${className}" aria-hidden="true"><use href="${spriteHref}"></use></svg>`;
}

/**
 * @typedef {Object} DemoLink
 * @property {string} label - Visible link text.
 * @property {string} href - Link URL.
 * @property {boolean} [blank=true] - Open in new tab (adds target/_blank rel/noopener).
 * @property {string} [icon] - Explicit sprite href (e.g. "#i-github"). If omitted, auto-picked.
 * @property {string} [className] - Extra classes for the <a>.
 */

/**
 * Render a list of demo links into a container, using SVG sprite icons.
 * Existing contents are replaced.
 *
 * @param {HTMLElement} container - The .demo-links container.
 * @param {DemoLink[]} links - Array of link definitions.
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
      const targetRel = blank ? ` target="_blank" rel="noopener"` : '';
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
 * Keys we support in lookups:
 *  - exact caseId (e.g. "portfolio-design")
 *  - group (e.g. "portfolio")
 *  - "group-category" (e.g. "portfolio-design")
 *  - id without the "case-" prefix (e.g. "portfolio-design")
 */
export const DEMO_LINKS = new Map();

/* ────────────────────────────────────────────────────────────────────────── */
/* Hydration                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Given a .demo-links element, derive candidate keys in priority order.
 * Sources:
 *  1) data-case
 *  2) data-project
 *  3) closest ancestor id like "case-portfolio-design" → "portfolio-design"
 *  4) simplified forms → "portfolio", and stripped of "-design"/"-logotype"/"-website"
 */
function candidateKeysFor(el) {
  const keys = [];

  const fromAttr =
    el.getAttribute('data-case') ||
    el.getAttribute('data-project') ||
    el.getAttribute('data-key') ||
    '';

  if (fromAttr) keys.push(fromAttr);

  // From closest section/article with id starting "case-..."
  const host = el.closest('[id^="case-"]');
  if (host && typeof host.id === 'string') {
    const raw = host.id.replace(/^case-/, ''); // e.g. "portfolio-design"
    if (raw && !keys.includes(raw)) keys.push(raw);
  }

  // For each current key, add simplified fallbacks
  const addSimplified = (k) => {
    if (!k) return;
    const simplified = k.replace(/-(design|logotype|website)$/, ''); // → "portfolio"
    if (simplified && simplified !== k && !keys.includes(simplified)) keys.push(simplified);
  };

  // Build fallbacks for the first few keys gathered
  const snapshot = [...keys];
  snapshot.forEach(addSimplified);

  // Always ensure uniqueness and truthy
  return [...new Set(keys)].filter(Boolean);
}

/**
 * Find all .demo-links[data-auto="demo"] containers (optionally within `root`)
 * and render links using DEMO_LINKS with a robust key search.
 *
 * @param {ParentNode} [root=document] - Scope to search in.
 * @returns {void}
 */
export function hydrateDemoLinks(root = document) {
  root.querySelectorAll('.demo-links[data-auto="demo"]').forEach((el) => {
    // 1) Prefer explicit data-case
    let key = el.getAttribute('data-case') || '';

    // 2) If missing, derive from closest section id="case-…"
    if (!key) {
      const host = el.closest('[id^="case-"]');
      if (host && typeof host.id === 'string') {
        key = host.id.replace(/^case-/, '');
      }
    }

    const links = key ? DEMO_LINKS.get(key) : null;
    if (links && links.length) {
      renderDemoLinks(el, links);
    }
    // else: leave as-is (authoring fallback)
  });
}
