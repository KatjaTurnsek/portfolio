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
    Array.from(container.querySelectorAll(focusSelectors)).filter((element) => {
      const style = window.getComputedStyle(element);
      const rects = element.getClientRects();

      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        Boolean(element.offsetWidth || element.offsetHeight || rects.length)
      );
    })
  );
}

/**
 * Close the menu and release its focus trap and scroll lock.
 * Router navigation disables focus restoration because it moves focus
 * to the newly opened section.
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

  /*
   * Remove the inline display override instead of setting inline-block.
   * This lets the hamburger return to its original CSS-controlled
   * position after the menu closes.
   */
  menuToggle.style.removeProperty('display');
  menuToggle.classList.remove('opened');
  menuToggle.setAttribute('aria-expanded', 'false');

  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }

  if (restoreFocus && wasOpen) {
    if (lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    } else {
      menuToggle.focus();
    }
  }

  lastFocused = null;
}

/**
 * Initialize fullscreen menu toggle behavior.
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

  // Ensure dialog semantics on the menu.
  if (!menu.hasAttribute('role')) {
    menu.setAttribute('role', 'dialog');
  }

  if (!menu.hasAttribute('aria-modal')) {
    menu.setAttribute('aria-modal', 'true');
  }

  // Reflect dialog semantics on the opener.
  menuToggle.setAttribute('aria-haspopup', 'dialog');
  menuToggle.setAttribute('aria-controls', 'menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  /**
   * Open the menu, trap focus, and update its ARIA state.
   * @returns {void}
   */
  function openMenu() {
    if (!menu || !menuToggle || !menuClose) return;

    lastFocused = document.activeElement;

    menu.classList.add('open');
    menu.removeAttribute('inert');

    document.body.classList.add('menu-open');
    document.documentElement.classList.add('no-scroll');

    menuToggle.classList.add('opened');
    menuToggle.style.display = 'none';
    menuToggle.setAttribute('aria-expanded', 'true');

    // Focus the close button instead of the menu logo.
    menuClose.focus({ preventScroll: true });

    keyHandler = (event) => {
      if (!menu) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = getFocusable(menu);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', keyHandler);
  }

  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);

  // Close when the empty backdrop is clicked.
  menu.addEventListener('mousedown', (event) => {
    if (event.target === menu) {
      closeMenu();
    }
  });

  // Keep state synchronized if another part of the app closes the menu.
  const observer = new MutationObserver(() => {
    if (!menu || !menuToggle) return;

    const isOpen = menu.classList.contains('open');

    if (!isOpen && keyHandler) {
      closeMenu({ restoreFocus: false });
    }
  });

  observer.observe(menu, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
