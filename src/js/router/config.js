/**
 * @file config.js
 * @description Router constants + static route maps.
 */

import { BASE } from '../paths.js';

/** Adds/removes this on active nav links. */
export const ACTIVE_CLASS = 'is-active';

/** BASE variants. */
export const BASE_SLASH = BASE; // ends with "/"
export const BASE_NO_SLASH = BASE.replace(/\/$/, ''); // e.g. "/portfolio"

/** File extension detector (simple heuristic). */
export const FILE_EXT_RE = /\.[a-z0-9]{2,8}(\?|#|$)/i;

/** Static mapping for top-level routes. */
/** @type {Record<string,string>} */
export const routes = {
  '/': 'home',
  '/work': 'work',
  '/about': 'about',
  '/contact': 'contact',
};

/** Reverse mapping (section id → path). */
export const idsToPaths = Object.fromEntries(Object.entries(routes).map(([p, id]) => [id, p]));
