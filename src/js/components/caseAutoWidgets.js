import { projects } from '../../data/projects.js';

/**
 * @typedef {Object} Project
 * @property {string} caseId                 // e.g. "portfolio", "portfolio-design"
 * @property {'website'|'design'|'logotype'|'archive'} category
 * @property {string} title
 * @property {string} [routeUrl]             // e.g. "/work/portfolio"
 * @property {string} [caseUrl]              // e.g. "#case-portfolio"
 * @property {{ href:string, label:string }[]} [demoLinks]
 */

const SWITCHER_LABELS = {
  website: 'Web Development',
  design: 'Web & Interaction Design',
  logotype: 'Graphic Design',
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Base + URL helpers                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Resolve app base once (works for "/" or "/portfolio/"). */
const BASE = (() => {
  const fromTag =
    (typeof document !== 'undefined' && document.querySelector('base')?.getAttribute('href')) || '';
  const fromVite = (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) || '/';
  const raw = (fromTag || fromVite || '/').trim();
  return raw.endsWith('/') ? raw : raw + '/';
})();

/** Is an absolute external/special link? */
function isExternal(href = '') {
  return /^(?:https?:|mailto:|tel:|data:|blob:)/i.test(href);
}

/** Looks like a file (pdf, image, video, etc.) */
const FILE_RE = /\.(?:pdf|jpe?g|png|webp|gif|svg|mp4|mov|zip|gz|tgz|7z)(?:[?#]|$)/i;

/** Resolve hrefs so app works from any base (/, /portfolio/, etc.). */
function resolveHref(href = '') {
  if (!href) return '#';
  if (isExternal(href)) return href;

  if (href.startsWith('#')) return `${BASE}${href}`;

  const clean = href.replace(/^\//, '');
  return BASE + clean;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sprite icon helpers                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Choose a sprite symbol based on URL host/protocol.
 * Requires your sprite to define: #i-github, #i-figma, #i-globe, #i-arrow-right
 * @param {string} href
 * @returns {string} sprite symbol href
 */
function pickSpriteFor(href = '') {
  try {
    const u = new URL(href, location.href);
    const host = u.hostname.toLowerCase();

    if (host.includes('github.')) return '#i-github';
    if (host.includes('figma.')) return '#i-figma';
    if (u.protocol === 'http:' || u.protocol === 'https:') return '#i-globe';
  } catch {
    // hashes/mailto/tel or invalid → fallback arrow
  }

  return '#i-arrow-right';
}

/**
 * Return inline SVG referencing a sprite symbol.
 * @param {string} spriteHref
 * @param {string} [className='icon icon-18 arrow-icon']
 * @returns {string}
 */
function svgIcon(spriteHref, className = 'icon icon-18 arrow-icon') {
  return `<svg class="${className}" aria-hidden="true"><use href="${spriteHref}"></use></svg>`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Case id helpers                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Get the real case id from the section id.
 * Example:
 *   case-lumastays          → lumastays
 *   case-lumastays-design   → lumastays-design
 * @param {HTMLElement} section
 * @returns {string}
 */
function getCaseIdFromSection(section) {
  const id = section?.id || '';
  if (!id.startsWith('case-')) return '';

  return id.replace(/^case-/, '');
}

/**
 * Get the base project group from a case id.
 * Example:
 *   lumastays-design → lumastays
 *   studiobid-logotype → studiobid
 * @param {string} caseId
 * @returns {string}
 */
function getBaseCaseId(caseId = '') {
  return caseId.replace(/-(design|logotype)$/, '');
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sibling variant logic                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function siblingVariants(p /** @type {Project} */) {
  const base = getBaseCaseId(p.caseId);
  const ids = [base, `${base}-design`, `${base}-logotype`];
  const order = { website: 1, design: 2, logotype: 3 };

  return projects
    .filter(
      (q) =>
        ids.includes(q.caseId) &&
        (q.category === 'website' || q.category === 'design' || q.category === 'logotype')
    )
    .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Renderers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function renderDemoLinksAuto(el, p /** @type {Project} */) {
  if (!el || el.dataset.wired === '1' || el.querySelector('a')) return;

  const links = Array.isArray(p.demoLinks) ? p.demoLinks : [];
  if (!links.length) return;

  const frag = document.createDocumentFragment();

  for (const { href, label } of links) {
    if (!href || !label) continue;

    const a = document.createElement('a');
    a.className = 'label-link online-demo-label';

    const resolved = resolveHref(href);
    a.href = resolved;

    const blank = isExternal(href) || FILE_RE.test(href);
    if (blank) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    const icon = svgIcon(pickSpriteFor(href), 'icon icon-18 arrow-icon');

    a.innerHTML = `
      <span class="label-text">${label}</span>
      ${icon}
    `;

    frag.appendChild(a);
  }

  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

function updateSwitcherCurrentState(el, currentCaseId = '') {
  if (!el) return;

  const pills = el.querySelectorAll('.pill');

  pills.forEach((pill) => {
    const pillCaseId = pill.dataset.caseId;

    if (pillCaseId === currentCaseId) {
      pill.setAttribute('aria-current', 'page');
    } else {
      pill.removeAttribute('aria-current');
    }
  });
}

function renderProjectSwitcherAuto(el, p /** @type {Project} */, currentCaseId = '') {
  if (!el) return;

  if (el.dataset.wired === '1' || el.querySelector('.pill')) {
    updateSwitcherCurrentState(el, currentCaseId);
    return;
  }

  const sibs = siblingVariants(p);
  const frag = document.createDocumentFragment();

  for (const s of sibs) {
    const a = document.createElement('a');

    const href = s.caseUrl || s.routeUrl || '#';
    a.href = resolveHref(href);

    a.className = 'pill';
    a.dataset.caseId = s.caseId;
    a.textContent = SWITCHER_LABELS[s.category] || s.title || s.caseId;

    if (s.caseId === currentCaseId) {
      a.setAttribute('aria-current', 'page');
    }

    frag.appendChild(a);
  }

  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Derive project from section                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Resolve the project for a given case section.
 * Uses the section id first, because that gives the exact case:
 *   case-lumastays-design → lumastays-design
 *
 * Falls back to data-case only if needed.
 * @param {HTMLElement} section
 * @returns {Project|undefined}
 */
function deriveProjectForSection(section) {
  const exactCaseId = getCaseIdFromSection(section);
  if (!exactCaseId) return undefined;

  const exactMatch = projects.find((p) => p.caseId === exactCaseId);
  if (exactMatch) return /** @type {Project} */ (exactMatch);

  const fallbackCase = section.dataset.case || exactCaseId;
  return /** @type {Project|undefined} */ (projects.find((p) => p.caseId === fallbackCase));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Public API                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Hydrate one case section (id starts with "case-"):
 * - Renders demo links
 * - Renders the cross-category project switcher pills
 * Idempotent (uses data-wired).
 * @param {HTMLElement} section
 * @returns {void}
 */
export function hydrateCaseSection(section) {
  if (!section) return;

  const proj = deriveProjectForSection(section);
  if (!proj) return;

  const currentCaseId = getCaseIdFromSection(section);

  const demoEl = section.querySelector('.demo-links[data-auto="demo"]');
  const switcherEl = section.querySelector('.project-switcher[data-auto="switcher"]');

  renderDemoLinksAuto(demoEl, proj);
  renderProjectSwitcherAuto(switcherEl, proj, currentCaseId);
}
