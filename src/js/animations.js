/**
 * animations.js
 *
 * All GSAP-powered animations:
 *  - Morphing & custom wavy header lines
 *  - Teal skill bars (About)
 *  - Gooey blobs + “jelly” drag
 *  - Dripping waves on top/menu canvases (with cleanup)
 *  - Helpers to defer heavy work until after LCP
 */

import { gsap } from 'gsap';
import { MorphSVGPlugin } from '../../node_modules/gsap/MorphSVGPlugin.js';
import { ScrollTrigger } from '../../node_modules/gsap/ScrollTrigger.js';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/** True if current browser is Safari (used for fallbacks/perf tweaks). */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Ensure the hero wave <svg> exists and return its <path>.
 * Inserted into `.top-waves` (falls back to <body>).
 * @returns {SVGPathElement|null}
 */
function ensureHeroWave() {
  const ORIGINAL_D = 'M0,15 C50,5 100,25 150,15 S250,25 300,15 S400,5 500,15';
  const host = document.querySelector('.top-waves') || document.body;
  if (!host) return null;

  /** @type {SVGSVGElement|null} */
  let svg = document.getElementById('wavy-line');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'wavy-line');
    svg.setAttribute('viewBox', '0 0 500 30');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('wavy-line-hero');

    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', ORIGINAL_D);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
    host.appendChild(svg);
  }

  return /** @type {SVGPathElement|null} */ (svg.querySelector('path'));
}

/**
 * Morph the hero wave path in a loop. Falls back to a simple bob if MorphSVG is unavailable.
 * @returns {void}
 */
export function animateWaveLine() {
  const ALT_D = 'M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15';
  const path = ensureHeroWave();
  if (!path) return;

  gsap.killTweensOf(path);

  if (gsap.plugins?.MorphSVGPlugin) {
    gsap.to(path, {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      morphSVG: { shape: ALT_D },
    });
  } else {
    gsap.to(path, {
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      y: 2,
    });
  }
}

/**
 * Insert an inline SVG “wavy line” right after each <h2>.
 * @returns {void}
 */
