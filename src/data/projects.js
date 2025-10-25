// projects.js
// -----------------------------------------------------------------------------

import { img, pdf, ICONS, DEMO_LINKS } from '../js/paths.js';

/**
 * @typedef {Object} DemoLink
 * @property {string} href      - Link URL (absolute or relative).
 * @property {string} label     - User-visible label.
 * @property {boolean} [blank]  - Open in new tab? (default true in renderer)
 * @property {string}  [icon]   - Sprite href (e.g., "#i-globe"). If omitted, auto-picked.
 */

/**
 * @typedef {Object} Project
 * @property {string} group       - Logical group key (e.g., "petart").
 * @property {string} caseId      - Unique id per project/case (e.g., "agilitybandits").
 * @property {string} title
 * @property {string} stack
 * @property {string} desc
 * @property {string} imgSrc
 * @property {string} imgAlt
 * @property {"website"|"design"|"logotype"} category
 * @property {string} routeUrl
 * @property {string} caseUrl
 * @property {string} [liveUrl]
 * @property {string} [repoUrl]
 * @property {DemoLink[]} demoLinks
 * @property {number} order
 */

/** @type {Project[]} */
export const projects = [
  // WEBSITES
  {
    group: 'petart',
    caseId: 'petart',
    title: 'Pet Art With Heart - Website',
    stack: 'HTML | CSS',
    desc: 'Fast, accessible artist portfolio—semantic HTML, custom CSS, SEO-first.',
    imgSrc: img('site-petart-600.webp'),
    imgAlt: 'Pet Art With Heart website thumbnail',
    category: 'website',
    routeUrl: 'work/petart',
    caseUrl: '#case-petart',
    liveUrl: 'https://pet-art.net',
    demoLinks: [{ href: 'https://pet-art.net', label: 'Visit Live Site', icon: ICONS.globe }],
    order: 10,
  },
  {
    group: 'portfolio',
    caseId: 'portfolio',
    title: 'Katja Dev - Portfolio Website',
    stack: 'HTML | CSS | JavaScript | GSAP',
    desc: 'Animated one-page portfolio—GSAP + Vite, theme switching, responsive',
    imgSrc: img('site-portfolio-600.webp'),
    imgAlt: 'Portfolio website thumbnail',
    category: 'website',
    routeUrl: 'work/portfolio',
    caseUrl: '#case-portfolio',
    liveUrl: 'https://github.com/KatjaTurnsek/portfolio',
    demoLinks: [
      { href: 'https://github.com/KatjaTurnsek/portfolio', label: 'View on GitHub' }, // auto-picks GitHub icon
    ],
    order: 20,
  },
  {
    group: 'agilitybandits',
    caseId: 'agilitybandits',
    title: 'Agility Bandits - Website',
    stack: 'HTML | CSS | JavaScript | API',
    desc: 'Responsive blog—Noroff API, admin auth, accessible UI.',
    imgSrc: img('site-agilitybandits-600.webp'),
    imgAlt: 'Agility Bandits blog website thumbnail',
    category: 'website',
    routeUrl: 'work/agilitybandits',
    caseUrl: '#case-agilitybandits',
    liveUrl: 'https://agilitybandits-centre.netlify.app/',
    demoLinks: [
      {
        href: 'https://agilitybandits-centre.netlify.app/',
        label: 'Visit Live Site',
        icon: ICONS.globe,
      },
    ],
    order: 30,
  },
  {
    group: 'semester',
    caseId: 'semester-project-1',
    title: 'Semester Project 1 — Science Museum',
    stack: 'HTML | CSS',
    desc: 'Museum page, semantic HTML + modern CSS; fast and responsive.',
    imgSrc: img('site-gemenskapet-science-museum-600.webp'),
    imgAlt: 'Gemenskapet Science Museum homepage with interactive exhibits and visitor info',
    category: 'website',
    routeUrl: 'work/semester-project-1',
    caseUrl: '#case-semester-project-1',
    liveUrl: 'https://katjaturnsek.github.io/Semester-project-1',
    repoUrl: 'https://github.com/KatjaTurnsek/Semester-project-1',
    demoLinks: [
      {
        href: 'https://katjaturnsek.github.io/Semester-project-1/index.html',
        label: 'Visit Live Site',
        icon: ICONS.globe,
      },
      { href: 'https://github.com/KatjaTurnsek/Semester-project-1', label: 'GitHub' }, // auto
    ],
    order: 40,
  },

  // DESIGN
  {
    group: 'petart',
    caseId: 'petart-design',
    title: 'Pet Art With Heart - UI Design',
    stack: 'Figma',
    desc: 'Figma mood board - responsive prototype—minimal identity, art-first, clear UX.',
    imgSrc: img('design-petartmoodboard-600.webp'),
    imgAlt: 'Pet Art with Heart design thumbnail',
    category: 'design',
    routeUrl: 'work/petart/design',
    caseUrl: '#case-petart-design',
    demoLinks: [
      { href: 'http://bit.ly/4nB11O4', label: 'Open In Figma (Desktop)' }, // auto-picks Figma via domain
      { href: 'https://bit.ly/4kmoXlq', label: 'Open In Figma (Mobile)' }, // auto-picks Figma
    ],
    order: 110,
  },
  {
    group: 'portfolio',
    caseId: 'portfolio-design',
    title: 'Katja Dev Portfolio - UI Design',
    stack: 'Figma | JavaScript',
    desc: 'Liquid-inspired identity—motion design and UI prototyping for a sleek one-page portfolio.',
    imgSrc: img('design-ktportfolio-600.webp'),
    imgAlt: 'Katja Dev Portfolio website thumbnail',
    category: 'design',
    routeUrl: 'work/portfolio/design',
    caseUrl: '#case-portfolio-design',
    demoLinks: [
      { href: 'https://bit.ly/459Qlxv', label: 'Open In Figma (Desktop)' }, // auto
      { href: 'https://bit.ly/45qWxCv', label: 'Open In Figma (Mobile)' }, // auto
    ],
    order: 120,
  },
  {
    group: 'agilitybandits',
    caseId: 'agilitybandits-design',
    title: 'Agility Bandits - UI Design',
    stack: 'Figma | JavaScript | API',
    desc: 'Agility-themed branding—responsive grid, API-aware layouts; clear and fast.',
    imgSrc: img('design-agilitybandits-600.webp'),
    imgAlt: 'Agility Bandits blog Figma design thumbnail',
    category: 'design',
    routeUrl: 'work/agilitybandits/design',
    caseUrl: '#case-agilitybandits-design',
    demoLinks: [
      { href: 'https://bit.ly/3UWMUp0', label: 'Open In Figma (Desktop)' }, // auto
      { href: 'https://bit.ly/41FuoFo', label: 'Open In Figma (Mobile)' }, // auto
    ],
    order: 130,
  },
  {
    group: 'semester',
    caseId: 'semester-project-1-design',
    title: 'Semester Project 1 - UI Design',
    stack: 'Figma',
    desc: 'Museum identity & UI—yellow/green/blues palette, Avenir type, rounded components',
    imgSrc: img('design-gemenskapet-science-museum-600.webp'),
    imgAlt: 'Gemenskapet Science Museum Figma design thumbnail',
    category: 'design',
    routeUrl: 'work/semester-project-1/design',
    caseUrl: '#case-semester-project-1-design',
    demoLinks: [
      { href: 'https://bit.ly/3KtBYNM', label: 'Open In Figma (Desktop)' }, // auto
      { href: 'https://bit.ly/3Kxpsg9', label: 'Open In Figma (Mobile)' }, // auto
    ],
    order: 140,
  },

  // LOGOTYPES
  {
    group: 'petart',
    caseId: 'petart-logotype',
    title: 'Pet Art With Heart - Logotype',
    stack: 'Sketch | Illustrator',
    desc: 'Hand-drawn pet mark—Illustrator-refined; warm, approachable identity.',
    imgSrc: img('design-petartlogo-600.webp'),
    imgAlt: 'Pet Art with Heart logotype thumbnail',
    category: 'logotype',
    routeUrl: 'work/petart/logotype',
    caseUrl: '#case-petart-logotype',
    demoLinks: [
      { href: pdf('petart-logosuite.pdf'), label: 'Get Design Files (PDF)', icon: ICONS.external },
    ],
    order: 210,
  },
  {
    group: 'portfolio',
    caseId: 'portfolio-logotype',
    title: 'KT Portfolio - Logotype',
    stack: 'Sketch | Illustrator',
    desc: 'KT initials splash mark—fluid, scalable identity for web and print.',
    imgSrc: img('logo-ktportfolio-600.webp'),
    imgAlt: 'Katja Dev logotype thumbnail',
    category: 'logotype',
    routeUrl: 'work/portfolio/logotype',
    caseUrl: '#case-portfolio-logotype',
    demoLinks: [
      {
        href: pdf('portfolio-logosuite.pdf'),
        label: 'Get Design Files (PDF)',
        icon: ICONS.external,
      },
    ],
    order: 220,
  },
  {
    group: 'agilitybandits',
    caseId: 'agilitybandits-logotype',
    title: 'Agility Bandits - Logotype',
    stack: 'Adobe Illustrator',
    desc: 'Character led, motion centric graphics for a dog agility brand.',
    imgSrc: img('logo-agilitybandits-600.webp'),
    imgAlt: 'Agility Bandits graphics thumbnail',
    category: 'logotype',
    routeUrl: 'work/agilitybandits/logotype',
    caseUrl: '#case-agilitybandits-logotype',
    demoLinks: [
      {
        href: pdf('agilitybandits-logosuite.pdf'),
        label: 'Get Design Files (PDF)',
        icon: ICONS.external,
      },
    ],
    order: 230,
  },
  {
    group: 'semester',
    caseId: 'semester-project-1-logotype',
    title: 'Semester Project 1 - Logotype',
    stack: 'Adobe Illustrator',
    desc: 'Science-led, curiosity-driven magnifying-glass logo for a youth science museum.',
    imgSrc: img('logo-gemenskapet-science-museum-600.webp'),
    imgAlt: 'Gemenskapet Science Museum Logotype thumbnail',
    category: 'logotype',
    routeUrl: 'work/semester-project-1/logotype',
    caseUrl: '#case-semester-project-1-logotype',
    demoLinks: [
      {
        href: pdf('sciencemuseum-logosuite.pdf'),
        label: 'Get Design Files (PDF)',
        icon: ICONS.external,
      },
    ],
    order: 240,
  },
];

/**
 * Featured “website” projects, ascending by order.
 * @type {Project[]}
 */
export const featuredProjects = projects
  .filter((p) => p.category === 'website')
  .sort((a, b) => a.order - b.order);

/**
 * All projects, ascending by order.
 * @type {Project[]}
 */
export const allProjectsSorted = [...projects].sort((a, b) => a.order - b.order);

/* ────────────────────────────────────────────────────────────────────────── */
/* Register demo links for the reusable component                             */
/* ────────────────────────────────────────────────────────────────────────── */

// Replace the whole loop with this:
for (const p of projects) {
  if (Array.isArray(p.demoLinks) && p.demoLinks.length) {
    // Use a single, unambiguous key only.
    DEMO_LINKS.set(p.caseId, p.demoLinks);
  }
}
