/**
 * @file nav.js
 * @description Fullscreen menu controls (open/close). Navigation is handled by the router.
 */

/**
 * Wires up the fullscreen menu toggle, Escape-to-close, and auto-close on link click.
 * @returns {void}
 */
export function setupMenuToggle() {
  try {
    /** @type {HTMLButtonElement|null} */
    const menuToggle = document.getElementById('menuToggle');
    /** @type {HTMLButtonElement|null} */
    const menuClose = document.getElementById('menuClose');
    /** @type {HTMLElement|null} */
    const menu = document.getElementById('menu');

    if (!menuToggle || !menuClose || !menu) return;

    /** Opens the menu and focuses the close button. */
    function openMenu() {
      menu.classList.add('open');
      menu.removeAttribute('inert');
      menuToggle.classList.add('opened');
      menuToggle.style.display = 'none';
      menuClose.focus();
      document.body.classList.add('menu-open');
    }

    /** Closes the menu and returns focus to the toggle button. */
    function closeMenu() {
      menu.classList.remove('open');
      menu.setAttribute('inert', '');
      menuToggle.style.display = 'inline-block';
      menuToggle.classList.remove('opened');
      menuToggle.focus();
      document.body.classList.remove('menu-open', 'no-scroll', 'overflow-hidden');
    }

    menuToggle.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });

    // Close menu after any internal link is clicked; router performs navigation.
    menu.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      if (!a) return;
      setTimeout(closeMenu, 50);
    });
  } catch (err) {
    console.error('Menu setup failed:', err);
  }
}
