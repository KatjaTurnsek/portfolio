export function setupResponsiveImages() {
  const thumbs = document.querySelectorAll("img.thumb[data-src]");
  const insertedImages = [];

  thumbs.forEach((img) => {
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
    fallback.src = fullPath;
    fallback.loading = img.dataset.priority === "eager" ? "eager" : "lazy";

    // Copy other attributes
    [...img.attributes].forEach((attr) => {
      if (attr.name !== "data-src" && attr.name !== "data-path") {
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
    img.replaceWith(picture);
    insertedImages.push(fallback);
  });

  return insertedImages;
}
