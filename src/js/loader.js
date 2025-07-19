import gsap from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";

gsap.registerPlugin(MorphSVGPlugin);

const originalPath = "M0,10 C50,0 100,20 150,10 S250,20 300,10 S400,0 500,10";
const morphPath = "M0,10 C50,20 100,0 150,10 S250,0 300,10 S400,20 500,10";

// Create the global loader element
function createLoader() {
  const loader = document.createElement("div");
  loader.className = "loader";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 500 20");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("class", "wave-global");
  path.setAttribute("d", originalPath);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1");

  svg.appendChild(path);
  spinner.appendChild(svg);
  loader.appendChild(spinner);
  document.body.appendChild(loader);
}

// Animate the global loader wave
function animateWave() {
  const loader = document.querySelector(".loader");
  const path = loader?.querySelector(".wave-global");
  if (!path) return;

  gsap.to(path, {
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    morphSVG: morphPath,
  });
}

// Show the global loader
export function showLoader() {
  let loader = document.querySelector(".loader");
  if (!loader) {
    createLoader();
    loader = document.querySelector(".loader");
  }
  loader.classList.remove("hidden");
  animateWave();
}

// Hide the global loader
export function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.classList.add("hidden");
  }
}

// Find the closest container with position: relative
function findRelativeContainer(img) {
  let el = img.parentElement;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (style.position === "relative") return el;
    el = el.parentElement;
  }
  return img.parentElement; // fallback
}

// Attach mini loader to an image
export function attachMiniLoaderToImg(img, fullPath) {
  try {
    const container = findRelativeContainer(img);
    if (!container) return;

    const loader = document.createElement("div");
    loader.className = "simple-mini-loader";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      loader.appendChild(dot);
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
  } catch (e) {
    // Silent fallback in production
  }
}

// Attach mini loaders to a list of images
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
    } catch (e) {
      // Skip problematic image
    }
  });

  return insertedImages;
}
