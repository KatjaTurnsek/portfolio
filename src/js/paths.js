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
 * @param {string} file - File name like "foo.webp" or subpath like "icons/foo.svg"
 * @returns {string} Absolute URL
 */
export const img = (file) =>
  new URL(`${BASE}assets/images/${String(file).replace(/^\/+/, '')}`, window.location.origin).href;

/**
 * Build an absolute PDF URL under the app base.
 * @param {string} file - File name like "doc.pdf"
 * @returns {string} Absolute URL
 */
export const pdf = (file) =>
  new URL(`${BASE}assets/pdf/${String(file).replace(/^\/+/, '')}`, window.location.origin).href;

/**
 * Build a generic absolute asset URL under the app base.
 * @param {string} path - Relative asset path under /assets (e.g. "video/intro.mp4")
 * @returns {string} Absolute URL
 */
export const asset = (path) =>
  new URL(`${BASE}assets/${String(path).replace(/^\/+/, '')}`, window.location.origin).href;
