/**
 * Update the footer copyright year to the current year.
 * @returns {void}
 */
export function updateCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (!yearEl) return;

  yearEl.textContent = String(new Date().getFullYear());
}
