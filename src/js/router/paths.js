/**
 * @file paths.js
 * @description Path normalization + route ↔ section id mapping.
 */

import { BASE_NO_SLASH, BASE_SLASH, routes, idsToPaths } from './config.js';

/**
 * Normalize a pathname by stripping the site BASE and trailing slash.
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  let p = pathname || '/';
  if (p.startsWith(BASE_SLASH)) p = '/' + p.slice(BASE_SLASH.length);
  else if (p.startsWith(BASE_NO_SLASH)) p = '/' + p.slice(BASE_NO_SLASH.length);
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Map path → section ID, supporting dynamic cases under /work.
 * @param {string} path
 * @returns {string|null}
 */
export function pathToId(path) {
  if (path in routes) return routes[path];

  if (path.startsWith('/work/')) {
    const parts = path.split('/').filter(Boolean); // ["work","slug","sub?"]
    const slug = parts[1];
    const sub = parts[2];
    if (!slug) return null;
    const id = 'case-' + slug + (sub ? '-' + sub : '');
    if (document.getElementById(id)) return id;
  }

  // Allow top-level IDs like "/about", "/contact", "/thank-you"
  const top = path.slice(1);
  if (top && document.getElementById(top)) return top;

  return null;
}

/**
 * Map section ID → canonical path.
 * @param {string} id
 * @returns {string}
 */
export function idToPath(id) {
  if (id in idsToPaths) return idsToPaths[id];

  if (id.startsWith('case-')) {
    const rest = id.slice(5);
    const firstDash = rest.indexOf('-');
    if (firstDash === -1) return '/work/' + rest;
    const slug = rest.slice(0, firstDash);
    const sub = rest.slice(firstDash + 1);
    return '/work/' + slug + '/' + sub;
  }

  return '/';
}
