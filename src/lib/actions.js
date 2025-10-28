/**
 * @file actions.js
 * @description Lightweight delegated action bus.
 * Listens for common DOM events and calls handlers from a map keyed by `data-action`.
 *
 * Usage:
 *   setupActions({
 *     'open-case': ({ el, ev, action, args, value, form }) => { ... },
 *     'track':     ({ el, args }) => { /* args from data-action-args='{"id":123}' *\/ },
 *   });
 *
 * Markup:
 *   <a data-action="open-case" data-action-args='{"slug":"portfolio"}'>…</a>
 *   <button data-action="save track">Save</button>  <!-- multiple actions -->
 */

let __actionsBound = false;

/**
 * Install delegated listeners and wire the action handlers.
 * Idempotent: calling multiple times won’t attach duplicate listeners.
 *
 * @param {Record<string, Function>} map - Action -> handler.
 *   Handler receives: { el, ev, action, args, value, form }
 *   - el: the closest element carrying [data-action]
 *   - ev: the original Event
 *   - action: the current action name being invoked
 *   - args: parsed JSON from data-action-args (or string), or undefined
 *   - value: el.value if present (inputs), else undefined
 *   - form: closest <form> (if any), for convenience
 * @returns {void}
 */
export function setupActions(map = {}) {
  if (__actionsBound) return;
  __actionsBound = true;

  const TYPES = ['click', 'submit', 'change', 'input'];

  const parseArgs = (el) => {
    const raw = el.getAttribute('data-action-args') ?? el.getAttribute('data-args');
    if (raw == null || raw === '') return undefined;
    try {
      return typeof raw === 'string' && (raw.trim().startsWith('{') || raw.trim().startsWith('['))
        ? JSON.parse(raw)
        : raw;
    } catch {
      return raw; // fall back to the literal string if JSON fails
    }
  };

  const invoke = (el, ev, action) => {
    const handler = map[action];
    if (typeof handler !== 'function') return;

    // Skip disabled controls
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;

    handler({
      el,
      ev,
      action,
      args: parseArgs(el),
      value: /** @type {any} */ (el).value,
      form: el.closest('form') || null,
    });
  };

  TYPES.forEach((type) => {
    document.addEventListener(
      type,
      (ev) => {
        const target = ev.target;
        if (!(target instanceof Element)) return;

        const el = target.closest('[data-action]');
        if (!el) return;

        // Prevent default on form submissions by default; handlers can submit manually.
        if (type === 'submit') ev.preventDefault();

        // Support multiple actions: data-action="save track"
        const actions = (el.getAttribute('data-action') || '')
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const action of actions) invoke(el, ev, action);
      },
      // Use non-passive because we may call preventDefault() on submit
      { passive: false }
    );
  });

  // Optional: keyboard activation for elements with role="button" but not native buttons
  document.addEventListener(
    'keydown',
    (ev) => {
      const target = ev.target;
      if (!(target instanceof Element)) return;
      const el = target.closest('[data-action][role="button"]:not(button)');
      if (!el) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const actions = (el.getAttribute('data-action') || '')
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const action of actions) invoke(el, ev, action);
      }
    },
    { passive: false }
  );
}
