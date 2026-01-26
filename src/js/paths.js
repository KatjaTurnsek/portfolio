/**
 * @file paths.js
 * @description Facade: re-exports BASE + asset helpers + demo link helpers.
 * Keeps backward compatibility for existing imports across the app.
 */

export { BASE } from './app/paths/base.js';
export { abs, img, pdf, asset } from './app/assets/url.js';

export { ICONS, iconHrefFor, svgIcon } from './app/demos/icons.js';
export { renderDemoLinks, DEMO_LINKS, hydrateDemoLinks } from './app/demos/demoLinks.js';
