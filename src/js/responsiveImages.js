export function setupResponsiveImages() {
  const thumbs = document.querySelectorAll("img.thumb[data-img]");
  const insertedImages = [];

  thumbs.forEach((img) => {
    const base = img.dataset.img;
    const path = img.dataset.path || "assets/images";
    if (!base) return;

    const picture = document.createElement("picture");

    const formats = ["webp", "jpg", "png"];
    const sizes = [
      { width: 300, descriptor: "300w" },
      { width: 600, descriptor: "600w" },
      { width: 900, descriptor: "900w" },
    ];

    formats.forEach((format) => {
      const source = document.createElement("source");
      const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
      source.type = mime;

      const srcset = sizes
        .map((s) => `${path}/${base}-${s.width}.${format} ${s.descriptor}`)
        .join(", ");

      source.setAttribute("srcset", srcset);
      source.setAttribute(
        "sizes",
        "(min-width: 1024px) 30vw, (min-width: 600px) 45vw, 90vw"
      );

      picture.appendChild(source);
    });

    const fallback = document.createElement("img");
    fallback.src = `${path}/${base}-600.jpg`;
    fallback.loading = "lazy";
    fallback.alt = img.alt || "";
    fallback.className = img.className;
    fallback.width = img.width || 600;
    fallback.height = img.height || "auto";
    fallback.style.opacity = 0;
    fallback.style.filter = "blur(10px)";

    picture.appendChild(fallback);
    img.replaceWith(picture);
    insertedImages.push(fallback);
  });

  return insertedImages;
}
