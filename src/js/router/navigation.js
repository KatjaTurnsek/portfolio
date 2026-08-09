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
 * Store the current scroll position before navigating away.
 * @returns {void}
 */
function saveCurrentScrollPosition() {
  const currentState = history.state && typeof history.state === 'object' ? history.state : {};
  const currentPath = normalizePathname(location.pathname);

  history.replaceState(
    {
      ...currentState,
      path: currentPath,
      scrollY: Math.max(0, window.scrollY),
    },
    '',
    location.href
  );
}

/**
 * Restore a saved scroll position after the section becomes visible.
 * @param {number} scrollY
 * @param {number} sequence
 * @returns {void}
 */
function restoreScrollPosition(scrollY, sequence) {
  window.requestAnimationFrame(() => {
    if (sequence !== navigationSequence) return;

    window.scrollTo({
      top: Math.max(0, scrollY),
      behavior: 'auto',
    });
  });
}

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
 * @param {{
 *   replace?: boolean,
 *   focus?: boolean,
 *   scroll?: boolean,
 *   restoreScroll?: number|null
 * }} [options]
 * @returns {boolean} True when the target was handled by the app router.
 */
export function navigate(
  target,
  { replace = false, focus = true, scroll = true, restoreScroll = null } = {}
) {
  const resolved = resolveTarget(target);
  if (!resolved) return false;

  const { id, path } = resolved;
  const section = document.getElementById(id);

  if (!(section instanceof HTMLElement) || !section.classList.contains('fullscreen-section')) {
    return false;
  }

  const sequence = ++navigationSequence;
  const alreadyVisible = isVisibleSection(section) && window.__currentSectionId === id;

  const currentPath = normalizePathname(location.pathname);
  const shouldReplace = replace || (currentPath === path && !location.hash);

  const savedScrollY = Number.isFinite(restoreScroll) ? Math.max(0, Number(restoreScroll)) : null;

  /*
   * Before pushing a new route, save the current page position on
   * the history entry that visitors will return to.
   */
  if (!shouldReplace) {
    saveCurrentScrollPosition();
  }

  closeMenu({ restoreFocus: false });
  window.__currentSectionId = id;

  if (id === 'work') {
    buildWorkGridsIfNeeded();
  }

  if (savedScrollY === null && scroll) {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }

  if (!alreadyVisible) {
    revealSection(id);
  }

  setMetaFromSection(section);
  setActiveLinkById(id);
  window.ScrollTrigger?.refresh?.();

  if (focus) {
    focusSectionHeading(section, sequence);
  }

  if (savedScrollY !== null) {
    restoreScrollPosition(savedScrollY, sequence);
  }

  const state = {
    path,
    scrollY: savedScrollY ?? (scroll ? 0 : Math.max(0, window.scrollY)),
  };

  const url = BASE_SLASH + path.replace(/^\//, '');

  if (shouldReplace) {
    history.replaceState(state, '', url);
  } else {
    history.pushState(state, '', url);
  }

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
