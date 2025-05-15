import gsap from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";

gsap.registerPlugin(MorphSVGPlugin);

// Paths for the morph animation
const originalPath = "M0,10 C50,0 100,20 150,10 S250,20 300,10 S400,0 500,10";
const morphPath = "M0,10 C50,20 100,0 150,10 S250,0 300,10 S400,20 500,10";

// Programmatically create loader markup
function createLoader() {
  const loader = document.createElement("div");
  loader.className = "loader";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 500 20");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("class", "wave");
  path.setAttribute("d", originalPath);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1");

  svg.appendChild(path);
  spinner.appendChild(svg);
  loader.appendChild(spinner);
  document.body.appendChild(loader);
}

// Animate the wave using GSAP + MorphSVG
function animateWave() {
  const path = document.querySelector(".wave");
  if (!path) return;

  gsap.to(path, {
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    morphSVG: morphPath,
  });
}

// Show loader and trigger animation
export function showLoader() {
  let loader = document.querySelector(".loader");
  if (!loader) {
    createLoader();
    loader = document.querySelector(".loader");
  }

  loader.classList.remove("hidden");
  animateWave();
}

// Hide loader
export function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.classList.add("hidden");
  }
}
