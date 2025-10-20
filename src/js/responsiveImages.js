/**
 * responsiveImages.js
 * Replaces <img.thumb data-src="..."> with <picture>, builds srcsets, and
 * fades images in. Asset URLs ALWAYS honor <base href> (if present) or
 * Vite's import.meta.env.BASE_URL, so they work on GH Pages (/portfolio/).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Base resolution                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function getSiteBase() {
  // 1) Prefer <base href> if present in built HTML (GH Pages has /portfolio/)
  const fromTag = document.querySelector('base')?.getAttribute('href');
  if (fromTag) return ensureTrail(fromTag);

  // 2) Fallback to Vite's BASE_URL when running as a module
  const fromVite = (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) || '/';
  return ensureTrail(fromVite);
}

function ensureTrail(s = '/') {
  return s.endsWith('/') ? s : s + '/';
}

/**
 * Join path with site base, avoiding double slashes and double-base.
 * Leaves http(s):, data:, blob: untouched.
 */
function withBase(p) {
  if (!p) return p;
  if (/^(https?:|data:|blob:)/i.test(p)) return p;

  const BASE = getSiteBase(); // e.g. "/portfolio/"

  // If already starts with BASE (e.g. "/portfolio/assets/..."), keep as-is
  if (p.startsWith(BASE)) return p;

  // Strip any leading "/" so we don't escape the base path
  const clean = p.replace(/^\/+/, ''); // "assets/images/foo.webp"
  return BASE + clean; // "/portfolio/assets/images/foo.webp"
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Path building                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Build a fully-qualified URL for an image from
 *  - data-src="filename.webp" + optional data-path="assets/images"
 *  - data-src="assets/images/filename.webp"
 *  - data-src="/assets/images/filename.webp"
 *  - data-src="https://…"
 */
function buildFullPath(filename, dataPath) {
  if (!filename) return filename;

  // External or data/blob → passthrough
  if (/^(https?:|data:|blob:)/i.test(filename)) return filename;

  // If filename already carries a path, still honor base.
  if (filename.includes('/')) {
    // Avoid double-base; strip leading slash then prefix BASE
    return withBase(filename);
  }

  // Filename only → combine with dataPath (default assets/images), then add base
  const path = String(dataPath || 'assets/images').replace(/\/+$/, '');
  return withBase(`${path}/${filename}`);
}

/**
 * Convert "foo-600.webp" OR "foo-mobile-600.webp" → { base: "foo[-mobile]", ext: "webp" }
 * Falls back to "name.ext".
 */
function parseFilePattern(filename) {
  const m = filename.match(/^(.*?)(?:-mobile|-desktop)?-(\d+)\.(webp|jpe?g|png|avif)$/i);
  if (m) return { base: m[1], ext: m[3].toLowerCase() };

  const m2 = filename.match(/^(.*)\.(webp|jpe?g|png|avif)$/i);
  return m2 ? { base: m2[1], ext: m2[2].toLowerCase() } : null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main hydrator                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Processes images within a section and replaces them with <picture>.
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
        const widths = [300, 600, 900];
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
          .map((w) => buildFullPath(`${parsed.base}-${w}.${ext}`, dataPath) + ` ${w}w`)
          .join(', ');

        source.setAttribute('type', type);
        source.setAttribute('srcset', srcset);
        source.setAttribute('sizes', '(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw');
        picture.appendChild(source);
      }

      // Fallback <img>
      const fallback = document.createElement('img');
      fallback.loading = img.getAttribute('data-priority') === 'eager' ? 'eager' : 'lazy';

      // Copy attributes except our data-* inputs
      [...img.attributes].forEach((attr) => {
        const n = attr.name;
        if (n !== 'data-src' && n !== 'data-path' && n !== 'data-priority') {
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

      // If already cached
      setTimeout(() => {
        if (fallback.complete && fallback.naturalWidth) {
          fallback.style.opacity = '1';
          fallback.style.filter = 'blur(0)';
          removeLoader();
        }
      }, 1200);

      picture.appendChild(fallback);
      img.replaceWith(picture);

      // Defer setting src so the loader renders first
      setTimeout(() => {
        const full = buildFullPath(filename, dataPath);
        // Debug hint if something 404s
        // console.debug('[img]', { filename, dataPath, resolved: full });
        fallback.src = full;
      }, 0);

      insertedImages.push(fallback);
    } catch {
      // ignore per-image failures
    }
  });

  return insertedImages;
}