export function insertWaveLines() {
  const waveSVG = `
    <svg class="wavy-line" viewBox="0 0 500 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <polyline class="wavy-polyline" fill="none" stroke="currentColor" stroke-width="1" />
    </svg>
  `;
  document.querySelectorAll('h2').forEach((heading) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = waveSVG;
    heading.insertAdjacentElement('afterend', wrapper.firstElementChild);
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ONE shared ticker for all `.wavy-polyline` elements                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** @typedef {{ polyline: SVGPolylineElement, points: SVGPoint[], segments: number, amplitude: number, frequency: number }} PolyItem */

let _polylineItems /** @type {PolyItem[]} */ = [];
let _polylineTickerAdded = false;

/**
 * Build and animate polyline points to create subtle, continuous wave motion
 * for every `.wavy-polyline` inserted by {@link insertWaveLines}.
 * Uses ONE shared GSAP ticker for all polylines (perf!).
 * @returns {void}
 */
export function animateCustomWaveLines() {
  const polylines = document.querySelectorAll('.wavy-polyline');

  polylines.forEach((polyline) => {
    if (polyline instanceof SVGPolylineElement === false) return;
    if (polyline.dataset.waveInit === '1') return; // prevent double-wiring
    polyline.dataset.waveInit = '1';

    const svg = polyline.closest('svg');
    const width = 500;
    const amplitude = 10;
    const frequency = 2;
    const segments = isSafari ? 50 : 100;
    const interval = width / segments;

    /** @type {SVGPoint[]} */
    const points = [];

    for (let i = 0; i <= segments; i++) {
      // @ts-ignore - createSVGPoint exists on SVGSVGElement
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

function _updateAllPolylines() {
  const time = performance.now() * 0.002;
  for (const item of _polylineItems) {
    const { polyline, points, segments, amplitude, frequency } = item;
    for (let i = 0; i <= segments; i++) {
      const y = 15 + Math.sin((i / segments) * Math.PI * frequency + time) * -amplitude;
      points[i].y = y;
      polyline.points.getItem(i).y = y;
    }
  }
}

/**
 * Animate teal bars in About section.
 * @returns {void}
 */
export function animateTealBars() {
  const timeline = gsap.timeline();

  timeline.to('.bar-bg', {
    width: '100%',
    duration: 1.5,
    stagger: 1,
    ease: 'power4.out',
  });

  timeline.to('.bar-1', { width: '90%', duration: 1, ease: 'power4.out' }, '<+0.5');
  timeline.to('.bar-2', { width: '70%', duration: 1, ease: 'power4.out' }, '-=0.6');
  timeline.to('.bar-3', { width: '80%', duration: 1, ease: 'power4.out' }, '-=0.6');

  timeline.to(
    '.bar-label',
    { opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.2 },
    '-=0.4'
  );
}

/**
 * Create multiple SVG blob groups and animate slow floating/scale motion.
 * If Safari is detected, removes the SVG filter for performance.
 * Also links opacity to scroll via ScrollTrigger (parallax-like effect).
 * Requires:
 *  - #blob-svg > #blobs-g container
 *  - CSS: .blob-group, .blob
 * @returns {void}
 */
export function animateGooeyBlobs() {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const mobile = VW < 768;
  const svgns = 'http://www.w3.org/2000/svg';
  const container = document.getElementById('blobs-g');
  if (!container) return;

  const blobCount = 30;
  const spread = mobile ? 400 : 700;
  const motionDistance = mobile ? 120 : 400;

  const centers = [
    { x: VW * 0.3, y: VH * 0.5 },
    { x: VW * 0.7, y: VH * 0.5 },
  ];

  if (isSafari) container.removeAttribute('filter');

  for (let i = 1; i <= blobCount; i++) {
    const center = centers[i % 2];
    const x = center.x + Math.random() * spread - spread / 2;
    const y = center.y + Math.random() * spread - spread / 2;
    const size = Math.floor(Math.random() * 50) + 80;

    const group = document.createElementNS(svgns, 'g');
    group.setAttribute('class', 'blob-group');
    group.setAttribute('id', `blob-group-${i}`);
    group.setAttribute('transform', `translate(${x},${y})`);
    container.appendChild(group);

    const circle = document.createElementNS(svgns, 'circle');
    circle.setAttribute('class', 'blob');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(size));
    group.appendChild(circle);

    const pos = { x, y, rotation: 0 };
    gsap.to(pos, {
      duration: 12 + Math.random() * 4,
      x: x + Math.random() * motionDistance - motionDistance / 2,
      y: y + Math.random() * motionDistance - motionDistance / 2,
      rotation: Math.random() > 0.5 ? '+=180' : '-=180',
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        group.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${pos.rotation})`);
      },
    });

    gsap.to(circle, {
      scaleX: 'random(0.9, 1.1)',
      scaleY: 'random(0.9, 1.1)',
      duration: 'random(2, 4)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  gsap.to(container, {
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/**
 * Enable “closest blob follows pointer while dragging” jelly interaction.
 * Requires #blob-svg and generated .blob-group nodes.
 * @returns {void}
 */
export function enableInteractiveJellyBlob() {
  const svg = document.getElementById('blob-svg');
  if (!svg) return;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let activeBlob = null;
  let isDragging = false;
  const originalTransforms = new Map();
  let lastSwitchTime = 0;

  const getScale = (dx, dy) => Math.min(Math.sqrt(dx * dx + dy * dy) / 500, isSafari ? 0.18 : 0.25);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

  function getSVGCoords(clientX, clientY) {
    // @ts-ignore
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    // @ts-ignore
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function getClosestBlob(x, y) {
    const blobs = document.querySelectorAll('.blob-group');
    let closest = null;
    let minDist = Infinity;

    blobs.forEach((blob) => {
      const matrix = blob.getScreenCTM();
      if (!matrix) return;
      const cx = matrix.e;
      const cy = matrix.f;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < minDist) {
        minDist = dist;
        closest = blob;
      }
    });

    return closest;
  }

  function returnBlobToOriginal(blob) {
    const original = originalTransforms.get(blob);
    if (!original) return;
    gsap.to(blob, {
      x: original.x,
      y: Math.max(original.y, 400),
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.8,
      ease: 'power2.out',
    });
  }

  function updatePointer(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const svgPos = getSVGCoords(clientX, clientY);

    target.x = svgPos.x;
    target.y = svgPos.y;

    const now = Date.now();
    if (now - lastSwitchTime < 200) return;

    const closestBlob = getClosestBlob(clientX, clientY);

    if (closestBlob && closestBlob !== activeBlob) {
      const newMatrix = closestBlob.getScreenCTM();
      const oldMatrix = activeBlob?.getScreenCTM();

      const newDist = Math.hypot(newMatrix.e - clientX, newMatrix.f - clientY);
      const oldDist = oldMatrix
        ? Math.hypot(oldMatrix.e - clientX, oldMatrix.f - clientY)
        : Infinity;

      if (newDist >= oldDist - 15) return;

      if (activeBlob) returnBlobToOriginal(activeBlob);
      activeBlob = closestBlob;
      lastSwitchTime = now;

      if (!originalTransforms.has(activeBlob)) {
        const transform = gsap.getProperty(activeBlob);
        originalTransforms.set(activeBlob, {
          x: transform('x'),
          y: transform('y'),
          rotation: transform('rotation'),
          scaleX: transform('scaleX'),
          scaleY: transform('scaleY'),
        });
      }

      gsap.killTweensOf(activeBlob);
    }
  }

  let lastUpdate = 0;
  function loop() {
    requestAnimationFrame(loop);
    const now = Date.now();
    if (!isDragging || !activeBlob || now - lastUpdate < 16) return;
    lastUpdate = now;

    vel.x = target.x - current.x;
    vel.y = target.y - current.y;

    current.x += vel.x * 0.2;
    current.y += vel.y * 0.2;

    const angle = getAngle(vel.x, vel.y);
    const scale = getScale(vel.x, vel.y);

    gsap.set(activeBlob, {
      x: current.x,
      y: current.y,
      rotation: isSafari ? angle : angle + '_short',
      scaleX: 1 + (isSafari ? scale * 0.7 : scale),
      scaleY: 1 - (isSafari ? scale * 0.7 : scale),
      transformOrigin: 'center',
    });
  }

  window.addEventListener('mousedown', (e) => {
    isDragging = true;
    updatePointer(e);
  });
  window.addEventListener('touchstart', (e) => {
    isDragging = true;
    updatePointer(e);
  });

  window.addEventListener('mousemove', updatePointer);
  window.addEventListener('touchmove', updatePointer);

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  });
  window.addEventListener('touchend', () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  });

  loop();
}

/**
 * Animated dripping waves on the top canvas (id `top-waves-canvas`).
 * Returns a cleanup function to stop the ticker & listeners. Skips on Safari.
 * @returns {() => void}
 */
export function animateTopDrippingWaves() {
  const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (safari) return () => {};

  const canvas = document.getElementById('top-waves-canvas');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  const resolution = window.devicePixelRatio || 1;

  let vw, vh;
  let waves = [];
  let resized = false;
  let waveHeightTween = null;
  const pointTweens = [];
  const onResize = () => (resized = true);

  resizeCanvas();
  initWaves();

  function update() {
    if (resized) {
      resizeCanvas();
      waves.forEach((w) => w.resize(vw, vh));
      resized = false;
    }
    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'source-over';
    waves.forEach((w) => w.draw());
  }

  gsap.ticker.add(update);
  window.addEventListener('resize', onResize);

  function isMobile() {
    return window.innerWidth < 850;
  }

  function resizeCanvas() {
    vw = window.innerWidth;
    vh = isMobile() ? 200 : 300;
    canvas.width = vw * resolution;
    canvas.height = vh * resolution;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(resolution, resolution);
  }

  function getCssVar(varName, fallback) {
    const value = getComputedStyle(document.body).getPropertyValue(varName);
    return value.trim() || fallback;
  }

  function initWaves() {
    waves = [];
    pointTweens.forEach((t) => t.kill());
    pointTweens.length = 0;
    if (waveHeightTween) waveHeightTween.kill();

    const wave1 = createWave({
      amplitude: isMobile() ? 40 : 100,
      frequency: 0.5,
      segments: 100,
      waveHeight: isMobile() ? 70 : vh * 0.4,
      colorVar: '--wave-color-1',
    });

    const wave2 = createWave({
      amplitude: isMobile() ? 20 : 60,
      frequency: 0.3,
      segments: 100,
      waveHeight: isMobile() ? 75 : vh * 0.4,
      colorVar: '--wave-color-2',
    });

    waveHeightTween = gsap.to([wave1, wave2], {
      duration: 36,
      waveHeight: vh / 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    waves.push(wave1, wave2);
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      frequency: options.frequency,
      segments: options.segments,
      waveHeight: options.waveHeight,
      colorVar: options.colorVar,
      points: [],
      width: vw,
      height: vh,
      init,
      resize,
      draw,
    };

    function init() {
      wave.points = [];
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, { duration: 8, y: -1, repeat: -1, yoyo: true, ease: 'sine.inOut' })
          .progress((i / wave.segments) * wave.frequency);
        pointTweens.push(tween);
        wave.points.push(point);
      }
    }

    function resize(width, height) {
      wave.width = width;
      wave.height = height;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    function draw() {
      const height = wave.amplitude / 2;
      const startY = wave.waveHeight;
      const fill = getCssVar(wave.colorVar, 'rgba(0,0,0,0.2)');

      ctx.beginPath();
      // Fill to edges; smooth curve
      ctx.moveTo(0, 0);
      ctx.lineTo(wave.points[0].x, startY - wave.points[0].y * height);

      for (let i = 1; i < wave.points.length - 1; i++) {
        const current = wave.points[i];
        const next = wave.points[i + 1];
        const cx = (current.x + next.x) / 2;
        const cy = startY - ((current.y + next.y) / 2) * height;
        ctx.quadraticCurveTo(current.x, startY - current.y * height, cx, cy);
      }

      const last = wave.points[wave.points.length - 1];
      ctx.lineTo(last.x, startY - last.y * height);
      ctx.lineTo(wave.width, 0);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    wave.init();
    return wave;
  }

  // Cleanup function
  return () => {
    gsap.ticker.remove(update);
    window.removeEventListener('resize', onResize);
    if (waveHeightTween) waveHeightTween.kill();
    pointTweens.forEach((t) => t.kill());
  };
}

/**
 * Full-screen menu dripping waves (id `menu-waves-canvas`).
 * Returns a cleanup to stop ticker & listeners. Skips on Safari.
 * @returns {() => void}
 */
export function animateMenuDrippingWaves() {
  const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (safari) return () => {};

  const canvas = document.getElementById('menu-waves-canvas');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  const resolution = window.devicePixelRatio || 1;

  let vw, vh;
  let waves = [];
  let resized = false;
  let waveHeightTween = null;
  const pointTweens = [];
  const onResize = () => (resized = true);

  resizeCanvas();
  initWaves();

  function update() {
    if (resized) {
      resizeCanvas();
      waves.forEach((w) => w.resize(vw, vh));
      resized = false;
    }
    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'source-over';
    waves.forEach((w) => w.draw());
  }

  gsap.ticker.add(update);
  window.addEventListener('resize', onResize);

  function isMobile() {
    return window.innerWidth < 850;
  }

  function resizeCanvas() {
    vw = window.innerWidth;
    vh = isMobile() ? 200 : 300;
    canvas.width = vw * resolution;
    canvas.height = vh * resolution;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(resolution, resolution);
  }

  function getCssVar(varName, fallback) {
    const value = getComputedStyle(document.body).getPropertyValue(varName);
    return value.trim() || fallback;
  }

  function initWaves() {
    waves = [];
    pointTweens.forEach((t) => t.kill());
    pointTweens.length = 0;
    if (waveHeightTween) waveHeightTween.kill();

    const wave1 = createWave({
      amplitude: isMobile() ? 40 : 100,
      frequency: 0.5,
      segments: 100,
      waveHeight: isMobile() ? 70 : vh * 0.4,
      colorVar: '--wave-color-1',
    });

    const wave2 = createWave({
      amplitude: isMobile() ? 20 : 60,
      frequency: 0.3,
      segments: 100,
      waveHeight: isMobile() ? 75 : vh * 0.4,
      colorVar: '--wave-color-2',
    });

    waveHeightTween = gsap.to([wave1, wave2], {
      duration: 36,
      waveHeight: vh / 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    waves.push(wave1, wave2);
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      frequency: options.frequency,
      segments: options.segments,
      waveHeight: options.waveHeight,
      colorVar: options.colorVar,
      points: [],
      width: vw,
      height: vh,
      init,
      resize,
      draw,
    };

    function init() {
      wave.points = [];
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, { duration: 8, y: -1, repeat: -1, yoyo: true, ease: 'sine.inOut' })
          .progress((i / wave.segments) * wave.frequency);
        pointTweens.push(tween);
        wave.points.push(point);
      }
    }

    function resize(width, height) {
      wave.width = width;
      wave.height = height;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    function draw() {
      const height = wave.amplitude / 2;
      const startY = wave.waveHeight;
      const fill = getCssVar(wave.colorVar, 'rgba(0,0,0,0.2)');

      ctx.beginPath();
      ctx.moveTo(wave.points[0].x, startY - wave.points[0].y * height);
      for (let i = 1; i < wave.points.length; i++) {
        const pt = wave.points[i];
        ctx.lineTo(pt.x, startY - pt.y * height);
      }
      ctx.lineTo(wave.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    wave.init();
    return wave;
  }

  // Cleanup function
  return () => {
    gsap.ticker.remove(update);
    window.removeEventListener('resize', onResize);
    if (waveHeightTween) waveHeightTween.kill();
    pointTweens.forEach((t) => t.kill());
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Defer heavy animation work until after LCP / browser idle (opt-in)        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Defer a callback until the browser is idle (approx. after LCP).
 * Uses `requestIdleCallback` when available; falls back to a micro-timeout.
 * Returns a cancel function.
 *
 * @param {() => void} cb - Work to run later (heavy animation setup).
 * @param {number} [timeout=2000] - Max wait before forcing execution (ms).
 * @returns {() => void} cancel - Call to cancel the scheduled work.
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
  } else {
    const id = setTimeout(start, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }
}

/**
 * Schedule top dripping waves after LCP/idle.
 * Returns a function that cancels if not started yet, or cleans up if running.
 * @returns {() => void}
 */
export function scheduleTopWavesAfterLCP() {
  let cleanup = null;
  let started = false;
  const cancel = deferHeavy(() => {
    started = true;
    cleanup = animateTopDrippingWaves();
  });
  return () => {
    if (!started) cancel();
    else if (cleanup) cleanup();
  };
}

/**
 * Schedule menu dripping waves after LCP/idle.
 * Returns a function that cancels if not started yet, or cleans up if running.
 * @returns {() => void}
 */
export function scheduleMenuWavesAfterLCP() {
  let cleanup = null;
  let started = false;
  const cancel = deferHeavy(() => {
    started = true;
    cleanup = animateMenuDrippingWaves();
  });
  return () => {
    if (!started) cancel();
    else if (cleanup) cleanup();
  };
}

/**
 * Schedule gooey blobs + jelly interaction after LCP/idle.
 * @returns {() => void} cancel
 */
export function scheduleBlobsAfterLCP() {
  return deferHeavy(() => {
    animateGooeyBlobs();
    enableInteractiveJellyBlob();
  });
}
