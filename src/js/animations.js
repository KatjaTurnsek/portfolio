/**
 * GSAP-powered visuals (lightweight after removing heavy canvases).
 * - Static waves (menu header image swap on theme)
 * - Heading wavy lines
 * - Teal skill bars
 * - Gooey blobs + “jelly” drag
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

function isDarkTheme() {
  const b = document.body;
  return b.classList.contains('dark-theme') || b.getAttribute('data-theme') === 'dark';
}

function purgeLegacyWavesInside(host) {
  host.querySelectorAll('#top-waves-canvas, #menu-waves-canvas').forEach((n) => n.remove());
  host.querySelectorAll('picture').forEach((n) => n.remove());
  host.querySelectorAll('img:not(.waves-fallback)').forEach((n) => n.remove());
  host.querySelectorAll('svg').forEach((n) => n.remove());
}

function ensureWaveImg(host, idHint) {
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

function pickSrcForTheme(host) {
  const single = host.getAttribute('data-src');
  if (single) return single;
  const dark = host.getAttribute('data-dark-src');
  const light = host.getAttribute('data-light-src');
  return isDarkTheme() ? dark || light || '' : light || dark || '';
}

export function setupStaticWaves() {
  const topHost =
    document.querySelector('.top-waves') ||
    document.getElementById('top-waves') ||
    document.querySelector('[data-waves="top"]');

  const menuHost =
    document.querySelector('.menu-waves') ||
    document.getElementById('menu-waves') ||
    document.querySelector('[data-waves="menu"]');

  const hosts = [topHost, menuHost].filter(Boolean);
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
    if (!hasAttrs) return;

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

export function observeThemeChangesForWaves() {
  const mo = new MutationObserver(() => refreshStaticWaveImages());
  mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  return () => mo.disconnect();
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Heading wavy lines (SVG)                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

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

/** @typedef {{ polyline: SVGPolylineElement, points: SVGPoint[], segments:number, amplitude:number, frequency:number }} PolyItem */
let _polylineItems = [];
let _polylineTickerAdded = false;

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

    const points = [];
    for (let i = 0; i <= segments; i++) {
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Teal bars (About)                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export function animateTealBars() {
  const tl = gsap.timeline();
  tl.to('.bar-bg', { width: '100%', duration: 1.5, stagger: 1, ease: 'power4.out' });
  tl.to('.bar-1', { width: '90%', duration: 1, ease: 'power4.out' }, '<+0.5');
  tl.to('.bar-2', { width: '70%', duration: 1, ease: 'power4.out' }, '-=0.6');
  tl.to('.bar-3', { width: '80%', duration: 1, ease: 'power4.out' }, '-=0.6');
  tl.to('.bar-label', { opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.2 }, '-=0.4');
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Gooey blobs + interactive jelly drag                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Ensure there is a top-level fixed host appended to <body> with #blob-svg.
 * This avoids transformed ancestor stacking issues on iOS.
 * @returns {SVGSVGElement}
 */
function ensureBlobHost() {
  // Host wrapper
  let host = document.querySelector('.morphing-blob-wrapper');
  if (!host) {
    host = document.createElement('div');
    host.className = 'morphing-blob-wrapper';
  }

  // SVG element
  let svg = document.getElementById('blob-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'blob-svg');
  }

  // Group container
  let g = svg.querySelector('#blobs-g');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'blobs-g');
    svg.appendChild(g);
  }

  // Move/append to <body> as the last child to win stacking
  if (host.parentNode !== document.body) {
    host.appendChild(svg);
    document.body.appendChild(host);
  } else if (svg.parentNode !== host) {
    host.appendChild(svg);
  }

  // Minimal inline safety (in case CSS didn’t load yet)
  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    zIndex: '9',
    pointerEvents: 'none',
  });
  Object.assign(svg.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    display: 'block',
    pointerEvents: 'none',
    zIndex: '9',
  });

  return /** @type {SVGSVGElement} */ (svg);
}

/** Ensure #blob-svg has correct viewBox to match viewport. */
function ensureBlobSvgSizing() {
  const svg = ensureBlobHost();
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.opacity = '1';
  return svg;
}

export function animateGooeyBlobs() {
  // Avoid double init
  const existing = document.getElementById('blobs-g');
  if (existing && existing.dataset.init === '1') return;

  const svg = ensureBlobSvgSizing();
  const container = /** @type {SVGGElement} */ (document.getElementById('blobs-g'));
  if (!container) return;
  container.dataset.init = '1';

  const rect = svg.viewBox.baseVal;
  const VW = rect.width || window.innerWidth;
  const VH = rect.height || window.innerHeight;

  const mobile = VW < 768;
  const svgns = 'http://www.w3.org/2000/svg';

  // Be visible immediately.
  gsap.set(container, { opacity: 0.4 });

  const blobCount = 30;
  const spread = mobile ? 400 : 700;
  const motionDistance = mobile ? 120 : 400;

  const centers = [
    { x: VW * 0.3, y: VH * 0.5 },
    { x: VW * 0.7, y: VH * 0.5 },
  ];

  // iOS Safari + SVG filter = sometimes hidden; remove filter to be safe
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
    circle.setAttribute('fill', 'var(--blob-color, #22d3ee)');
    circle.setAttribute('opacity', 'var(--blob-opacity, 0.45)');
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

  // Keep sized correctly on rotate/resize
  const resize = () => ensureBlobSvgSizing();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
}

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

  const getScale = (dx, dy) => Math.min(Math.sqrt(dx * dx + dy * dy) / 500, isSafari ? 0.18 : 0.25);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

  function getSVGCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const res = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: res.x, y: res.y };
  }

  function getClosestBlob(x, y) {
    const blobs = document.querySelectorAll('.blob-group');
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
        closest = blob;
      }
    });
    return /** @type {SVGGElement|null} */ (closest);
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
      const newM = closestBlob.getScreenCTM();
      const oldM = activeBlob?.getScreenCTM();
      const newDist = Math.hypot(newM.e - clientX, newM.f - clientY);
      const oldDist = oldM ? Math.hypot(oldM.e - clientX, oldM.f - clientY) : Infinity;
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
    const id = window.requestIdleCallback(start, { timeout });
    return () => {
      cancelled = true;
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
