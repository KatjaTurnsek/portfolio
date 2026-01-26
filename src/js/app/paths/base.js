/**
 * @file base.js
 * @description Resolves and exports the app BASE (with trailing slash).
 *
 * Sources:
 * - window.__BASE_URL__ (injected in head.hbs)
 * - import.meta.env.BASE_URL (Vite)
 */

/**
 * Resolve the app's base path from runtime or build-time sources.
 * @type {string}
 */
const RAW_BASE =
  (typeof window !== 'undefined' && window.__BASE_URL__) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) ||
  '/';

/**
 * Ensure a trailing slash and collapse duplicate slashes (path only).
 * @param {string} b
 * @returns {string}
 */
function normalizeBase(b) {
  const withSlash = b.endsWith('/') ? b : b + '/';
  return withSlash.replace(/\/{2,}/g, '/');
}

/** App base with a guaranteed trailing slash (e.g. "/portfolio/"). */
export const BASE = normalizeBase(RAW_BASE);
