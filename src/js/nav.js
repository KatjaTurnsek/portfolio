/**
 * @file nav.js
 * @description Fullscreen menu controls (open/close). Navigation is handled by the router.
 */

import { releaseScrollLock } from './components/scrollLock.js';

/** @type {HTMLButtonElement|null} */
let menuToggle = null;
/** @type {HTMLButtonElement|null} */
let menuClose = null;
/** @type {HTMLElement|null} */
let menu = null;
/** @type {Element|null} */
let lastFocused = null;
/** @type {((e: KeyboardEvent) => void)|null} */
let keyHandler = null;

const focusSelectors =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Get visible, focusable elements inside a container.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusable(container) {
  return /** @type {HTMLElement[]} */ (
    Array.from(container.querySelectorAll(focusSelectors)).filter((el) => {
      const style = window.getComputedStyle(el);
      const rects = el.getClientRects();

      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !!(el.offsetWidth || el.offsetHeight || rects.length)
      );
    })
  );
}

/**
 * Close the menu and release its focus trap and scroll lock.
 * Router navigation disables focus restoration because it moves focus to the new section.
 *
 * @param {{ restoreFocus?: boolean }} [options]
 * @returns {void}
 */
export function closeMenu({ restoreFocus = true } = {}) {
  if (!menu || !menuToggle) return;

  const wasOpen = menu.classList.contains('open');
  if (!wasOpen && !keyHandler) return;

  menu.classList.remove('open');
  menu.setAttribute('inert', '');
  releaseScrollLock();

  menuToggle.style.display = 'inline-block';
  menuToggle.classList.remove('opened');
  menuToggle.setAttribute('aria-expanded', 'false');

  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }

  if (restoreFocus && wasOpen) {
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    else menuToggle.focus();
  }

  lastFocused = null;
}

/**
 * Initialize fullscreen menu toggle behavior.
 * - Adds dialog semantics to the menu container if not present
 * - Locks focus inside the menu while open
 * - Restores focus to the opener on close
 * - Closes on Escape or backdrop click; routed links close it through `navigate()`
 *
 * Requirements in markup:
 * - <button id="menuToggle"> open button
 * - <button id="menuClose"> close button (inside the dialog)
 * - <div id="menu"> dialog container (acts as backdrop), ideally labeled via aria-labelledby
 *
 * @returns {void}
 */
export function setupMenuToggle() {
  menuToggle = /** @type {HTMLButtonElement|null} */ (document.getElementById('menuToggle'));
  menuClose = /** @type {HTMLButtonElement|null} */ (document.getElementById('menuClose'));
  menu = document.getElementById('menu');

  if (!menuToggle || !menuClose || !menu) return;
  if (menu.dataset.menuBound === 'true') return;
  menu.dataset.menuBound = 'true';

  // Ensure dialog semantics on the menu element
  if (!menu.hasAttribute('role')) menu.setAttribute('role', 'dialog');
  if (!menu.hasAttribute('aria-modal')) menu.setAttribute('aria-modal', 'true');

  // Reflect dialog semantics on the opener
  menuToggle.setAttribute('aria-haspopup', 'dialog');
  menuToggle.setAttribute('aria-controls', 'menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  /**
   * Open the menu, trap focus, and set ARIA state.
   * @returns {void}
   */
  function openMenu() {
    lastFocused = document.activeElement;

    menu.classList.add('open');
    menu.removeAttribute('inert'); // inert polyfill friendly

    // Scroll lock (consistent with the rest of the app)
    document.body.classList.add('menu-open');
    document.documentElement.classList.add('no-scroll');

    menuToggle.classList.add('opened');
    menuToggle.style.display = 'none';
    menuToggle.setAttribute('aria-expanded', 'true');

    const focusables = getFocusable(menu);
    (focusables[0] || menuClose || menu).focus();

    keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        const items = getFocusable(menu);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  // Wire up open/close buttons
  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);

  // Click on empty backdrop closes (when the menu container is the backdrop)
  menu.addEventListener('mousedown', (e) => {
    if (e.target === menu) closeMenu();
  });

  // Defensive: if something toggles .open via CSS/JS elsewhere, keep ARIA in sync
  const mo = new MutationObserver(() => {
    const isOpen = menu.classList.contains('open');
    if (!isOpen && keyHandler) {
      closeMenu({ restoreFocus: false });
    }
  });
  mo.observe(menu, { attributes: true, attributeFilter: ['class'] });
}
