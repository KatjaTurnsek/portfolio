/**
 * @file env.js
 * @description Shared GSAP env + plugin registration for animation modules.
 * Centralizes Safari detection and registers optional GSAP plugins once.
 */

import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * True if current browser is Safari (used for perf fallbacks).
 * @type {boolean}
 */
export const isSafari =
  typeof navigator !== 'undefined'
    ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    : false;

export { gsap };
