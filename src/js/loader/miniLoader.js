/**
 * @file miniLoader.js
 * @description Tiny 3-dot inline loader used for images (and other small UI cases).
 */

/**
 * Create and mount a mini loader element inside a container.
 * Returns an idempotent `remove()` function that fades it out then removes it.
 *
 * @param {HTMLElement} container
 * @returns {{ el: HTMLDivElement, remove: () => void }}
 */
export function createMiniLoader(container) {
  const el = document.createElement('div');
  el.className = 'simple-mini-loader';

  // Match your existing markup (3 spans)
  el.appendChild(document.createElement('span'));
  el.appendChild(document.createElement('span'));
  el.appendChild(document.createElement('span'));

  container.appendChild(el);

  let removed = false;

  /** @returns {void} */
  const remove = () => {
    if (removed) return;
    removed = true;

    el.classList.add('fade-out');
    window.setTimeout(() => el.remove(), 400);
  };

  return { el, remove };
}
