/**
 * @file nav.js
 * @description Fullscreen menu controls (open/close). Navigation is handled by the router.
 */

export function setupMenuToggle() {
  /** @type {HTMLButtonElement|null} */
  const menuToggle = document.getElementById('menuToggle');
  /** @type {HTMLButtonElement|null} */
  const menuClose = document.getElementById('menuClose');
  /** @type {HTMLElement|null} */
  const menu = document.getElementById('menu');

  if (!menuToggle || !menuClose || !menu) return;

  // Ensure the dialog has an accessible name via aria-labelledby in markup.
  // (If you’ve added <h2 id="menu-title"> and aria-labelledby="menu-title" on the dialog, nothing to do here.)

  // Reflect dialog semantics on the opener
  menuToggle.setAttribute('aria-haspopup', 'dialog');
  menuToggle.setAttribute('aria-controls', 'menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  const focusSelectors =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const getFocusable = (container) =>
    Array.from(container.querySelectorAll(focusSelectors)).filter(
      (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
    );

  let lastFocused = null;
  let keyHandler = null;

  function openMenu() {
    lastFocused = document.activeElement;
    menu.classList.add('open');
    menu.removeAttribute('inert');
    document.body.classList.add('menu-open');

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

  function closeMenu() {
    menu.classList.remove('open');
    menu.setAttribute('inert', '');
    document.body.classList.remove('menu-open', 'no-scroll', 'overflow-hidden');

    menuToggle.style.display = 'inline-block';
    menuToggle.classList.remove('opened');
    menuToggle.setAttribute('aria-expanded', 'false');

    (lastFocused || menuToggle).focus();
    lastFocused = null;

    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);

  // Close after internal link clicks; router handles navigation.
  menu.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a') : null;
    if (!a) return;
    setTimeout(closeMenu, 50);
  });

  // Optional: click on empty backdrop closes (if the dialog itself is the backdrop)
  menu.addEventListener('mousedown', (e) => {
    if (e.target === menu) closeMenu();
  });
}
