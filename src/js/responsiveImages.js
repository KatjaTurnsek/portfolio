/**
 * responsiveImages.js
 * Replaces <img.thumb data-src="..."> with <picture>, builds srcsets, and
 * fades images in. All URLs are prefixed with Vite's BASE_URL.
 */

/**
 * Convert a relative asset path to a BASE_URL-aware path.
 * Leaves http(s): and data: URLs untouched.
 * @param {string} p
 * @returns {string}
 */
function withBase(p) {
  const BASE = (import.meta?.env?.BASE_URL ?? "/").replace(/\/$/, "");
  if (!p) return p;
  if (/^(https?:|data:)/i.test(p)) return p;

  // Already includes BASE
  if (p.startsWith(BASE + "/")) return p;

  // Root-absolute -> prefix BASE, relative -> join BASE
  return p.startsWith("/") ? `${BASE}${p}` : `${BASE}/${p}`;
}

/**
 * Build a fully qualified URL for an image, from either:
 *  - data-src = "filename.webp" + optional data-path="assets/images"
 *  - data-src = "assets/images/filename.webp"
 *  - data-src = "/assets/images/filename.webp"
 *  - data-src = "https://…"
 * @param {string} filename
 * @param {string|undefined} dataPath
 * @returns {string}
 */
function buildFullPath(filename, dataPath) {
  if (!filename) return filename;

  // If filename already carries a path segment, respect it.
  if (filename.includes("/")) {
    return withBase(filename);
  }

  const path = dataPath || "assets/images";
  return withBase(`${path.replace(/\/$/, "")}/${filename}`);
}

/**
 * Convert "foo-600.webp" -> { base: "foo", ext: "webp" }
 * Returns null if it can't parse.
 * @param {string} filename
 * @returns {{base:string, ext:string}|null}
 */
function parseFilePattern(filename) {
  const m = filename.match(
    /^(.*?)(?:-mobile|-desktop)?-(\d+)\.(webp|jpe?g|png|avif)$/i
  );
  if (!m) {
    // Fallback: simple "name.ext"
    const m2 = filename.match(/^(.*)\.(webp|jpe?g|png|avif)$/i);
    return m2 ? { base: m2[1], ext: m2[2].toLowerCase() } : null;
  }
  return { base: m[1], ext: m[3].toLowerCase() };
}

/**
 * Processes images within a section and replaces them with <picture>.
 * @param {ParentNode} [section=document]
 * @returns {HTMLImageElement[]} processed <img> elements
 */
export function setupResponsiveImages(section = document) {
  const thumbs = section.querySelectorAll("img.thumb[data-src]");
  /** @type {HTMLImageElement[]} */
  const insertedImages = [];

  thumbs.forEach((img) => {
    try {
      const filename = img.getAttribute("data-src");
      const dataPath = img.getAttribute("data-path") || undefined;
      if (!filename) return;

      const parsed = parseFilePattern(filename);
      const picture = document.createElement("picture");

      if (parsed) {
        const widths = [300, 600, 900];
        const mimeMap = {
          webp: "image/webp",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          avif: "image/avif",
        };
        const ext = parsed.ext;
        const type = mimeMap[ext] || `image/${ext}`;

        const source = document.createElement("source");
        const srcset = widths
          .map(
            (w) =>
              buildFullPath(`${parsed.base}-${w}.${ext}`, dataPath) + ` ${w}w`
          )
          .join(", ");

        source.setAttribute("type", type);
        source.setAttribute("srcset", srcset);
        source.setAttribute(
          "sizes",
          "(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw"
        );
        picture.appendChild(source);
      }

      const fallback = document.createElement("img");
      fallback.loading =
        img.getAttribute("data-priority") === "eager" ? "eager" : "lazy";

      // Copy attributes except our data-* inputs
      [...img.attributes].forEach((attr) => {
        const n = attr.name;
        if (n !== "data-src" && n !== "data-path" && n !== "data-priority") {
          fallback.setAttribute(n, attr.value);
        }
      });

      // Blur → sharp
      fallback.style.opacity = "0";
      fallback.style.filter = "blur(10px)";
      fallback.style.transition = "opacity 0.4s ease, filter 0.4s ease";

      const container =
        img.closest(".work-item-wrapper") ||
        img.closest(".work-item") ||
        img.closest(".case-study-wrapper") ||
        img.parentElement;

      let loader;
      if (container) {
        loader = document.createElement("div");
        loader.className = "simple-mini-loader";
        container.appendChild(loader);
      }

      const removeLoader = () => {
        if (!loader) return;
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 400);
      };

      fallback.onload = () => {
        fallback.style.opacity = "1";
        fallback.style.filter = "blur(0)";
        removeLoader();
      };

      fallback.onerror = () => {
        if (!fallback.getAttribute("alt"))
          fallback.alt = "Image failed to load";
        removeLoader();
      };

      // If already cached
      setTimeout(() => {
        if (fallback.complete && fallback.naturalWidth) {
          fallback.style.opacity = "1";
          fallback.style.filter = "blur(0)";
          removeLoader();
        }
      }, 1200);

      picture.appendChild(fallback);
      img.replaceWith(picture);

      // Defer setting src so the loader appears first
      setTimeout(() => {
        const full = buildFullPath(filename, dataPath);
        fallback.src = full;
      }, 0);

      insertedImages.push(fallback);
    } catch {
      // ignore per-image failures
    }
  });

  return insertedImages;
}
