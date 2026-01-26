/**
 * @file profile.js
 * @description Environment & perf profile for text reveal animations.
 */

/** @type {string} */
const ua = navigator.userAgent;

/** iOS detection (including iPadOS on Mac hardware). */
export const IS_IOS =
  /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Safari detection (excludes Chromium/Firefox/iOS variants). */
export const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg|EdgiOS/.test(ua);

/** Reduced-motion preference. */
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Approximate device strength (threads). */
export const HW_THREADS = navigator.hardwareConcurrency || 4;

/** Allow forcing rich mode globally. */
export const FORCE_RICH =
  document.documentElement.dataset.anim === 'rich' ||
  document.body?.dataset?.anim === 'rich' ||
  /[?&]anim=rich\b/.test(location.search);

/** Devices considered strong enough for richer mobile animations. */
export const RICH_MOBILE = FORCE_RICH || (HW_THREADS >= 4 && !REDUCED);

/** “Lite” only when clearly constrained iOS/Safari. */
export const SAFARI_LITE = (isSafari || IS_IOS) && !RICH_MOBILE;

/** Default easing for text reveals. */
export const textEase = SAFARI_LITE ? 'power1.out' : 'power2.out';

/** Skip selector (e.g., LCP text or flagged elements). */
export const SKIP = ':not([data-no-reveal])';

/** Long paragraph threshold (encourage line splits on capable phones). */
export const LONG_P_THRESHOLD = RICH_MOBILE && !REDUCED ? 999 : window.innerWidth < 480 ? 360 : 560;
