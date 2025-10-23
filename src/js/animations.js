/**
 * GSAP-powered visuals (lightweight after removing heavy canvases).
 * - Static waves (menu header image swap on theme)
 * - Heading wavy lines
 * - Teal skill bars
 * - Gooey blobs (irregular paths) + “jelly” drag
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
/* Gooey blobs (irregular paths) + interactive jelly drag                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** Utility */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** SVG host + <defs> goo filter */
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
    });
    document.body.prepend(wrapper);
  }

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
  svg.style.width = '100vw';
  svg.style.height = '100vh';
  svg.style.display = 'block';

  // defs (goo)
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
  }

  let goo = svg.querySelector('#goo');
  if (!goo) {
    goo = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    goo.setAttribute('id', 'goo');
    goo.setAttribute('color-interpolation-filters', 'sRGB');

    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute(
      'stdDeviation',
      getComputedStyle(document.documentElement).getPropertyValue('--blob-blur').trim() || '14'
    ); // CSS variable override

    const matrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    matrix.setAttribute('mode', 'matrix');
    // threshold to make overlaps merge (tweak last column ~17–22)
    matrix.setAttribute(
      'values',
      `
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      0 0 0 22 -10
    `.trim()
    );

    const comp = document.createElementNS('http://www.w3.org/2000/svg', 'feBlend');
    comp.setAttribute('in2', 'SourceGraphic');
    comp.setAttribute('mode', 'normal');

    goo.appendChild(blur);
    goo.appendChild(matrix);
    goo.appendChild(comp);
    defs.appendChild(goo);
  }

  let g = document.getElementById('blobs-g');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'blobs-g';
    svg.appendChild(g);
  }
  g.setAttribute('filter', 'url(#goo)');

  return { wrapper, svg, g, VW, VH };
}

/** Generate a blobby closed path with slight irregularity */
function makeIrregularBlobPath(rBase = 120, irregularity = 0.18, points = 10) {
  const pts = [];
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < points; i++) {
    const t = (i / points) * TWO_PI;
    // radius with small random wobble
    const r = rBase * (1 + (Math.random() * 2 - 1) * irregularity);
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    pts.push({ x, y });
  }

  // Smooth with quadratic beziers
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

/**
 * Main: create clustered, overlapping irregular blobs and animate them.
 * - Desktop: tighter clusters & bigger radii for strong merging
 * - Mobile: fewer, smaller blobs; same full-viewport host (no side padding)
 */
export function animateGooeyBlobs() {
  const { svg, g: container, VW, VH } = ensureBlobDOM();
  if (!container) return;

  // Clear old
  container.querySelectorAll('.blob-group').forEach((n) => n.remove());

  const isMobile = VW < 768;

  // Cluster layout → keeps blobs close = more "liquid"
  const clusters = isMobile
    ? [
        { x: VW * 0.45, y: VH * 0.5 },
        { x: VW * 0.55, y: VH * 0.55 },
      ]
    : [
        { x: VW * 0.42, y: VH * 0.48 },
        { x: VW * 0.58, y: VH * 0.52 },
        { x: VW * 0.5, y: VH * 0.56 },
      ];

  const blobCount = isMobile ? 12 : 18;
  const spread = isMobile ? Math.min(VW, VH) * 0.18 : Math.min(VW, VH) * 0.22;

  // Sizes
  const rMin = isMobile ? 50 : 90;
  const rMax = isMobile ? 110 : 180;

  // Motion range
  const motion = isMobile ? 90 : 220;

  const svgns = 'http://www.w3.org/2000/svg';

  for (let i = 0; i < blobCount; i++) {
    const c = clusters[i % clusters.length];
    const x = clamp(c.x + (Math.random() - 0.5) * spread, 40, VW - 40);
    const y = clamp(c.y + (Math.random() - 0.5) * spread, 40, VH - 40);
    const r = Math.floor(Math.random() * (rMax - rMin)) + rMin;

    // Group (positioned)
    const group = document.createElementNS(svgns, 'g');
    group.setAttribute('class', 'blob-group');
    group.setAttribute('transform', `translate(${x},${y})`);
    container.appendChild(group);

    // Irregular blob <path> (non-circle)
    const path = document.createElementNS(svgns, 'path');
    path.setAttribute('class', 'blob'); // color via CSS
    path.setAttribute('d', makeIrregularBlobPath(r, 0.22, 12 + Math.floor(Math.random() * 5)));
    group.appendChild(path);

    // Gentle path morphing between variants (organic wobble)
    if (gsap.plugins?.MorphSVGPlugin) {
      const alt1 = makeIrregularBlobPath(r * 1.04, 0.24, 13);
      const alt2 = makeIrregularBlobPath(r * 0.96, 0.2, 11);

      gsap
        .timeline({ repeat: -1, yoyo: true })
        .to(path, {
          duration: 3.2 + Math.random(),
          ease: 'sine.inOut',
          morphSVG: { shape: alt1 },
        })
        .to(path, {
          duration: 3.0 + Math.random(),
          ease: 'sine.inOut',
          morphSVG: { shape: alt2 },
        });
    } else {
      // Scale wiggle fallback
      gsap.to(path, {
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        scaleX: 'random(0.95, 1.05)',
        scaleY: 'random(0.95, 1.05)',
        transformOrigin: 'center',
      });
    }

    // Slow positional drift to keep clusters alive
    const pos = { x, y, rot: 0 };
    gsap.to(pos, {
      duration: 8 + Math.random() * 4,
      x: clamp(x + (Math.random() - 0.5) * motion, 20, VW - 20),
      y: clamp(y + (Math.random() - 0.5) * motion, 20, VH - 20),
      rot: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40),
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        group.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${pos.rot})`);
      },
    });
  }

  // Opacity vs scroll (CSS var friendly)
  const css = getComputedStyle(document.documentElement);
  const OPACITY_START = parseFloat(css.getPropertyValue('--blob-opacity-start')) || 0.5;
  const OPACITY_END = parseFloat(css.getPropertyValue('--blob-opacity-end')) || 0.12;

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
 * Now uses the irregular <path> blobs inside each .blob-group.
 * Picks the nearest group to the pointer and stretches it.
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

  const getScale = (dx, dy) => Math.min(Math.hypot(dx, dy) / 500, isSafari ? 0.16 : 0.22);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

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
      y: original.y,
      rotation: original.rotation || 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.2,
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
    if (now - lastSwitchTime < 160) return;

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

  window.addEventListener('mousedown', (e) => {
    isDragging = true;
    updatePointer(e);
  });
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

  const endDrag = () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  };
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

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
