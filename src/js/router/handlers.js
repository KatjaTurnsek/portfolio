/**
 * @file handlers.js
 * @description Event handlers (click, popstate, sync).
 */

import { BASE_SLASH, FILE_EXT_RE } from './config.js';
import { normalizePathname, pathToId, idToPath } from './paths.js';
import { render, smartBack } from './navigation.js';

/**
 * Global click handler to route internal links and bypass files.
 * @param {MouseEvent} e
 * @returns {void}
 */
export function onClick(e) {
  const el = e.target instanceof Element ? e.target.closest('a,button') : null;
  if (!el) return;

  // Back buttons
  if (el.hasAttribute('data-back')) {
    e.preventDefault();
    smartBack(el instanceof HTMLAnchorElement ? el.href : '/');
    return;
  }

  // Only handle plain left-clicks on same-tab anchors
  if (!(el instanceof HTMLAnchorElement)) return;
  if (el.target && el.target !== '_self') return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const rawHref = el.getAttribute('href') || '';
  if (!rawHref) return;
  if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

  const isExternalRel = (el.getAttribute('rel') || '').includes('external');
  const isNoRouter = el.classList.contains('no-router') || el.hasAttribute('data-router-ignore');
  const isDownloadAttr = el.hasAttribute('download');
  const looksLikeFileByText = FILE_EXT_RE.test(rawHref);
  if (isExternalRel || isNoRouter || isDownloadAttr || looksLikeFileByText) return;

  let url;
  try {
    url = new URL(rawHref, location.href);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;

  const pathname = url.pathname;
  const path = normalizePathname(pathname);
  const hash = url.hash ? url.hash.slice(1) : null;

  const isUnderAssets = pathname.startsWith(BASE_SLASH + 'assets/');
  const looksLikeFileByPath = FILE_EXT_RE.test(pathname);
  if (isUnderAssets || looksLikeFileByPath) return;

  if (hash && document.getElementById(hash)) {
    e.preventDefault();
    render(idToPath(hash), { replace: false });
    return;
  }

  const id = pathToId(path);
  if (!id) return;

  e.preventDefault();
  render(path);
}

/**
 * Handle native back/forward navigations.
 * @returns {void}
 */
export function onPopState() {
  const path = normalizePathname(location.pathname);
  render(path, { replace: true });
}

/**
 * Ensure UI state matches current route (after BFCache/visibility changes).
 * @returns {void}
 */
export function ensureSectionSync() {
  const current = document.querySelector('.fullscreen-section.visible');

  const hidden =
    !current ||
    getComputedStyle(current).display === 'none' ||
    getComputedStyle(current).visibility === 'hidden' ||
    current.style.opacity === '0';

  if (hidden) {
    const path = normalizePathname(location.pathname);
    requestAnimationFrame(() => render(path, { replace: true }));
  }
}
