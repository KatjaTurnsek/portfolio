/**
 * GSAP-powered visuals (lightweight after removing heavy canvases).
 * - Static waves (menu header image swap on theme)
 * - Heading wavy lines
 * - Teal skill bars
 * - Gooey blobs + “jelly” drag  (ORIGINAL behavior kept)
 *   * Only change: circles -> irregular paths + tiny spread tighten
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
      // @ts-ignore
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
/* Teal bars (About) — mobile-safe version                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function animateTealBars() {
  const stack = document.querySelector('.bar-stack');
  if (!stack) return;
  if (stack.dataset.animated === '1') return;

  gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], { transformOrigin: 'left center' });

  const ready = () => stack.getBoundingClientRect().width > 2;

  const run = () => {
    gsap.set(['.bar-bg', '.bar-1', '.bar-2', '.bar-3'], { width: '100%' });

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
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

    setTimeout(() => {
      if (!stack.dataset.animated && ready()) run();
    }, 400);
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Gooey blobs + interactive jelly drag (ORIGINAL layout, slight tweak)       */
/* ────────────────────────────────────────────────────────────────────────── */

/** tiny helper */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** ORIGINAL DOM setup (keeps CSS blur on the whole SVG) */
function ensureBlobDOM() {
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
      // keep z-index controlled by CSS; do not override here
    });
    document.body.prepend(wrapper);
  }

  let svg = document.getElementById('blob-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'blob-svg';
    document.querySelector('.morphing-blob-wrapper')?.appendChild(svg);
  }

  const VW = window.innerWidth;
  const VH = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.setAttribute('preserveAspectRatio', 'none'); // fill viewport; no gutters/padding
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.display = 'block';
  // ORIGINAL blur-on-root approach (works with your CSS as well)
  svg.style.filter = 'blur(10px)';

  let g = document.getElementById('blobs-g');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'blobs-g';
    g.setAttribute('class', 'blobs'); // keep .blobs for your CSS selector compatibility
    svg.appendChild(g);
  }

  return { wrapper, svg, g, VW, VH };
}

/** NEW: make an irregular, closed blob path (replaces circle) */
function makeIrregularBlobPath(rBase = 120, irregularity = 0.18, points = 12) {
  const pts = [];
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < points; i++) {
    const t = (i / points) * TWO_PI;
    const r = rBase * (1 + (Math.random() * 2 - 1) * irregularity);
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    pts.push({ x, y });
  }

  // smooth-ish with quadratic beziers between midpoints
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    if (i === 0) d += `M ${cx} ${cy} `;
    d += `Q ${p0.x} ${p0.y} ${p1.x} ${p1.y} `;
  }
  d += 'Z';
  return d;
}

