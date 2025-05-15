import { gsap } from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";

gsap.registerPlugin(MorphSVGPlugin);

export function animateWaveLine() {
  const original = "M0,15 C50,5 100,25 150,15 S250,25 300,15 S400,5 500,15";
  const alt = "M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15";

  gsap.to("#wavy-line path", {
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    morphSVG: {
      shape: "M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15",
    },
  });
}

export function insertWaveLines() {
  const waveSVG = `
     <svg id="wavy-line" class="wavy-line" viewBox="0 0 500 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path id="wavy-path" d="M0,15 C50,5 100,25 150,15 S250,25 300,15 S400,5 500,15"></svg>
  `;

  const headings = document.querySelectorAll("h2");

  headings.forEach((heading) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = waveSVG;
    heading.insertAdjacentElement("afterend", wrapper.firstElementChild);
  });
}
