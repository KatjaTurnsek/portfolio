/**
 * @file responsiveImages.js
 * @description Replaces <img.thumb data-src="..."> with <picture>, builds srcsets,
 * and fades images in. Asset URLs ALWAYS honor <base href> (if present) or
 * Vite's import.meta.env.BASE_URL, so they work on GH Pages (/portfolio/).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Base resolution                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Get the site base from <base href> or Vite's BASE_URL.
 * @returns {string} base path with trailing slash (e.g., "/portfolio/")
 */
function getSiteBase() {
  const fromTag = document.querySelector('base')?.getAttribute('href');
  if (fromTag) return ensureTrail(fromTag);

  const fromVite = (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) || '/';
  return ensureTrail(fromVite);
}

/**
 * Ensure a trailing slash.
 * @param {string} [s="/"]
 * @returns {string}
 */
function ensureTrail(s = '/') {
  return s.endsWith('/') ? s : s + '/';
}

/**
 * Join a relative path with the site base, avoiding double slashes/double base.
 * Leaves absolute (http/https), data:, and blob: URLs untouched.
 * @param {string} p
 * @returns {string}
 */
function withBase(p) {
  if (!p) return p;
  if (/^(https?:|data:|blob:)/i.test(p)) return p;

  const BASE = getSiteBase(); // e.g. "/portfolio/"
  if (p.startsWith(BASE)) return p;

  const clean = p.replace(/^\/+/, ''); // "assets/images/foo.webp"
  return BASE + clean;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Path building                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Build a fully-qualified URL for an image from:
 *  - data-src="filename.webp" (+ optional data-path="assets/images")
 *  - data-src="assets/images/filename.webp"
 *  - data-src="/assets/images/filename.webp"
 *  - data-src="https://…"
 * @param {string} filename
 * @param {string|undefined} dataPath
 * @returns {string}
 */
function buildFullPath(filename, dataPath) {
  if (!filename) return filename;
  if (/^(https?:|data:|blob:)/i.test(filename)) return filename;

  // If already includes a path, honor base.
  if (filename.includes('/')) {
    return withBase(filename);
  }

  const path = String(dataPath || 'assets/images').replace(/\/+$/, '');
  return withBase(`${path}/${filename}`);
}

/**
 * Parse file naming like:
 *   "anything-goes-600.webp"
 *   "web-rainydays-desktop-600.webp"
 *   "my-custom-name-v2-final-900.jpg"
 *
 * Rule: the ONLY thing we care about is the LAST "-<number>" before the extension.
 * If there is no "-<number>", we return null (so no srcset will be generated).
 *
 * @param {string} filename
 * @returns {{base:string, ext:string} | null}
 */
function parseFilePattern(filename) {
  if (!filename) return null;

  // Support data-src="assets/images/foo-600.webp" too → match only the basename.
  const baseName = String(filename).split('/').pop() || '';

  // Match: (everything) + "-" + (digits) + "." + (ext)
  const m = baseName.match(/^(.*)-(\d+)\.(webp|avif|png|jpe?g)$/i);
  if (!m) return null;

  return { base: m[1], ext: m[3].toLowerCase() };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main hydrator                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Processes images within a section and replaces them with <picture>.
 * Supports optional attributes:
 *  - data-priority="eager" (sets loading=eager, fetchpriority=high)
 *  - data-sizes="(min-width: 1200px) 25vw, 90vw" (override sizes)
 *  - data-widths="320,640,960" (override srcset widths)
 *
 * @param {ParentNode} [section=document]
 * @returns {HTMLImageElement[]} processed <img> elements
 */
export function setupResponsiveImages(section = document) {
  const thumbs = section.querySelectorAll('img.thumb[data-src]');
  /** @type {HTMLImageElement[]} */
  const insertedImages = [];

  thumbs.forEach((img) => {
    try {
      const filename = img.getAttribute('data-src');
      const dataPath = img.getAttribute('data-path') || undefined;
      if (!filename) return;

      const parsed = parseFilePattern(filename);
      const picture = document.createElement('picture');

      // Optional <source> with srcset
      if (parsed) {
        const widthsAttr = img.getAttribute('data-widths');
        const widths = widthsAttr
          ? widthsAttr
              .split(',')
              .map((n) => parseInt(n.trim(), 10))
              .filter(Boolean)
          : [300, 600, 900];

        /** @type {Record<string,string>} */
        const mimeMap = {
          webp: 'image/webp',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          avif: 'image/avif',
        };
        const ext = parsed.ext;
        const type = mimeMap[ext] || `image/${ext}`;

        const source = document.createElement('source');
        const srcset = widths
          .map((w) => `${buildFullPath(`${parsed.base}-${w}.${ext}`, dataPath)} ${w}w`)
          .join(', ');

        const sizes =
          img.getAttribute('data-sizes') ||
          '(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw';

        source.setAttribute('type', type);
        source.setAttribute('srcset', srcset);
        source.setAttribute('sizes', sizes);
        picture.appendChild(source);
      }

      // Fallback <img>
      const fallback = document.createElement('img');
      const eager = img.getAttribute('data-priority') === 'eager';
      fallback.loading = eager ? 'eager' : 'lazy';
      fallback.decoding = 'async';
      if (eager) fallback.fetchPriority = 'high';

      // Copy attributes except our data-* inputs
      [...img.attributes].forEach((attr) => {
        const n = attr.name;
        if (!/^data-(src|path|priority|sizes|widths)$/i.test(n)) {
          fallback.setAttribute(n, attr.value);
        }
      });

      // Fade-in blur
      fallback.style.opacity = '0';
      fallback.style.filter = 'blur(10px)';
      fallback.style.transition = 'opacity 0.4s ease, filter 0.4s ease';

      // Tiny inline loader (optional)
      const container =
        img.closest('.work-item-wrapper') ||
        img.closest('.work-item') ||
        img.closest('.case-study-wrapper') ||
        img.parentElement;

      let loader;
      if (container) {
        loader = document.createElement('div');
        loader.className = 'simple-mini-loader';
        container.appendChild(loader);
      }
      const removeLoader = () => {
        if (!loader) return;
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 400);
      };

      fallback.onload = () => {
        fallback.style.opacity = '1';
        fallback.style.filter = 'blur(0)';
        removeLoader();
      };
      fallback.onerror = () => {
        if (!fallback.getAttribute('alt')) fallback.alt = 'Image failed to load';
        removeLoader();
      };

      picture.appendChild(fallback);
      img.replaceWith(picture);

      // If the image is already cached, reveal immediately
      const revealIfCached = () => {
        if (fallback.complete && fallback.naturalWidth) {
          fallback.style.opacity = '1';
          fallback.style.filter = 'blur(0)';
          removeLoader();
        }
      };

      // Defer setting src so the loader renders first
      const full = buildFullPath(filename, dataPath);
      requestAnimationFrame(() => {
        fallback.src = full;
        revealIfCached();
      });

      insertedImages.push(fallback);
    } catch {
      // ignore per-image failures
    }
  });

  return insertedImages;
}
