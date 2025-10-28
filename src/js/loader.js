/**
 * @file loader.js
 * @description Global loader overlay (wave animation) + mini image loaders.
 * Hides with a fade, unlocks scroll, and dispatches `loader:done` when finished.
 */

import gsap from 'gsap';

let waveTweens = /** @type {gsap.core.Tween[]} */ ([]);
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
  // Idempotent: if already present, do nothing
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
  const path = /** @type {SVGPolylineElement|null} */ (document.querySelector('.wave-global'));
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
  let loader = /** @type {HTMLElement|null} */ (document.querySelector('.loader'));
  if (!loader) {
    createLoader();
    loader = /** @type {HTMLElement} */ (document.querySelector('.loader'));
  }
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
  const loader = /** @type {HTMLElement|null} */ (document.querySelector('.loader'));
  if (!loader) {
    document.dispatchEvent(new CustomEvent('loader:done'));
    return;
  }

  gsap.to(loader, {
    opacity: 0,
    duration: 0.45,
    ease: 'power2.out',
    onComplete: () => {
      // Kill and reset wave tweens
      waveTweens.forEach((t) => t.kill());
      waveTweens = [];
      waveStarted = false;

      // Remove loader and unlock scroll
      loader.remove();
      document.documentElement.classList.remove('no-scroll');

      document.dispatchEvent(new CustomEvent('loader:done'));
    },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mini image loaders + responsive <picture>                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Find the nearest positioned ancestor for placing a mini loader.
 * Falls back to the immediate parent if none is positioned.
 * @param {HTMLImageElement} img
 * @returns {HTMLElement|null}
 */
function findRelativeContainer(img) {
  let el = img.parentElement;
  while (el && el !== document.body) {
    const st = getComputedStyle(el);
    if (st.position === 'relative') return el;
    el = el.parentElement;
  }
  return img.parentElement;
}

/**
 * Attach a 3-dot mini loader to the image's positioned container and remove it on load/error.
 * Also sets the image `src` to begin loading.
 * @param {HTMLImageElement} img
 * @param {string} fullPath
 * @returns {void}
 */
export function attachMiniLoaderToImg(img, fullPath) {
  try {
    const container = findRelativeContainer(img);
    if (!container) return;

    const mini = document.createElement('div');
    mini.className = 'simple-mini-loader';
    mini.appendChild(document.createElement('span'));
    mini.appendChild(document.createElement('span'));
    mini.appendChild(document.createElement('span'));
    container.appendChild(mini);

    const removeMini = () => {
      mini.classList.add('fade-out');
      setTimeout(() => mini.remove(), 500);
    };

    if (img.complete && img.naturalWidth !== 0) {
      // Already cached
      setTimeout(removeMini, 250);
    } else {
      img.addEventListener('load', removeMini, { once: true });
      img.addEventListener(
        'error',
        () => {
          removeMini();
          if (!img.alt) img.alt = 'Image failed to load';
        },
        { once: true }
      );
    }

    // Trigger loading (works as <img> fallback inside <picture>, too)
    img.src = fullPath;
  } catch {
    /* no-op */
  }
}

/**
 * Convert <img class="thumb" data-src> into <picture> with multiple sources,
 * attach mini loaders, and return the created fallback <img> elements.
 * Expects filenames like: name-300.webp / name-600.jpg / etc.
 * @returns {HTMLImageElement[]}
 */
export function setupResponsiveImages() {
  const thumbs = document.querySelectorAll('img.thumb[data-src]');
  const inserted = /** @type {HTMLImageElement[]} */ ([]);

  thumbs.forEach((originalImg) => {
    try {
      const filename = originalImg.getAttribute('data-src') || '';
      const path = originalImg.getAttribute('data-path') || 'assets/images';
      if (!filename) return;

      const fullPath = `${path}/${filename}`;
      const baseMatch = filename.match(/^(.*?)(?:-mobile|-desktop)?-\d+\.(webp|jpg|png)$/);
      const baseName = baseMatch ? baseMatch[1] : null;

      const picture = document.createElement('picture');

      // Build <source> sets if we can infer a basename
      if (baseName) {
        /** @type {Array<'webp'|'jpg'|'png'>} */
        const formats = ['webp', 'jpg', 'png'];
        const sizes = [
          { width: 300, descriptor: '300w' },
          { width: 600, descriptor: '600w' },
          { width: 900, descriptor: '900w' },
        ];
        formats.forEach((format) => {
          const source = document.createElement('source');
          source.type = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          source.srcset = sizes
            .map((s) => `${path}/${baseName}-${s.width}.${format} ${s.descriptor}`)
            .join(', ');
          source.sizes = '(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw';
          picture.appendChild(source);
        });
      }

      // Fallback <img> inside <picture>
      const fallback = document.createElement('img');
      fallback.loading = originalImg.getAttribute('data-priority') === 'eager' ? 'eager' : 'lazy';

      // Copy non-data attributes from the original <img>
      [...originalImg.attributes].forEach((attr) => {
        if (!['data-src', 'data-path'].includes(attr.name)) {
          fallback.setAttribute(attr.name, attr.value);
        }
      });

      // Soft reveal once loaded
      fallback.style.opacity = '0';
      fallback.style.filter = 'blur(10px)';
      fallback.style.transition = 'opacity 0.4s ease, filter 0.4s ease';
      fallback.onload = () => {
        fallback.style.opacity = '1';
        fallback.style.filter = 'blur(0)';
      };

      picture.appendChild(fallback);
      originalImg.replaceWith(picture);

      // Kick off loading & attach mini loader
      attachMiniLoaderToImg(fallback, fullPath);
      inserted.push(fallback);
    } catch {
      /* skip this image on any error */
    }
  });

  return inserted;
}
