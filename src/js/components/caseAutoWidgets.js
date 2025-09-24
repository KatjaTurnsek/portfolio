import { projects } from '../../data/projects.js';

const SWITCHER_LABELS = {
  website: 'Web Development',
  design: 'Web & Interaction Design',
  logotype: 'Graphic Design',
};

function siblingVariants(p) {
  const base = p.caseId.replace(/-(design|logotype)$/, '');
  const ids = [base, `${base}-design`, `${base}-logotype`];
  const order = { website: 1, design: 2, logotype: 3 };
  return projects
    .filter((q) => ids.includes(q.caseId) && ['website', 'design', 'logotype'].includes(q.category))
    .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99));
}

function renderDemoLinksAuto(el, p) {
  if (!el) return;
  if (el.dataset.wired === '1' || el.querySelector('a')) return;
  const links = Array.isArray(p.demoLinks) ? p.demoLinks : [];
  if (!links.length) return;

  const frag = document.createDocumentFragment();
  for (const { href, label } of links) {
    const a = document.createElement('a');
    a.className = 'label-link online-demo-label';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="label-text">${label}</span>
      <i class="fa-solid fa-arrow-right arrow-icon" aria-hidden="true"></i>
    `;
    frag.appendChild(a);
  }
  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

function renderProjectSwitcherAuto(el, p) {
  if (!el) return;
  if (el.dataset.wired === '1' || el.querySelector('.pill')) return;

  const sibs = siblingVariants(p);
  const frag = document.createDocumentFragment();

  for (const s of sibs) {
    const a = document.createElement('a');
    a.href = s.routeUrl || s.caseUrl || '#';
    a.className = 'pill';
    a.textContent = SWITCHER_LABELS[s.category] || s.title;
    if (s.caseId === p.caseId) a.setAttribute('aria-current', 'page');
    frag.appendChild(a);
  }

  el.replaceChildren(frag);
  el.dataset.wired = '1';
}

/** Resolve the project for a given case section. */
function deriveProjectForSection(section) {
  const id = section?.id || '';
  if (!id.startsWith('case-')) return undefined;

  let category = 'website';
  if (/-design$/.test(id)) category = 'design';
  else if (/-logotype$/.test(id)) category = 'logotype';

  const baseFromId = id.replace(/^case-/, '').replace(/-(design|logotype)$/, '');
  const base = section.dataset.case || baseFromId;
  const wantedCaseId = category === 'website' ? base : `${base}-${category}`;

  return projects.find((p) => p.caseId === wantedCaseId);
}

/** Public API: hydrate one case section (id starts with "case-"). */
export function hydrateCaseSection(section) {
  const proj = deriveProjectForSection(section);
  if (!proj) return;

  const demoEl = section.querySelector('.demo-links[data-auto="demo"]');
  const switcherEl = section.querySelector('.project-switcher[data-auto="switcher"]');

  renderDemoLinksAuto(demoEl, proj);
  renderProjectSwitcherAuto(switcherEl, proj);
}
