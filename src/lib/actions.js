export function setupActions(map = {}) {
  ['click', 'submit', 'change', 'input'].forEach((type) => {
    document.addEventListener(type, (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el) return;
      const action = el.getAttribute('data-action');
      const handler = map[action];
      if (typeof handler === 'function') handler({ el, ev });
    });
  });
}
