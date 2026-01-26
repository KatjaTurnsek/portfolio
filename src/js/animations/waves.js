/**
 * @file waves.js
 * @description Heading wave line animations (MorphSVG + polyline tick waves).
 */

import { gsap, isSafari } from './env.js';

/**
 * Animate a single path inside #wavy-line using MorphSVG when available.
 * Graceful fallback uses a subtle Y translation.
 * (Safe no-op if #wavy-line doesn't exist.)
 * @returns {void}
 */
export function animateWaveLine() {
  const path = /** @type {SVGPathElement|null} */ (document.querySelector('#wavy-line path'));
  if (!path) return;

  const ALT_D = 'M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15';
  gsap.killTweensOf(path);

  if (gsap.plugins?.MorphSVGPlugin && !isSafari) {
    gsap.to(path, {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      morphSVG: { shape: ALT_D },
    });
  } else {
    gsap.to(path, { duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', y: 2 });
  }
}

/**
 * Insert minimal wavy-line SVGs after each <h2>.
 * Guards against inserting duplicates.
 * @returns {void}
 */
export function insertWaveLines() {
  const waveSVG = `
    <svg class="wavy-line" viewBox="0 0 500 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <polyline class="wavy-polyline" fill="none" stroke="currentColor" stroke-width="1" />
    </svg>
  `;

  document.querySelectorAll('h2').forEach((heading) => {
    const next = heading.nextElementSibling;
    if (next && next.classList && next.classList.contains('wavy-line')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = waveSVG;
    const svg = wrapper.firstElementChild;
    if (svg) heading.insertAdjacentElement('afterend', svg);
  });
}

/**
 * @typedef {Object} PolylineItem
 * @property {SVGPolylineElement} polyline
 * @property {SVGPoint[]} points
 * @property {number} segments
 * @property {number} amplitude
 * @property {number} frequency
 */

/** @type {PolylineItem[]} */
let _polylineItems = [];
let _polylineTickerAdded = false;

/**
 * Animate all inserted .wavy-polyline elements by mutating their points each tick.
 * Safe to call multiple times.
 * @returns {void}
 */
export function animateCustomWaveLines() {
  const polylines = document.querySelectorAll('.wavy-polyline');

  polylines.forEach((polyline) => {
    if (!(polyline instanceof SVGPolylineElement)) return;
    if (polyline.dataset.waveInit === '1') return;
    polyline.dataset.waveInit = '1';

    const svg = polyline.closest('svg');
    if (!svg) return;

    const width = 500;
    const amplitude = 10;
    const frequency = 2;
    const segments = isSafari ? 50 : 100;
    const interval = width / segments;

    /** @type {SVGPoint[]} */
    const points = [];

    while (polyline.points.numberOfItems > 0) polyline.points.removeItem(0);

    for (let i = 0; i <= segments; i++) {
      // @ts-ignore - SVGSVGElement has createSVGPoint
      const pt = svg.createSVGPoint();
      pt.x = i * interval;
      pt.y = 15;
      points.push(pt);
      polyline.points.appendItem(pt);
    }

    _polylineItems.push({ polyline, points, segments, amplitude, frequency });
  });

  if (!_polylineTickerAdded && _polylineItems.length > 0) {
    _polylineTickerAdded = true;
    gsap.ticker.add(_updateAllPolylines);
  }
}

/**
 * Internal ticker update for polyline waves.
 * @returns {void}
 */
function _updateAllPolylines() {
  const time = performance.now() * 0.002;

  _polylineItems = _polylineItems.filter((item) => item.polyline.isConnected);

  for (const item of _polylineItems) {
    const { polyline, points, segments, amplitude, frequency } = item;
    if (!polyline.points || polyline.points.numberOfItems < segments + 1) continue;

    for (let i = 0; i <= segments; i++) {
      const y = 15 + Math.sin((i / segments) * Math.PI * frequency + time) * -amplitude;
      points[i].y = y;
      polyline.points.getItem(i).y = y;
    }
  }
}
