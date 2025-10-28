/**
 * @file animations.js
 * @overview GSAP-powered visuals after the FIRST Safari fallback.
 * Implements:
 *  - Static wave images with theme swap
 *  - Heading wavy lines (SVG polyline)
 *  - Teal skill bars animation
 *  - Gooey blobs with “jelly” drag interaction
 *  - A tiny defer helper (idle or setTimeout)
 *
 * Safari fallback (first version):
 *  - Detect Safari
 *  - Fewer blobs on Safari
 *  - Disable MorphSVG blob wobble on Safari (use scale wobble instead)
 *  - Fewer polyline segments for headings on Safari
 *
 * @remarks
 * - Browser-only. All functions assume a DOM environment.
 * - Uses GSAP + optional plugins (MorphSVGPlugin, ScrollTrigger).
 */

import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * True if current browser is Safari (used for perf fallback).
 * @type {boolean}
 */
const isSafari =
  typeof navigator !== 'undefined'
    ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    : false;

/* ────────────────────────────────────────────────────────────────────────── */
/* #region Static waves (single <img> per host; dark/light swap)              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Check if current theme is dark (by class or data attribute).
 * @returns {boolean}
 */
function isDarkTheme() {
  const b = document.body;
  return b.classList.contains('dark-theme') || b.getAttribute('data-theme') === 'dark';
}

/**
 * Remove any legacy wave canvases/pictures/SVGs from a host container.
 * @param {HTMLElement} host
 * @returns {void}
 */
function purgeLegacyWavesInside(host) {
  host.querySelectorAll('#top-waves-canvas, #menu-waves-canvas').forEach((n) => n.remove());
  host.querySelectorAll('picture').forEach((n) => n.remove());
  host.querySelectorAll('img:not(.waves-fallback)').forEach((n) => n.remove());
  host.querySelectorAll('svg').forEach((n) => n.remove());
}

/**
 * Ensure a single <img.waves-fallback> exists for a host.
 * @param {HTMLElement} host
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
 * Pick the best image src for current theme from host data attributes.
 * @param {HTMLElement} host
 * @returns {string} Resolved (possibly relative) URL string or "".
 */
function pickSrcForTheme(host) {
  const single = host.getAttribute('data-src');
  if (single) return single;
  const dark = host.getAttribute('data-dark-src');
  const light = host.getAttribute('data-light-src');
  return isDarkTheme() ? dark || light || '' : light || dark || '';
}

/**
 * Initialize static wave images for the top/menu wave hosts.
 * Expects hosts to have either data-src or (data-light-src/data-dark-src).
 * @returns {void}
 */
export function setupStaticWaves() {
  if (typeof document === 'undefined') return;

  const topHost =
    document.querySelector('.top-waves') ||
    document.getElementById('top-waves') ||
    document.querySelector('[data-waves="top"]');

  const menuHost =
    document.querySelector('.menu-waves') ||
    document.getElementById('menu-waves') ||
    document.querySelector('[data-waves="menu"]');

  /** @type {HTMLElement[]} */
  const eligible = [topHost, menuHost]
    .filter(Boolean)
    .filter(
      (h) =>
        h.hasAttribute('data-src') ||
        h.hasAttribute('data-light-src') ||
        h.hasAttribute('data-dark-src')
    );

  eligible.forEach((host, i) => {
    // Defensive: inline positioning for reliable stacking.
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
 * Re-compute and swap static wave images when the theme changes.
 * @returns {void}
 */
export function refreshStaticWaveImages() {
  if (typeof document === 'undefined') return;

  /** @type {HTMLElement[]} */
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
    if (!hasAttrs) return;

    /** @type {HTMLImageElement|null} */
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
 * Observe body class/theme attribute changes and refresh wave images.
 * @returns {() => void} Call to disconnect the observer.
 */
export function observeThemeChangesForWaves() {
  const mo = new MutationObserver(() => refreshStaticWaveImages());
  mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  return () => mo.disconnect();
}

/* #endregion Static waves --------------------------------------------------- */

/* ────────────────────────────────────────────────────────────────────────── */
/* #region Heading wavy lines (SVG)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Animate a single path inside #wavy-line using MorphSVG when available.
 * Graceful fallback uses a subtle Y translation.
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
 * @typedef {Object} PolylineItem
 * @property {SVGPolylineElement} polyline
 * @property {{x:number,y:number}[]} points
 * @property {number} segments
 * @property {number} amplitude
 * @property {number} frequency
 */

/** @type {PolylineItem[]} */
let _polylineItems = [];
let _polylineTickerAdded = false;

/**
 * Animate all inserted .wavy-polyline elements by mutating their points each tick.
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
    const segments = isSafari ? 50 : 100; // fewer points on Safari
    const interval = width / segments;

    /** @type {{x:number,y:number}[]} */
    const points = [];
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
  for (const item of _polylineItems) {
    const { polyline, points, segments, amplitude, frequency } = item;
    for (let i = 0; i <= segments; i++) {
      const y = 15 + Math.sin((i / segments) * Math.PI * frequency + time) * -amplitude;
      points[i].y = y;
      polyline.points.getItem(i).y = y;
    }
  }
}

/* #endregion Heading wavy lines -------------------------------------------- */

/* ────────────────────────────────────────────────────────────────────────── */
/* #region Teal bars (About)                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Animate the three teal bars and labels inside .bar-stack.
 * Respects prefers-reduced-motion.
 * @returns {void}
 */
export function animateTealBars() {
  const stack = document.querySelector('.bar-stack');
  if (!stack) return;
  if (stack.dataset.animated === '1') return;

  gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], { transformOrigin: 'left center' });

  const ready = () => stack.getBoundingClientRect().width > 2;

  const run = () => {
    gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], { width: '100%' });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.bar-bg', { scaleX: 1 });
      gsap.set('.bar-1', { scaleX: 0.9 });
      gsap.set('.bar-2', { scaleX: 0.7 });
      gsap.set('.bar-3', { scaleX: 0.8 });
      gsap.set('.bar-label', { opacity: 1 });
      stack.dataset.animated = '1';
      return;
    }

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

    // Last-resort kick if RO never fires (extremely rare)
    setTimeout(() => {
      if (!stack.dataset.animated && ready()) run();
    }, 400);
  }
}

