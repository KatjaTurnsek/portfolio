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

      [...img.attributes].forEach((attr) => {
        if (attr.name !== "data-src" && attr.name !== "data-path") {
          fallback.setAttribute(attr.name, attr.value);
        }
      });

      fallback.style.opacity = 0;
      fallback.style.filter = "blur(10px)";
      fallback.style.transition = "opacity 0.4s ease, filter 0.4s ease";

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

      setTimeout(() => {
        fallback.src = fullPath;
      }, 0);

      insertedImages.push(fallback);
    } catch (e) {
      // fail silently per image
    }
  });

  return insertedImages;
}
