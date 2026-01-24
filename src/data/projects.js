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
    desc: 'Fast, accessible artist portfolio.',
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
    group: 'studiobid',
    caseId: 'studiobid',
    title: 'StudioBid - Auction House App',
    stack: 'JavaScript | Bootstrap | Sass | Noroff API',
    desc: 'Auction app with listings, bids, and profiles.',
    imgSrc: img('site-studiobid-600.webp'),
    imgAlt: 'StudioBid website thumbnail showing profile and bids',
    category: 'website',
    routeUrl: 'work/studiobid',
    caseUrl: '#case-studiobid',
    liveUrl: 'https://katjaturnsek.github.io/semester-project-2',
    repoUrl: 'https://github.com/KatjaTurnsek/semester-project-2',
    demoLinks: [
      {
        href: 'https://katjaturnsek.github.io/semester-project-2',
        label: 'Visit Live Site',
        icon: ICONS.globe,
      },
      { href: 'https://github.com/KatjaTurnsek/semester-project-2', label: 'GitHub' },
    ],
    order: 25,
  },

  {
    group: 'portfolio',
    caseId: 'portfolio',
    title: 'Katja Dev - Portfolio Website',
    stack: 'HTML | CSS | JavaScript | GSAP',
    desc: 'Animated one-page portfolio.',
    imgSrc: img('site-portfolio-600.webp'),
    imgAlt: 'Portfolio website thumbnail',
    category: 'website',
    routeUrl: 'work/portfolio',
    caseUrl: '#case-portfolio',
    liveUrl: 'https://github.com/KatjaTurnsek/portfolio',
    demoLinks: [{ href: 'https://github.com/KatjaTurnsek/portfolio', label: 'View on GitHub' }],
    order: 20,
  },

  {
    group: 'agilitybandits',
    caseId: 'agilitybandits',
    title: 'Agility Bandits - Website',
    stack: 'HTML | CSS | JavaScript | API',
    desc: 'Responsive blog with Noroff API.',
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
    group: 'rainydays',
    caseId: 'rainydays',
    title: 'Rainy Days - E-commerce UI',
    stack: 'HTML | CSS | JavaScript',
    desc: 'Shop UI with product and checkout flow.',
    imgSrc: img('site-rainydays-products-600.webp'),
    imgAlt: 'Rainy Days website thumbnail showing shop and product UI',
    category: 'website',
    routeUrl: 'work/rainydays',
    caseUrl: '#case-rainydays',
    liveUrl: 'https://norofffeu.github.io/html-css-course-assignment-KatjaTurnsek/',
    repoUrl: 'https://github.com/NoroffFEU/html-css-course-assignment-KatjaTurnsek',
    demoLinks: [
      {
        href: 'https://norofffeu.github.io/html-css-course-assignment-KatjaTurnsek/',
        label: 'Visit Live Site',
        icon: ICONS.globe,
      },
      {
        href: 'https://github.com/NoroffFEU/html-css-course-assignment-KatjaTurnsek',
        label: 'GitHub',
      },
    ],
    order: 35,
  },

  {
    group: 'semester',
    caseId: 'semester-project-1',
    title: 'Semester Project 1 - Science Museum',
    stack: 'HTML | CSS',
    desc: 'Responsive museum site.',
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
      { href: 'https://github.com/KatjaTurnsek/Semester-project-1', label: 'GitHub' },
    ],
    order: 40,
  },

  {
    group: 'socialsparks',
    caseId: 'social-sparks',
    title: 'Social Sparks - Social Platform',
    stack: 'JavaScript | Noroff API | Auth',
    desc: 'Social app with profiles and posts.',
    imgSrc: img('site-socialsparks-600.webp'),
    imgAlt: 'Social Sparks thumbnail showing registration and profile UI',
    category: 'website',
    routeUrl: 'work/social-sparks',
    caseUrl: '#case-social-sparks',
    liveUrl: 'https://katjaturnsek.github.io/social-sparks',
    repoUrl: 'https://github.com/KatjaTurnsek/social-sparks',
    demoLinks: [
      {
        href: 'https://katjaturnsek.github.io/social-sparks',
        label: 'Visit Live Site',
        icon: ICONS.globe,
      },
      { href: 'https://github.com/KatjaTurnsek/social-sparks', label: 'GitHub' },
    ],
    order: 45,
  },

  // DESIGN
  {
    group: 'petart',
    caseId: 'petart-design',
    title: 'Pet Art With Heart - UI Design',
    stack: 'Figma',
    desc: 'Art-first responsive prototype.',
    imgSrc: img('design-petartmoodboard-600.webp'),
    imgAlt: 'Pet Art with Heart design thumbnail',
    category: 'design',
    routeUrl: 'work/petart/design',
    caseUrl: '#case-petart-design',
    demoLinks: [
      { href: 'http://bit.ly/4nB11O4', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/4kmoXlq', label: 'Open In Figma (Mobile)' },
    ],
    order: 110,
  },

  {
    group: 'portfolio',
    caseId: 'portfolio-design',
    title: 'Katja Dev Portfolio - UI Design',
    stack: 'Figma | JavaScript',
    desc: 'Liquid-inspired UI and motion.',
    imgSrc: img('design-ktportfolio-600.webp'),
    imgAlt: 'Katja Dev Portfolio website thumbnail',
    category: 'design',
    routeUrl: 'work/portfolio/design',
    caseUrl: '#case-portfolio-design',
    demoLinks: [
      { href: 'https://bit.ly/459Qlxv', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/45qWxCv', label: 'Open In Figma (Mobile)' },
    ],
    order: 120,
  },

  {
    group: 'agilitybandits',
    caseId: 'agilitybandits-design',
    title: 'Agility Bandits - UI Design',
    stack: 'Figma | JavaScript | API',
    desc: 'Responsive design with brand system.',
    imgSrc: img('design-agilitybandits-600.webp'),
    imgAlt: 'Agility Bandits blog Figma design thumbnail',
    category: 'design',
    routeUrl: 'work/agilitybandits/design',
    caseUrl: '#case-agilitybandits-design',
    demoLinks: [
      { href: 'https://bit.ly/3UWMUp0', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/41FuoFo', label: 'Open In Figma (Mobile)' },
    ],
    order: 130,
  },

  {
    group: 'semester',
    caseId: 'semester-project-1-design',
    title: 'Semester Project 1 - UI Design',
    stack: 'Figma',
    desc: 'Playful museum UI system.',
    imgSrc: img('design-gemenskapet-science-museum-600.webp'),
    imgAlt: 'Gemenskapet Science Museum Figma design thumbnail',
    category: 'design',
    routeUrl: 'work/semester-project-1/design',
    caseUrl: '#case-semester-project-1-design',
    demoLinks: [
      { href: 'https://bit.ly/3KtBYNM', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/3Kxpsg9', label: 'Open In Figma (Mobile)' },
    ],
    order: 140,
  },

  {
    group: 'rainydays',
    caseId: 'rainydays-design',
    title: 'Rainy Days - UI Design',
    stack: 'Figma',
    desc: 'E-commerce screens and flow.',
    imgSrc: img('web-rainydays-600.webp'),
    imgAlt: 'Rainy Days Figma design thumbnail showing mobile screens',
    category: 'design',
    routeUrl: 'work/rainydays/design',
    caseUrl: '#case-rainydays-design',
    demoLinks: [
      { href: 'http://bit.ly/4b5wyEa', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/4b0dg2Q', label: 'Open In Figma (Mobile)' },
    ],
    order: 150,
  },

  {
    group: 'studiobid',
    caseId: 'studiobid-design',
    title: 'StudioBid - UI/UX Design',
    stack: 'Figma',
    desc: 'UI kit and core user flows.',
    imgSrc: img('web-studiobid-600.webp'),
    imgAlt: 'StudioBid design thumbnail showing key screens and responsive layout',
    category: 'design',
    routeUrl: 'work/studiobid/design',
    caseUrl: '#case-studiobid-design',
    demoLinks: [
      { href: 'https://bit.ly/4sRhxfv', label: 'Open In Figma (Desktop)' },
      { href: 'https://bit.ly/4bKGKlA', label: 'Open In Figma (Mobile)' },
    ],
    order: 160,
  },

  // LOGOTYPES
  {
    group: 'petart',
    caseId: 'petart-logotype',
    title: 'Pet Art With Heart - Logotype',
    stack: 'Sketch | Illustrator',
    desc: 'Hand-drawn mark refined in Illustrator.',
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
    desc: 'Fluid initials mark for web and print.',
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
    desc: 'Dog-led logo system and graphics.',
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
    desc: 'Magnifying-glass logo for a museum.',
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

  {
    group: 'studiobid',
    caseId: 'studiobid-logotype',
    title: 'StudioBid - Brand & Logotype',
    stack: 'Illustrator | Figma',
    desc: 'Logo system with UI-ready assets.',
    imgSrc: img('design-studiobid-600.webp'),
    imgAlt: 'StudioBid logotype and style guide elements thumbnail',
    category: 'logotype',
    routeUrl: 'work/studiobid/logotype',
    caseUrl: '#case-studiobid-logotype',
    demoLinks: [
      {
        href: pdf('studiobid-logosuite.pdf'),
        label: 'Get Design Files (PDF)',
        icon: ICONS.external,
      },
    ],
    order: 250,
  },

  {
    group: 'heartasylum',
    caseId: 'heartasylum-logotype',
    title: 'Heart Asylum - Logo Suite & Cover Art',
    stack: 'Adobe Illustrator | Photoshop',
    desc: 'Logo suite and single cover art.',
    imgSrc: img('logo-heartasylum-600.webp'),
    imgAlt: 'Heart Asylum logo suite and cover art thumbnail',
    category: 'logotype',
    routeUrl: 'work/heartasylum/logotype',
    caseUrl: '#case-heartasylum-logotype',
    demoLinks: [
      {
        href: pdf('heart-asylum-logosuite.pdf'),
        label: 'Get Design Files (PDF)',
        icon: ICONS.external,
      },
    ],
    order: 260,
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

for (const p of projects) {
  if (Array.isArray(p.demoLinks) && p.demoLinks.length) {
    // Use a single, unambiguous key only.
    DEMO_LINKS.set(p.caseId, p.demoLinks);
  }
}