/* #endregion Teal bars ----------------------------------------------------- */

/* ────────────────────────────────────────────────────────────────────────── */
/* #region Gooey blobs + interactive jelly drag                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Clamp a number to a range.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Create a soft rounded blob path (closed) using quadratic segments.
 * Formula: radius(theta) = r * (1 + a1*sin(k1*t + p1) + a2*sin(k2*t + p2))
 * @param {number} [r=120] Base radius
 * @param {number} [a1=0.06]
 * @param {number} [a2=0.04]
 * @param {number} [k1=3]
 * @param {number} [k2=5]
 * @param {number} [p1=0]
 * @param {number} [p2=0]
 * @returns {string} SVG path data string
 */
function makeSoftBlobPath(r = 120, a1 = 0.06, a2 = 0.04, k1 = 3, k2 = 5, p1 = 0, p2 = 0) {
  const TWO_PI = Math.PI * 2;
  const steps = 48;
  /** @type {{x:number,y:number}[]} */
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TWO_PI;
    const rad = r * (1 + a1 * Math.sin(k1 * t + p1) + a2 * Math.sin(k2 * t + p2));
    pts.push({ x: Math.cos(t) * rad, y: Math.sin(t) * rad });
  }
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1p = pts[(i + 1) % pts.length];
    const cx = (p0.x + p1p.x) / 2;
    const cy = (p0.y + p1p.y) / 2;
    if (i === 0) d += `M ${cx} ${cy} `;
    d += `Q ${p0.x} ${p0.y} ${p1p.x} ${p1p.y} `;
  }
  d += 'Z';
  return d;
}

/**
 * Ensure the SVG wrapper for blobs exists and is sized to the viewport.
 * @returns {{wrapper:HTMLElement, svg:SVGSVGElement, g:SVGGElement, VW:number, VH:number}}
 */
function ensureBlobDOM() {
  /** @type {HTMLElement|null} */
  let wrapper = document.querySelector('.morphing-blob-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'morphing-blob-wrapper';
    Object.assign(wrapper.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      willChange: 'transform',
      transform: 'translateZ(0)',
      overflow: 'hidden',
    });
    document.body.prepend(wrapper);
  }

  /** @type {SVGSVGElement|null} */
  let svg = document.getElementById('blob-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'blob-svg';
    wrapper.appendChild(svg);
  }

  const VW = window.innerWidth;
  const VH = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.display = 'block';

  /** @type {SVGGElement|null} */
  let g = document.getElementById('blobs-g');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'blobs-g';
    g.setAttribute('class', 'blobs');
    svg.appendChild(g);
  }

  return { wrapper, svg, g, VW, VH };
}

/**
 * Build and animate the ambient gooey blob field (non-interactive part).
 * - Counts & sizes adapt to viewport + Safari fallback.
 * - Uses MorphSVG wobble when available (except on Safari).
 * - Opacity interpolates from CSS vars with scroll (ScrollTrigger when present).
 * @returns {void}
 */
