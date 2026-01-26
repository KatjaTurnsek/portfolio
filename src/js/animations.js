/**
 * @file animations.js
 * @overview GSAP-powered visuals:
 *  - Heading wavy lines (SVG polyline)
 *  - Teal skill bars animation
 *  - Gooey blobs with “jelly” drag interaction
 *  - A tiny defer helper (idle or setTimeout)
 *
 * Notes:
 * - Browser-only. All functions assume a DOM environment.
 * - This file is now a “barrel” that re-exports smaller modules
 *   (so imports like `from './animations.js'` keep working).
 */

export { animateWaveLine, insertWaveLines, animateCustomWaveLines } from './animations/waves.js';
export { animateTealBars } from './animations/tealBars.js';
export { animateGooeyBlobs, enableInteractiveJellyBlob } from './animations/blobs.js';
export { deferHeavy } from './animations/deferHeavy.js';
