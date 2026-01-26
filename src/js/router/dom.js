/**
 * @file dom.js
 * @description DOM helpers used by the router.
 */

/**
 * Query all matching elements.
 * @param {string} sel
 * @param {ParentNode} [root=document]
 * @returns {Element[]}
 */
export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 * All fullscreen sections.
 * @returns {HTMLElement[]}
 */
export function sections() {
  return /** @type {HTMLElement[]} */ ($$('.fullscreen-section'));
}

/**
 * Remove any inline visibility/layout styles that could conflict with CSS.
 * (Fixes BFCache restores where old inline styles win over class toggles.)
 * @returns {void}
 */
export function purgeInlineSectionStyles() {
  sections().forEach((s) => {
    s.style.removeProperty('display');
    s.style.removeProperty('visibility');
    s.style.removeProperty('pointer-events');
    s.style.removeProperty('transform');
    s.style.removeProperty('opacity');
  });
}

/**
 * Show only the requested section via class toggle (no inline styles).
 * @param {string} id
 * @returns {void}
 */
export function immediateShow(id) {
  purgeInlineSectionStyles();
  sections().forEach((s) => s.classList.toggle('visible', s.id === id));
}
