/**
 * GSAP-powered visuals (lightweight after removing heavy canvases).
 * - Static waves (menu header image swap on theme)
 * - Heading wavy lines
 * - Teal skill bars (mobile-safe)
 * - Gooey blobs + “jelly” drag (mobile-visible)
 * - Defer helper
 */

import { gsap } from 'gsap';
import { MorphSVGPlugin } from '../../node_modules/gsap/MorphSVGPlugin.js';
import { ScrollTrigger } from '../../node_modules/gsap/ScrollTrigger.js';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/** Safari detection (minor perf tweaks). */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/* ────────────────────────────────────────────────────────────────────────── */
/* Static waves (single <img> per host; dark/light swap)                      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @returns {boolean} True when the current theme is dark.
 */
function isDarkTheme() {
  const b = document.body;
  return b.classList.contains('dark-theme') || b.getAttribute('data-theme') === 'dark';
}

/**
 * Remove legacy canvases/pictures/extra images/SVGs inside a wave host.
 * @param {Element} host
 * @returns {void}
 */
function purgeLegacyWavesInside(host) {
  host.querySelectorAll('#top-waves-canvas, #menu-waves-canvas').forEach((n) => n.remove());
  host.querySelectorAll('picture').forEach((n) => n.remove());
  host.querySelectorAll('img:not(.waves-fallback)').forEach((n) => n.remove());
  host.querySelectorAll('svg').forEach((n) => n.remove());
}

/**
 * Ensure a single managed <img.waves-fallback> exists in the host.
 * @param {Element} host
 * @param {string} [idHint]
 * @returns {HTMLImageElement}
 */
function ensureWaveImg(host, idHint) {
  /** @type {HTMLImageElement|null} */
  let img = host.querySelector('img.waves-fallback');
  if (!img) {
    img = document.createElement('img');
    img.className = 'waves-fallback';
    if (idHint) img.id = idHint;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    Object.assign(img.style, {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      display: 'block',
      objectFit: 'cover',
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: '0',
      transition: 'opacity .25s ease',
    });
    host.appendChild(img);
  }
  return img;
}

/**
 * Choose the appropriate image URL for the current theme.
 * @param {Element} host
 * @returns {string}
 */
function pickSrcForTheme(host) {
  const single = host.getAttribute('data-src');
  if (single) return single;
  const dark = host.getAttribute('data-dark-src');
  const light = host.getAttribute('data-light-src');
  return isDarkTheme() ? dark || light || '' : light || dark || '';
}

/**
 * Initialize static wave images for eligible hosts (e.g., menu).
 * Skips hosts that lack data-* src attributes (e.g., header now CSS-only).
 * @returns {void}
 */
export function setupStaticWaves() {
  const topHost =
    document.querySelector('.top-waves') ||
    document.getElementById('top-waves') ||
    document.querySelector('[data-waves="top"]');

  const menuHost =
    document.querySelector('.menu-waves') ||
    document.getElementById('menu-waves') ||
    document.querySelector('[data-waves="menu"]');

  /** @type {Element[]} */
  const hosts = [topHost, menuHost].filter((h) => !!h);
  const eligible = hosts.filter(
    (h) =>
      h.hasAttribute('data-src') ||
      h.hasAttribute('data-light-src') ||
      h.hasAttribute('data-dark-src')
  );

  eligible.forEach((host, i) => {
    if (!(host instanceof HTMLElement)) return;

    host.style.position = host.style.position || 'absolute';
    host.style.left = host.style.left || '0';
    host.style.top = host.style.top || '0';
    host.style.width = host.style.width || '100%';
    host.style.pointerEvents = 'none';
    host.style.zIndex = host.style.zIndex || '0';

    purgeLegacyWavesInside(host);
    const img = ensureWaveImg(host, i === 0 ? 'top-waves-img' : 'menu-waves-img');
    const nextSrc = pickSrcForTheme(host);
    if (!nextSrc) return;

    const abs = new URL(nextSrc, location.href).href;
    if (img.src === abs && img.complete) {
      img.style.opacity = '1';
      return;
    }

    const pre = new Image();
    pre.decoding = 'async';
    pre.onload = () => {
      img.src = nextSrc;
      img.style.opacity = '1';
    };
    pre.onerror = () => {
      img.src = nextSrc;
      img.style.opacity = '1';
    };
    pre.src = nextSrc;
  });
}

