/**
 * @file overlay.js
 * @description Global loader overlay (wave animation).
 * - Creates the loader DOM if missing
 * - Starts the wave animation once per show cycle
 * - Hides with a fade, unlocks scroll, and dispatches `loader:done`
 */

import gsap from 'gsap';

/** @type {gsap.core.Tween[]} */
let waveTweens = [];
let waveStarted = false;

/* ────────────────────────────────────────────────────────────────────────── */
/* Global loader (wave)                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Ensure the loader DOM exists and is appended to <body>.
 * Creates:
 * <div class="loader" role="status" aria-live="polite" aria-busy="true">
 *   <div class="spinner" aria-hidden="true">
 *     <svg viewBox="0 0 500 20"><polyline class="wave-global" /></svg>
 *   </div>
 * </div>
 * @returns {void}
 */
function createLoader() {
  if (document.querySelector('.loader')) return;

  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.setAttribute('aria-busy', 'true');

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 500 20');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '20');

  const poly = document.createElementNS(svgNS, 'polyline');
  poly.setAttribute('points', '');
  poly.setAttribute('class', 'wave-global');
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', 'currentColor');
  poly.setAttribute('stroke-width', '1');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');

  svg.appendChild(poly);
  spinner.appendChild(svg);
  loader.appendChild(spinner);
  document.body.appendChild(loader);
}

/**
 * Start the wave tween on the polyline points (runs once per show cycle).
 * @returns {void}
 */
function animateWave() {
  if (waveStarted) return;

  /** @type {SVGPolylineElement|null} */
  const path = document.querySelector('.wave-global');
  if (!path || !path.points) return;

  const svg = path.ownerSVGElement;
  if (!svg) return;

  waveStarted = true;

  const width = 500;
  const segments = 80;
  const amplitude = 10;
  const frequency = 4;
  const interval = width / segments;

  for (let i = 0; i <= segments; i++) {
    const norm = i / segments;

    // @ts-ignore - SVGSVGElement has createSVGPoint()
    const pt = svg.createSVGPoint();
    pt.x = i * interval;
    pt.y = 10;
    path.points.appendItem(pt);

    const tween = gsap
      .to(pt, {
        y: 10 - amplitude,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      .progress(norm * frequency);

    waveTweens.push(tween);
  }
}

/**
 * Show the global loader and lock page scroll.
 * @returns {void}
 */
export function showLoader() {
  /** @type {HTMLElement|null} */
  let loader = document.querySelector('.loader');
  if (!loader) {
    createLoader();
    loader = /** @type {HTMLElement|null} */ (document.querySelector('.loader'));
  }
  if (!loader) return;

  loader.style.opacity = '1';
  loader.style.display = 'block';
  loader.classList.remove('hidden');

  document.documentElement.classList.add('no-scroll');

  animateWave();
}

/**
 * Hide the global loader with a fade, kill tweens, unlock scroll,
 * remove the DOM node, and emit `loader:done`.
 * @returns {void}
 */
export function hideLoader() {
  /** @type {HTMLElement|null} */
  const loader = document.querySelector('.loader');
  if (!loader) {
    document.dispatchEvent(new CustomEvent('loader:done'));
    return;
  }

  gsap.to(loader, {
    opacity: 0,
    duration: 0.45,
    ease: 'power2.out',
    onComplete: () => {
      waveTweens.forEach((t) => t.kill());
      waveTweens = [];
      waveStarted = false;

      loader.remove();
      document.documentElement.classList.remove('no-scroll');

      document.dispatchEvent(new CustomEvent('loader:done'));
    },
  });
}