export function animateGooeyBlobs() {
  const { svg, g: container, VW, VH } = ensureBlobDOM();
  if (!container) return;

  // Clear old blobs for idempotency.
  container.querySelectorAll('.blob-group').forEach((n) => n.remove());

  // Mobile vs desktop
  const mobile = VW < 850;

  // Blob counts
  const blobCount = isSafari ? (mobile ? 10 : 16) : mobile ? 14 : 28;

  // Spread & motion
  const spread = mobile ? 0.6 * VW : 0.52 * Math.min(VW, 1200);
  const motionDistance = mobile ? Math.max(160, VW * 0.28) : 220;
  const durationBase = mobile ? 15 : 16;

  // Centers: 3 on mobile (triangle), 2 on desktop
  const centers = mobile
    ? [
        { x: clamp(VW * 0.25, 40, VW - 40), y: clamp(VH * 0.35, 40, VH - 40) },
        { x: clamp(VW * 0.75, 40, VW - 40), y: clamp(VH * 0.38, 40, VH - 40) },
        { x: clamp(VW * 0.5, 40, VW - 40), y: clamp(VH * 0.75, 40, VH - 40) },
      ]
    : [
        { x: clamp(VW * 0.3, 60, VW - 60), y: clamp(VH * 0.5, 60, VH - 60) },
        { x: clamp(VW * 0.7, 60, VW - 60), y: clamp(VH * 0.5, 60, VH - 60) },
      ];

  // Sizes: slightly smaller on mobile to avoid fusing under blur
  const baseSizeMin = mobile ? 60 : 80;
  const baseSizeVar = mobile ? 45 : 50;

  const svgns = 'http://www.w3.org/2000/svg';

  for (let i = 1; i <= blobCount; i++) {
    const center = centers[i % centers.length];
    const x = clamp(center.x + Math.random() * spread - spread / 2, 0, VW);
    const y = clamp(center.y + Math.random() * spread - spread / 2, 0, VH);
    const size = Math.floor(Math.random() * baseSizeVar) + baseSizeMin;

    const group = document.createElementNS(svgns, 'g');
    group.setAttribute('class', 'blob-group');
    group.setAttribute('id', `blob-group-${i}`);
    group.setAttribute('transform', `translate(${x},${y})`);
    container.appendChild(group);

    // Shape
    const path = document.createElementNS(svgns, 'path');
    path.setAttribute('class', 'blob');
    const d = makeSoftBlobPath(
      size,
      0.055 + Math.random() * 0.015,
      0.03 + Math.random() * 0.015,
      3,
      5,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    path.setAttribute('d', d);
    group.appendChild(path);

    // Positional drift
    const pos = { x, y, rotation: 0 };
    gsap.to(pos, {
      duration: durationBase + Math.random() * 6,
      x: clamp(x + Math.random() * motionDistance - motionDistance / 2, 0, VW),
      y: clamp(y + Math.random() * motionDistance - motionDistance / 2, 0, VH),
      rotation: Math.random() > 0.5 ? '+=60' : '-=60',
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        group.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${pos.rotation})`);
      },
    });

    // Wobble: MorphSVG on non-Safari; scale wobble on Safari
    if (gsap.plugins?.MorphSVGPlugin && !isSafari) {
      const alt1 = makeSoftBlobPath(
        size * 1.02,
        0.06,
        0.035,
        3,
        5,
        Math.random() * 6.28,
        Math.random() * 6.28
      );
      const alt2 = makeSoftBlobPath(
        size * 0.98,
        0.05,
        0.03,
        3,
        5,
        Math.random() * 6.28,
        Math.random() * 6.28
      );
      gsap
        .timeline({ repeat: -1, yoyo: true })
        .to(path, { duration: 4.0 + Math.random(), ease: 'sine.inOut', morphSVG: { shape: alt1 } })
        .to(path, { duration: 4.0 + Math.random(), ease: 'sine.inOut', morphSVG: { shape: alt2 } });
    } else {
      gsap.to(path, {
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        scaleX: 'random(0.98, 1.03)',
        scaleY: 'random(0.98, 1.03)',
        transformOrigin: 'center',
      });
    }
  }

  // Opacity with scroll (CSS-vars driven)
  const css = getComputedStyle(document.documentElement);
  const OPACITY_START = parseFloat(css.getPropertyValue('--blob-opacity-start')) || 0.55;
  const OPACITY_END = parseFloat(css.getPropertyValue('--blob-opacity-end')) || 0.25;

  gsap.set(container, { opacity: OPACITY_START });

  if (gsap.plugins?.ScrollTrigger) {
    const endFn = () =>
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
      window.innerHeight;

    gsap.fromTo(
      container,
      { opacity: OPACITY_START },
      {
        opacity: OPACITY_END,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: endFn,
          scrub: true,
        },
      }
    );
  } else {
    // Minimal manual fallback
    const lerp = (a, b, t) => a + (b - a) * t;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight || 1;
      const t = Math.min(Math.max(doc.scrollTop / max, 0), 1);
      const o = lerp(OPACITY_START, OPACITY_END, t);
      container.style.opacity = String(o);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Sync viewBox on resize
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  };
  window.addEventListener('resize', onResize, { passive: true });
}

/**
 * Enable “jelly” drag: while pointer is down, closest blob follows with
 * a squish/stretch; on release it returns to origin.
 * @returns {void}
 */
export function enableInteractiveJellyBlob() {
  const svg = /** @type {SVGSVGElement|null} */ (document.getElementById('blob-svg'));
  if (!svg) return;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  /** @type {SVGGElement|null} */
  let activeBlob = null;
  let isDragging = false;
  const originalTransforms = new Map();
  let lastSwitchTime = 0;
  let lastUpdate = 0;

  /**
   * Compute stretch scale based on velocity.
   * @param {number} dx
   * @param {number} dy
   * @returns {number}
   */
  const getScale = (dx, dy) => Math.min(Math.hypot(dx, dy) / 500, isSafari ? 0.16 : 0.22);

  /**
   * Compute angle degrees from velocity vector.
   * @param {number} dx
   * @param {number} dy
   * @returns {number}
   */
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

  /**
   * Find the closest blob-group to the given screen coords.
   * @param {number} x
   * @param {number} y
   * @returns {SVGGElement|null}
   */
  function getClosestBlob(x, y) {
    const blobs = document.querySelectorAll('.blob-group');
    /** @type {SVGGElement|null} */
    let closest = null;
    let minDist = Infinity;
    blobs.forEach((blob) => {
      const m = blob.getScreenCTM();
      if (!m) return;
      const cx = m.e;
      const cy = m.f;
      const d = Math.hypot(cx - x, cy - y);
      if (d < minDist) {
        minDist = d;
        closest = /** @type {SVGGElement} */ (blob);
      }
    });
    return closest;
  }

  /**
   * Tween a blob back to its original transform.
   * @param {Element} blob
   * @returns {void}
   */
  function returnBlobToOriginal(blob) {
    const original = originalTransforms.get(blob);
    if (!original) return;
    gsap.to(blob, {
      x: original.x,
      y: original.y,
      rotation: original.rotation || 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.4,
      ease: 'power2.out',
    });
  }

  /**
   * Track pointer while dragging and switch active blob (debounced).
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

    target.x = clientX;
    target.y = clientY;

    const now = Date.now();
    if (now - lastSwitchTime < 180) return;

    const closestBlob = getClosestBlob(clientX, clientY);

    if (closestBlob && closestBlob !== activeBlob) {
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

  /**
   * RAF loop to ease toward target and apply squish based on velocity.
   * @returns {void}
   */
  function loop() {
    requestAnimationFrame(loop);
    const now = Date.now();
    if (!isDragging || !activeBlob || now - lastUpdate < 16) return;
    lastUpdate = now;

    vel.x = target.x - current.x;
    vel.y = target.y - current.y;

    current.x += vel.x * 0.22;
    current.y += vel.y * 0.22;

    const angle = getAngle(vel.x, vel.y);
    const scale = getScale(vel.x, vel.y);

    gsap.set(activeBlob, {
      x: current.x,
      y: current.y,
      rotation: angle,
      scaleX: 1 + scale,
      scaleY: 1 - scale,
      transformOrigin: 'center',
    });
  }

  window.addEventListener(
    'mousedown',
    (e) => {
      isDragging = true;
      updatePointer(e);
    },
    { passive: true }
  );
  window.addEventListener(
    'touchstart',
    (e) => {
      isDragging = true;
      updatePointer(e);
    },
    { passive: true }
  );

  window.addEventListener('mousemove', updatePointer, { passive: true });
  // touchmove must remain non-passive because we may choose to preventDefault later.
  window.addEventListener('touchmove', updatePointer, { passive: false });

  const endDrag = () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  };
  window.addEventListener('mouseup', endDrag, { passive: true });
  window.addEventListener('touchend', endDrag, { passive: true });

  loop();
}

/* #endregion Gooey blobs --------------------------------------------------- */

/* ────────────────────────────────────────────────────────────────────────── */
/* #region Defer helper                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

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
    // @ts-ignore - available on modern browsers
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

/* #endregion Defer helper -------------------------------------------------- */
