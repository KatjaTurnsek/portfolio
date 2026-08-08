/**
 * @file navigation.js
 * @description Single navigation entry point for routes, sections, history, focus, and menu state.
 */

import { BASE_SLASH } from './config.js';
import { idToPath, pathToId, normalizePathname } from './paths.js';
import { setMetaFromSection } from './meta.js';
import { setActiveLinkById } from './activeLink.js';
import { revealSection } from '../init.js';
import { buildWorkGridsIfNeeded } from '../components/workGridMounts.js';
import { closeMenu } from '../nav.js';

let navigationSequence = 0;

/**
 * Resolve a URL, route path, or hash to a section id and canonical route path.
 * @param {string} target
 * @returns {{ id: string, path: string }|null}
 */
function resolveTarget(target) {
  if (!target) return null;

  let url;

  try {
    url = new URL(target, location.href);
  } catch {
    return null;
  }

  if (url.origin !== location.origin) return null;

  const hashId = url.hash ? url.hash.slice(1) : '';
  const hashTarget = hashId ? document.getElementById(hashId) : null;

  if (hashId && !hashTarget?.classList.contains('fullscreen-section')) return null;

  const idFromHash = hashTarget ? hashId : null;
  const normalizedPath = normalizePathname(url.pathname);
  const id = idFromHash || pathToId(normalizedPath);
  if (!id) return null;

  const section = document.getElementById(id);

  if (!section) return null;

  return { id, path: idToPath(id) };
}

/**
 * Check whether a section is already the visible routed section.
 * @param {HTMLElement} section
 * @returns {boolean}
 */
function isVisibleSection(section) {
  const styles = window.getComputedStyle(section);

  return (
    section.classList.contains('visible') &&
    styles.display !== 'none' &&
    styles.visibility !== 'hidden' &&
    section.style.opacity !== '0'
  );
}

/**
 * Move keyboard focus to the first heading after navigation.
 * A sequence guard prevents a delayed focus from an older navigation.
 * @param {HTMLElement} section
 * @param {number} sequence
 * @returns {void}
 */
function focusSectionHeading(section, sequence) {
  const heading = section.querySelector('h1, h2, h3, [role="heading"]');
  if (!(heading instanceof HTMLElement)) return;

  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');

  window.setTimeout(() => {
    if (sequence === navigationSequence) heading.focus();
  }, 50);
}

/**
 * Navigate to an internal URL, route path, or section hash.
 * This is the only function that reveals routed content and updates history.
 *
 * @param {string} target
 * @param {{ replace?: boolean, focus?: boolean, scroll?: boolean }} [options]
 * @returns {boolean} True when the target was handled by the app router.
 */
export function navigate(target, { replace = false, focus = true, scroll = true } = {}) {
  const resolved = resolveTarget(target);
  if (!resolved) return false;

  const { id, path } = resolved;
  const section = document.getElementById(id);
  if (!(section instanceof HTMLElement) || !section.classList.contains('fullscreen-section')) {
    return false;
  }

  const sequence = ++navigationSequence;
  const alreadyVisible = isVisibleSection(section) && window.__currentSectionId === id;

  closeMenu({ restoreFocus: false });
  window.__currentSectionId = id;

  if (id === 'work') buildWorkGridsIfNeeded();
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });

  if (!alreadyVisible) revealSection(id);

  setMetaFromSection(section);
  setActiveLinkById(id);
  window.ScrollTrigger?.refresh?.();

  if (focus) focusSectionHeading(section, sequence);

  const state = { path };
  const url = BASE_SLASH + path.replace(/^\//, '');
  const currentPath = normalizePathname(location.pathname);
  const shouldReplace = replace || (currentPath === path && !location.hash);

  if (shouldReplace) history.replaceState(state, '', url);
  else history.pushState(state, '', url);

  return true;
}

/**
 * Initial render from current URL (path or hash).
 * @param {string} path
 * @param {string|null} hash
 * @returns {void}
 */
export function initialShow(path, hash) {
  const hashTarget = hash ? document.getElementById(hash) : null;
  const target = hashTarget?.classList.contains('fullscreen-section') ? `#${hash}` : path;
  const options = { replace: true, focus: false, scroll: false };

  if (!navigate(target, options)) navigate('/', options);
}

/**
 * Smart back: try history.back(), and if it didn't change, interpret href.
 * @param {string} href
 * @returns {void}
 */
export function smartBack(href) {
  const before = location.href;
  const popOnce = () => window.removeEventListener('popstate', popOnce);
  window.addEventListener('popstate', popOnce, { once: true });
  history.back();

  setTimeout(() => {
    if (location.href === before) {
      if (!navigate(href)) location.assign(href);
    }
  }, 250);
}
