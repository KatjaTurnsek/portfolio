/**
 * @file render.js
 * @description Minimal templating helpers.
 */

/**
 * Tagged template helper that concatenates literal parts and values.
 * (Does not escape — treat values as already-safe HTML.)
 *
 * @example
 *   const card = html`<div class="card">${body}</div>`;
 *
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export function html(strings, ...values) {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += strings[i] + (values[i] ?? '');
  }
  return out;
}

/**
 * Inject markup into a target element.
 *
 * - Accepts a CSS selector or a DOM node as the target.
 * - Markup may be a string, Node, or DocumentFragment.
 * - By default replaces the contents (fast path for strings via innerHTML).
 *
 * @param {string | Element} target
 * @param {string | Node | DocumentFragment} markup
 * @param {{ mode?: 'replace'|'append'|'prepend' }} [opts]
 * @returns {Element} the target element (for chaining)
 * @throws {Error} if the target cannot be found
 */
export function render(target, markup, opts = {}) {
  /** @type {Element|null} */
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    const sel = typeof target === 'string' ? ` for selector "${target}"` : '';
    throw new Error(`render(): target not found${sel}`);
  }

  const mode = opts.mode ?? 'replace';

  // String fast-path
  if (typeof markup === 'string') {
    if (mode === 'replace') {
      el.innerHTML = markup;
    } else if (mode === 'append') {
      el.insertAdjacentHTML('beforeend', markup);
    } else {
      el.insertAdjacentHTML('afterbegin', markup);
    }
    return el;
  }

  // Node / Fragment path
  if (markup instanceof Node) {
    if (mode === 'replace') {
      el.replaceChildren(markup);
    } else if (mode === 'append') {
      el.append(markup);
    } else {
      el.prepend(markup);
    }
    return el;
  }

  // Fallback: coerce unknown markup to string
  el.innerHTML = String(markup ?? '');
  return el;
}
