export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (values[i] ?? ''), '');
}
export function render(target, markup) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error('Target not found');
  el.innerHTML = markup;
}
