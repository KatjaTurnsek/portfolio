/**
 * @file scrollLock.js
 * @description Utilities for releasing scroll locks applied by menus/overlays.
 */

/**
 * Release any scroll locks from menu/overlays by removing known classes and
 * resetting inline styles on <html> and <body>.
 *
 * @returns {void}
 */
export function releaseScrollLock() {
  [document.documentElement, document.body].forEach((el) => {
    el.classList.remove('menu-open', 'no-scroll', 'overflow-hidden', 'locked');
    el.style.overflow = '';
    el.style.overflowY = '';
    el.style.position = '';
    el.style.top = '';
    el.style.width = '';
  });
}
