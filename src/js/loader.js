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

// Create a mini loader for a single image
function createMiniLoader(img) {
  const wrapper = document.createElement("div");
  wrapper.className = "mini-loader-wrapper";

  const spinner = document.createElement("div");
  spinner.className = "mini-spinner";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 500 20");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("class", "wave-mini");
  path.setAttribute("d", originalPath);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1");

  svg.appendChild(path);
  spinner.appendChild(svg);
  wrapper.appendChild(spinner);

  // Style and position over the image
  wrapper.style.position = "absolute";
  wrapper.style.inset = 0;
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.pointerEvents = "none";

  const parent = img.parentElement;
  if (parent) {
    parent.style.position = "relative";
    parent.appendChild(wrapper);
    animateMiniWave(path);
  }

  return wrapper;
}

// Animate individual mini loader wave
function animateMiniWave(pathElement) {
  gsap.to(pathElement, {
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    morphSVG: morphPath,
  });
}

// Attach mini loaders to a list of images
export function attachMiniLoaders(images) {
  return images.map((img) => {
    const loader = createMiniLoader(img);

    if (img.complete) {
      loader.remove();
    } else {
      img.addEventListener("load", () => loader.remove());
      img.addEventListener("error", () => loader.remove());
    }

    return loader;
  });
}
