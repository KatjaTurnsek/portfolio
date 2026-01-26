/**
 * @file nav.js
 * @description Fullscreen menu controls (open/close). Navigation is handled by the router.
 */

import { releaseScrollLock } from './components/scrollLock.js';

/**
 * Initialize fullscreen menu toggle behavior.
 * - Adds dialog semantics to the menu container if not present
 * - Locks focus inside the menu while open
 * - Restores focus to the opener on close
 * - Closes on Escape, backdrop click, or internal link click
 *
 * Requirements in markup:
 * - <button id="menuToggle"> open button
 * - <button id="menuClose"> close button (inside the dialog)
 * - <div id="menu"> dialog container (acts as backdrop), ideally labeled via aria-labelledby
 *
 * @returns {void}
 */
export function setupMenuToggle() {
  /** @type {HTMLButtonElement|null} */
  const menuToggle = document.getElementById('menuToggle');
  /** @type {HTMLButtonElement|null} */
  const menuClose = document.getElementById('menuClose');
  /** @type {HTMLElement|null} */
  const menu = document.getElementById('menu');

  if (!menuToggle || !menuClose || !menu) return;

  // Ensure dialog semantics on the menu element
  if (!menu.hasAttribute('role')) menu.setAttribute('role', 'dialog');
  if (!menu.hasAttribute('aria-modal')) menu.setAttribute('aria-modal', 'true');

  // Reflect dialog semantics on the opener
  menuToggle.setAttribute('aria-haspopup', 'dialog');
  menuToggle.setAttribute('aria-controls', 'menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  // Focusable selector and helpers
  const focusSelectors =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /**
   * Get visible, focusable elements inside a container.
   * @param {HTMLElement} container
   * @returns {HTMLElement[]}
   */
  const getFocusable = (container) =>
    Array.from(container.querySelectorAll(focusSelectors)).filter((el) => {
      const style = window.getComputedStyle(el);
      const rects = el.getClientRects();
      return (
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !!(el.offsetWidth || el.offsetHeight || rects.length)
      );
    });

  /** @type {Element|null} */
  let lastFocused = null;

  /** @type {(e:KeyboardEvent)=>void | null} */
  let keyHandler = null;

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

  /**
   * Close the menu, release focus trap, restore focus and ARIA state.
   * @returns {void}
   */
  function closeMenu() {
    menu.classList.remove('open');
    menu.setAttribute('inert', '');

    // Single source of truth for unlocking scroll/classes/styles
    releaseScrollLock();

    menuToggle.style.display = 'inline-block';
    menuToggle.classList.remove('opened');
    menuToggle.setAttribute('aria-expanded', 'false');

    if (lastFocused && lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    } else {
      menuToggle.focus();
    }
    lastFocused = null;

    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  // Wire up open/close buttons
  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);

  // Close after internal link clicks; router handles navigation
  menu.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a') : null;
    if (!a) return;
    setTimeout(closeMenu, 50);
  });

  // Click on empty backdrop closes (when the menu container is the backdrop)
  menu.addEventListener('mousedown', (e) => {
    if (e.target === menu) closeMenu();
  });

  // Defensive: if something toggles .open via CSS/JS elsewhere, keep ARIA in sync
  const mo = new MutationObserver(() => {
    const isOpen = menu.classList.contains('open');
    if (!isOpen && keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;

      menuToggle.setAttribute('aria-expanded', 'false');
      if (menuToggle.style.display === 'none') menuToggle.style.display = 'inline-block';

      // Ensure scroll lock is released if closed externally
      releaseScrollLock();
    }
  });
  mo.observe(menu, { attributes: true, attributeFilter: ['class'] });
}