export function animateGooeyBlobs() {
  const { svg, g: container, VW, VH } = ensureBlobDOM();
  if (!container) return;

  // clear old
  container.querySelectorAll('.blob-group').forEach((n) => n.remove());

  const mobile = VW < 768;
  const svgns = 'http://www.w3.org/2000/svg';

  // ORIGINAL spread was roughly:
  //   mobile: 0.45 * min(VW, 700)
  //   desktop: 0.65 * min(VW, 1200)
  // We tighten just a little (as requested) without crowding:
  const spread = mobile
    ? 0.4 * Math.min(VW, 700) // was 0.45
    : 0.58 * Math.min(VW, 1200); // was 0.65

  const blobCount = 30;
  const motionDistance = mobile ? 120 : 400;

  // keep the original two-center feel
  const centers = [
    { x: clamp(VW * 0.3, 60, VW - 60), y: clamp(VH * 0.5, 60, VH - 60) },
    { x: clamp(VW * 0.7, 60, VW - 60), y: clamp(VH * 0.5, 60, VH - 60) },
  ];

  // no goo filter here — we rely on the same CSS/root blur as before
  container.removeAttribute('filter');

  for (let i = 1; i <= blobCount; i++) {
    const center = centers[i % 2];
    const x = clamp(center.x + Math.random() * spread - spread / 2, 0, VW);
    const y = clamp(center.y + Math.random() * spread - spread / 2, 0, VH);
    const size = Math.floor(Math.random() * 50) + 80;

    const group = document.createElementNS(svgns, 'g');
    group.setAttribute('class', 'blob-group');
    group.setAttribute('id', `blob-group-${i}`);
    group.setAttribute('transform', `translate(${x},${y})`);
    container.appendChild(group);

    // REPLACE circle with irregular path (keeps your original “blob” class & CSS)
    const path = document.createElementNS(svgns, 'path');
    path.setAttribute('class', 'blob');
    path.setAttribute('d', makeIrregularBlobPath(size, 0.22, 12 + Math.floor(Math.random() * 5)));
    group.appendChild(path);

    // ORIGINAL motion style: positional drift
    const pos = { x, y, rotation: 0 };
    gsap.to(pos, {
      duration: 12 + Math.random() * 4,
      x: clamp(x + Math.random() * motionDistance - motionDistance / 2, 0, VW),
      y: clamp(y + Math.random() * motionDistance - motionDistance / 2, 0, VH),
      rotation: Math.random() > 0.5 ? '+=180' : '-=180',
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        group.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${pos.rotation})`);
      },
    });

    // ORIGINAL gentle wobble — keep scale wiggle;
    // if MorphSVG available, softly morph between two nearby shapes (subtle)
    if (gsap.plugins?.MorphSVGPlugin) {
      const alt1 = makeIrregularBlobPath(size * 1.03, 0.24, 13);
      const alt2 = makeIrregularBlobPath(size * 0.97, 0.2, 11);
      gsap
        .timeline({ repeat: -1, yoyo: true })
        .to(path, { duration: 3.0 + Math.random(), ease: 'sine.inOut', morphSVG: { shape: alt1 } })
        .to(path, { duration: 3.0 + Math.random(), ease: 'sine.inOut', morphSVG: { shape: alt2 } });
    } else {
      gsap.to(path, {
        scaleX: 'random(0.95, 1.05)',
        scaleY: 'random(0.95, 1.05)',
        duration: 'random(2, 4)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center',
      });
    }
  }

  // ---------- Opacity: start strong, fade with scroll (CSS-variable friendly)
  const css = getComputedStyle(document.documentElement);
  const OPACITY_START = parseFloat(css.getPropertyValue('--blob-opacity-start')) || 0.55;
  const OPACITY_END = parseFloat(css.getPropertyValue('--blob-opacity-end')) || 0.25;

  // Set explicit start
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
          // markers: true,
        },
      }
    );
  } else {
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

  // keep viewBox synced
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  };
  window.addEventListener('resize', onResize, { passive: true });
}

/**
 * Interactive jelly drag:
 * Finds the closest blob to the pointer and lets it lag-follow the cursor/finger,
 * then animates it back to its original transform on release.
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

  const getScale = (dx, dy) => Math.min(Math.hypot(dx, dy) / 500, isSafari ? 0.18 : 0.25);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

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

  function returnBlobToOriginal(blob) {
    const original = originalTransforms.get(blob);
    if (!original) return;
    gsap.to(blob, {
      x: original.x,
      y: original.y,
      rotation: original.rotation || 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.5,
      ease: 'power2.out',
    });
  }

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
    if (now - lastSwitchTime < 200) return;

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
      rotation: angle, // original earlier feel
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
  window.addEventListener('touchmove', updatePointer, { passive: false });
  window.addEventListener(
    'mouseup',
    () => {
      isDragging = false;
      if (activeBlob) returnBlobToOriginal(activeBlob);
      activeBlob = null;
    },
    { passive: true }
  );
  window.addEventListener(
    'touchend',
    () => {
      isDragging = false;
      if (activeBlob) returnBlobToOriginal(activeBlob);
      activeBlob = null;
    },
    { passive: true }
  );

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
