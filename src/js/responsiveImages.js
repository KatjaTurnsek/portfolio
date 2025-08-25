/**
 * responsiveImages.js
 *
 * Handles responsive image replacement and mini loaders:
 * - Replaces `<img class="thumb" data-src="...">` with `<picture>`
 * - Adds multiple formats (webp/jpg/png) and responsive srcsets
 * - Applies blur → sharp fade-in
 * - Displays a minimal loader until each image finishes loading
 */

/**
 * Processes images within a section and replaces them with <picture>.
 *
 * @param {ParentNode} [section=document] - DOM scope to search in.
 * @returns {HTMLImageElement[]} List of processed <img> elements.
 */
export function setupResponsiveImages(section = document) {
  const thumbs = section.querySelectorAll("img.thumb[data-src]");
  const insertedImages = [];

  thumbs.forEach((img) => {
    try {
      const filename = img.dataset.src;
      const path = img.dataset.path || "assets/images";
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
      fallback.loading = img.dataset.priority === "eager" ? "eager" : "lazy";

      // Copy attributes except data-src/path
      [...img.attributes].forEach((attr) => {
        if (attr.name !== "data-src" && attr.name !== "data-path") {
          fallback.setAttribute(attr.name, attr.value);
        }
      });

      // Blur → sharp transition
      fallback.style.opacity = 0;
      fallback.style.filter = "blur(10px)";
      fallback.style.transition = "opacity 0.4s ease, filter 0.4s ease";

      // Choose a sensible container for the mini loader
      const container =
        img.closest(".work-item-wrapper") ||
        img.closest(".work-item") ||
        img.closest(".case-study-wrapper") ||
        img.parentElement;

      if (container) {
        const loader = document.createElement("div");
        loader.className = "simple-mini-loader";
        container.appendChild(loader);

        const removeLoader = () => {
          loader.classList.add("fade-out");
          setTimeout(() => loader.remove(), 400);
        };

        fallback.onload = () => {
          fallback.style.opacity = 1;
          fallback.style.filter = "blur(0)";
          removeLoader();
        };

        fallback.onerror = () => {
          fallback.alt = "Image failed to load";
          removeLoader();
        };

        // In case image is already cached/complete
        setTimeout(() => {
          if (fallback.complete && fallback.naturalWidth !== 0) {
            fallback.style.opacity = 1;
            fallback.style.filter = "blur(0)";
            removeLoader();
          }
        }, 1500);
      }

      picture.appendChild(fallback);
      img.replaceWith(picture);

      // Defer setting src to allow loader to mount first
      setTimeout(() => {
        fallback.src = fullPath;
      }, 0);

      insertedImages.push(fallback);
    } catch {
      // fail silently per image
    }
  });

  return insertedImages;
}
