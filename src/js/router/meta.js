/**
 * @file meta.js
 * @description Title/meta/canonical updates based on section data attributes.
 */

import { BASE_SLASH } from './config.js';
import { idToPath } from './paths.js';

/**
 * Update title/meta/canonical from the current section element.
 * Expects data attributes on the section: data-title, data-description.
 * @param {HTMLElement|null} el
 * @returns {void}
 */
export function setMetaFromSection(el) {
  if (!el) return;

  const title = el.getAttribute('data-title');
  if (title) document.title = title;

  const desc = el.getAttribute('data-description');
  const meta = document.querySelector('meta[name="description"]');
  if (desc && meta) meta.setAttribute('content', desc);

  // Canonical (absolute) = origin + BASE + path (no leading slash)
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const path = idToPath(el.id).replace(/^\//, '');
    canonical.setAttribute('href', location.origin + BASE_SLASH + path);
  }
}