/**
 * Refresh static wave images when theme toggles.
 * @returns {void}
 */
export function refreshStaticWaveImages() {
  const hosts = [
    document.querySelector('.top-waves') ||
      document.getElementById('top-waves') ||
      document.querySelector('[data-waves="top"]'),
    document.querySelector('.menu-waves') ||
      document.getElementById('menu-waves') ||
      document.querySelector('[data-waves="menu"]'),
  ].filter(Boolean);

  hosts.forEach((host) => {
    const hasAttrs =
      host.hasAttribute('data-src') ||
      host.hasAttribute('data-light-src') ||
      host.hasAttribute('data-dark-src');
    if (!hasAttrs) return; // skip header (CSS background)

    const img = host.querySelector('img.waves-fallback');
    const nextSrc = pickSrcForTheme(host);
    if (!img || !nextSrc) return;

    const abs = new URL(nextSrc, location.href).href;
    if (img.src === abs) return;

    img.style.opacity = '0';
    const pre = new Image();
    pre.decoding = 'async';
    pre.onload = () => {
      img.src = nextSrc;
      img.style.opacity = '1';
    };
    pre.onerror = () => {
      img.src = nextSrc;
      img.style.opacity = '1';
    };
    pre.src = nextSrc;
  });
}

/**
 * Observe theme changes on <body> and refresh images. Returns a disposer.
 * @returns {() => void}
 */
