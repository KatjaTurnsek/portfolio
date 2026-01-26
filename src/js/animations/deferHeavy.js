/**
 * @file deferHeavy.js
 * @description Defers heavy work until idle (or timeout fallback).
 */

/**
 * Defer heavy work until browser is idle (or next tick fallback).
 * @template T
 * @param {() => T|void} cb The callback to run when idle (or timeout).
 * @param {number} [timeout=2000] requestIdleCallback timeout fallback.
 * @returns {() => void} A cancel function; call it to prevent running.
 */
export function deferHeavy(cb, timeout = 2000) {
  let cancelled = false;
  let started = false;

  const start = () => {
    if (!cancelled && !started) {
      started = true;
      cb();
    }
  };

  if ('requestIdleCallback' in window) {
    // @ts-ignore
    const id = window.requestIdleCallback(start, { timeout });
    return () => {
      cancelled = true;
      // @ts-ignore
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id);
    };
  }

  const id = setTimeout(start, 0);
  return () => {
    cancelled = true;
    clearTimeout(id);
  };
}
