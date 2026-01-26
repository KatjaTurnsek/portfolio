/**
 * @file demoLinks.js
 * @description Demo links registry + renderer + hydration.
 */

import { iconHrefFor, svgIcon } from './icons.js';

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

  /**
   * @param {string} k
   * @returns {void}
   */
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