export function observeThemeChangesForWaves() {
  const mo = new MutationObserver(() => refreshStaticWaveImages());
  mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  return () => mo.disconnect();
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Heading wavy lines (SVG)                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Animate an existing hero wavy path (#wavy-line path) if present.
 * Uses MorphSVG when available; otherwise a simple bob.
 * @returns {void}
 */
export function animateWaveLine() {
  const path = /** @type {SVGPathElement|null} */ (document.querySelector('#wavy-line path'));
  if (!path) return;

  const ALT_D = 'M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15';
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
    gsap.to(path, { duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', y: 2 });
  }
}

/**
 * Insert a small inline SVG “wavy line” right after each <h2>.
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
    const svg = wrapper.firstElementChild;
    if (svg) heading.insertAdjacentElement('afterend', svg);
  });
}

/**
 * @typedef {Object} PolyItem
 * @property {SVGPolylineElement} polyline
 * @property {SVGPoint[]} points
 * @property {number} segments
 * @property {number} amplitude
 * @property {number} frequency
 */

/** @type {PolyItem[]} */
let _polylineItems = [];
let _polylineTickerAdded = false;

/**
 * Animate subtle wave motion on each `.wavy-polyline` using one GSAP ticker.
 * @returns {void}
 */
export function animateCustomWaveLines() {
  const polylines = document.querySelectorAll('.wavy-polyline');

  polylines.forEach((polyline) => {
    if (!(polyline instanceof SVGPolylineElement)) return;
    if (polyline.dataset.waveInit === '1') return;
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
      // @ts-ignore createSVGPoint exists on SVGSVGElement
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

/** @returns {void} */
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Teal bars (About) — mobile-safe version                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Animate the teal skill bars on the About section.
 * - Waits until the container has non-zero width (mobile/layout issue)
 * - Uses transform scaleX instead of width for robust animation
 * - Guards against double init; respects reduced motion
 * @returns {void}
 */
export function animateTealBars() {
  const stack = document.querySelector('.bar-stack');
  if (!stack) return; // nothing to do on this view
  if (stack.dataset.animated === '1') return; // already ran

  // Ensure transforms animate from the left edge and keep layout width
  gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], {
    transformOrigin: 'left center',
    width: '100%',
  });

  const ready = () => stack.getBoundingClientRect().width > 2;

  const run = () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      // Static final state for accessibility
      gsap.set('.bar-bg', { scaleX: 1 });
      gsap.set('.bar-1', { scaleX: 0.9 });
      gsap.set('.bar-2', { scaleX: 0.7 });
      gsap.set('.bar-3', { scaleX: 0.8 });
      gsap.set('.bar-label', { opacity: 1 });
      stack.dataset.animated = '1';
      return;
    }

    // Start collapsed, then animate open
    gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], { scaleX: 0 });
    gsap.set('.bar-label', { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.bar-bg', { scaleX: 1, duration: 1.2, stagger: 0.2 })
      .to('.bar-1', { scaleX: 0.9, duration: 0.9 }, '<+0.2')
      .to('.bar-2', { scaleX: 0.7, duration: 0.9 }, '-=0.5')
      .to('.bar-3', { scaleX: 0.8, duration: 0.9 }, '-=0.5')
      .to('.bar-label', { opacity: 1, duration: 0.8, stagger: 0.15 }, '-=0.3');

    stack.dataset.animated = '1';
  };

  // If layout is ready, run now; otherwise wait for width > 0
  if (ready()) {
    run();
  } else {
    const ro =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            if (ready()) {
              ro.disconnect();
              run();
            }
          })
        : null;
    if (ro) ro.observe(stack);

    // Safety fallback in case ResizeObserver is slow/unavailable
    setTimeout(() => {
      if (!stack.dataset.animated && ready()) run();
    }, 400);
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Gooey blobs + interactive jelly drag                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Create multiple SVG blobs and animate slow floating/scale motion.
 * Links opacity to scroll via ScrollTrigger.
 * Requires #blob-svg > #blobs-g container.
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

  // Ensure a visible starting value so scrub 0% isn’t invisible.
  gsap.set(container, { opacity: 0.3 });

  // Keep your scrub linkage (now it won’t start at 0).
  if (gsap.plugins?.ScrollTrigger) {
    gsap.to(container, {
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/**
 * Enable “closest blob follows pointer while dragging” interaction.
 * Requires #blob-svg and generated .blob-group nodes.
 * @returns {void}
 */
export function enableInteractiveJellyBlob() {
  const svg = document.getElementById('blob-svg');
  if (!svg) return;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  /** @type {SVGGElement|null} */
  let activeBlob = null;
  let isDragging = false;
  const originalTransforms = new Map();
  let lastSwitchTime = 0;

  const getScale = (dx, dy) => Math.min(Math.sqrt(dx * dx + dy * dy) / 500, isSafari ? 0.18 : 0.25);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

  /**
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{x:number,y:number}}
   */
  function getSVGCoords(clientX, clientY) {
    // @ts-ignore
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    // @ts-ignore
    const res = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: res.x, y: res.y };
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {SVGGElement|null}
   */
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

    return /** @type {SVGGElement|null} */ (closest);
  }

  /**
   * @param {SVGGElement} blob
   * @returns {void}
   */
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

  /**
   * @param {MouseEvent|TouchEvent} e
   * @returns {void}
   */
  function updatePointer(e) {
    if (!isDragging) return;
    const clientX = /** @type {TouchEvent} */ (e).touches
      ? /** @type {TouchEvent} */ (e).touches[0].clientX
      : /** @type {MouseEvent} */ (e).clientX;
    const clientY = /** @type {TouchEvent} */ (e).touches
      ? /** @type {TouchEvent} */ (e).touches[0].clientY
      : /** @type {MouseEvent} */ (e).clientY;
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
        const gp = gsap.getProperty(activeBlob);
        originalTransforms.set(activeBlob, {
          x: gp('x'),
          y: gp('y'),
          rotation: gp('rotation'),
          scaleX: gp('scaleX'),
          scaleY: gp('scaleY'),
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
  window.addEventListener('mousemove', updatePointer, { passive: false });
  window.addEventListener('touchmove', updatePointer, { passive: false });
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Defer helper                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Defer heavy work until the browser is idle (or next tick fallback).
 * @param {() => void} cb Work to run later.
 * @param {number} [timeout=2000] Max wait in ms for requestIdleCallback.
 * @returns {() => void} Cancel function.
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
