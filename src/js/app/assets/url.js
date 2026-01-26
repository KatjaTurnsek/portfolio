/**
 * @file url.js
 * @description Absolute URL builder + asset helpers under BASE.
 */

import { BASE } from '../paths/base.js';

/**
 * Build an absolute URL from a path under the same origin.
 * @param {string} path
 * @returns {string}
 */
export function abs(path) {
  const origin =
    (typeof window !== 'undefined' && window.location && window.location.origin) ||
    'http://localhost';
  return new URL(path.replace(/^\/+/, '/'), origin).href;
}

/**
 * Build an absolute image URL under the app base.
 * @param {string} file - "foo.webp" or "icons/foo.svg"
 * @returns {string}
 */
export const img = (file) => abs(`${BASE}assets/images/${String(file).replace(/^\/+/, '')}`);

/**
 * Build an absolute PDF URL under the app base.
 * @param {string} file - "doc.pdf"
 * @returns {string}
 */
export const pdf = (file) => abs(`${BASE}assets/pdf/${String(file).replace(/^\/+/, '')}`);

/**
 * Build a generic absolute asset URL under the app base.
 * @param {string} path - e.g. "video/intro.mp4"
 * @returns {string}
 */
export const asset = (path) => abs(`${BASE}assets/${String(path).replace(/^\/+/, '')}`);
