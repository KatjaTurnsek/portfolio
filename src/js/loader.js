/**
 * loader.js
 *
 * Implements both global and per-image loaders:
 * - Global site loader with animated wave polyline
 * - Mini 3-dot loaders for thumbnails with blur→sharp transition
 * - Responsive image setup with <picture> sources and breakpoints
 */

import gsap from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";

gsap.registerPlugin(MorphSVGPlugin);

const originalPath = "M0,10 C50,0 100,20 150,10 S250,20 300,10 S400,0 500,10";
const morphPath = "M0,10 C50,20 100,0 150,10 S250,0 300,10 S400,20 500,10";

/**
 * Creates and injects the global loader element into the DOM.
 * Loader consists of a `.loader` container with a `.spinner` and
 * a wave polyline SVG inside it.
 *
 * @function createLoader
 * @returns {void}
 */
function createLoader() {
  const loader = document.createElement("div");
  loader.className = "loader";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 500 20");

  const path = document.createElementNS(svgNS, "polyline");
  path.setAttribute("points", "");
  path.setAttribute("class", "wave-global");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1");
  path.setAttribute("vector-effect", "non-scaling-stroke");

  svg.appendChild(path);
  spinner.appendChild(svg);
  loader.appendChild(spinner);
  document.body.appendChild(loader);
}

/**
 * Animates the polyline inside `.wave-global` to produce
 * a continuous wave motion for the global loader.
 *
 * @function animateWave
 * @returns {void}
 */
function animateWave() {
  const path = document.querySelector(".wave-global");
  if (!path || !path.points) return;

  const width = 500;
  const segments = 80;
  const amplitude = 10;
  const frequency = 4;
  const interval = width / segments;

  const svg = path.ownerSVGElement;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const norm = i / segments;
    const pt = svg.createSVGPoint();
    pt.x = i * interval;
    pt.y = 10;
    path.points.appendItem(pt);

    points[i] = {
      ref: pt,
      tween: gsap
        .to(pt, {
          y: 10 - amplitude,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
        .progress(norm * frequency),
    };
  }
}

/**
 * Displays the global loader. Creates it if not already present
 * and starts the wave animation.
 *
 * @function showLoader
 * @returns {void}
 */
export function showLoader() {
  let loader = document.querySelector(".loader");
  if (!loader) {
    createLoader();
    loader = document.querySelector(".loader");
  }
  loader.classList.remove("hidden");
  animateWave();
}

/**
 * Hides the global loader by adding `.hidden` class.
 *
 * @function hideLoader
 * @returns {void}
 */
export function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.classList.add("hidden");
  }
}

/**
 * Finds the nearest parent container with `position: relative`
 * to correctly position a mini loader.
 *
 * @function findRelativeContainer
 * @param {HTMLElement} img - The image element to check from.
 * @returns {HTMLElement} The relative container or the image parent.
 */
function findRelativeContainer(img) {
  let el = img.parentElement;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (style.position === "relative") return el;
    el = el.parentElement;
  }
  return img.parentElement; // fallback
}

/**
 * Attaches a mini loader (3-dot pulsing animation) to an image.
 * Removes the loader once the image has loaded or failed.
 *
 * @function attachMiniLoaderToImg
 * @param {HTMLImageElement} img - The image element to attach the loader to.
 * @param {string} fullPath - The image source path.
 * @returns {void}
 */
export function attachMiniLoaderToImg(img, fullPath) {
  try {
    const container = findRelativeContainer(img);
    if (!container) return;

    const loader = document.createElement("div");
    loader.className = "simple-mini-loader";

    for (let i = 0; i < 3; i++) {
      loader.appendChild(document.createElement("span"));
    }

    container.appendChild(loader);

    const removeLoader = () => {
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 500);
    };

    if (img.complete && img.naturalWidth !== 0) {
      setTimeout(removeLoader, 1000);
    } else {
      img.addEventListener("load", removeLoader);
      img.addEventListener("error", () => {
        removeLoader();
        img.alt = "Image failed to load";
      });
    }

    img.src = fullPath;
  } catch {
    // Silent fail in production
  }
}

/**
 * Sets up responsive images by:
 * - Replacing `<img>` tags with `<picture>` for multiple formats (webp/jpg/png)
 * - Adding size breakpoints
 * - Attaching mini loaders while images load
 *
 * Expects `<img class="thumb" data-src="...">` elements in the DOM.
 *
 * @function setupResponsiveImages
 * @returns {HTMLImageElement[]} Array of newly inserted fallback `<img>` elements.
 */
export function setupResponsiveImages() {
  const thumbs = document.querySelectorAll("img.thumb[data-src]");
  const insertedImages = [];

  thumbs.forEach((originalImg) => {
    try {
      const filename = originalImg.dataset.src;
      const path = originalImg.dataset.path || "assets/images";
      if (!filename) return;

      const fullPath = `${path}/${filename}`;
      const baseMatch = filename.match(
        /^(.*?)(?:-mobile|-desktop)?-\d+\.(webp|jpg|png)$/
      );
      const baseName = baseMatch ? baseMatch[1] : null;

      const picture = document.createElement("picture");

      if (baseName) {
        const formats = ["webp", "jpg", "png"];
        const sizes = [
          { width: 300, descriptor: "300w" },
          { width: 600, descriptor: "600w" },
          { width: 900, descriptor: "900w" },
        ];

        formats.forEach((format) => {
          const source = document.createElement("source");
          const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;

          const srcset = sizes
            .map(
              (s) => `${path}/${baseName}-${s.width}.${format} ${s.descriptor}`
            )
            .join(", ");

          source.setAttribute("type", mime);
          source.setAttribute("srcset", srcset);
          source.setAttribute(
            "sizes",
            "(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw"
          );

          picture.appendChild(source);
        });
      }

      const fallback = document.createElement("img");
      fallback.loading =
        originalImg.dataset.priority === "eager" ? "eager" : "lazy";

      [...originalImg.attributes].forEach((attr) => {
        if (!["data-src", "data-path"].includes(attr.name)) {
          fallback.setAttribute(attr.name, attr.value);
        }
      });

      fallback.style.opacity = 0;
      fallback.style.filter = "blur(10px)";
      fallback.style.transition = "opacity 0.4s ease, filter 0.4s ease";

      fallback.onload = () => {
        fallback.style.opacity = 1;
        fallback.style.filter = "blur(0)";
      };

      picture.appendChild(fallback);
      originalImg.replaceWith(picture);

      attachMiniLoaderToImg(fallback, fullPath);
      insertedImages.push(fallback);
    } catch {
      // Skip problematic image
    }
  });

  return insertedImages;
}
