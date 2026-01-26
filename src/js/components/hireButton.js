/**
 * @file hireButton.js
 * @description Binds the "Hire me" button to reveal the contact section.
 */

/**
 * Bind click handler for #hireBtn to scroll to #contact and reveal it.
 * Safe to call multiple times.
 *
 * @returns {void}
 */
export function bindHireButton() {
  const hireBtn = document.getElementById('hireBtn');
  if (!hireBtn) return;

  // Avoid double-binding if called more than once
  if (hireBtn.dataset.bound === 'true') return;
  hireBtn.dataset.bound = 'true';

  hireBtn.addEventListener(
    'click',
    () => {
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
        window.revealSection?.('contact');
      }
    },
    { passive: true }
  );
}
