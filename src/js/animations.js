import { gsap } from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";
import { ScrollTrigger } from "../../node_modules/gsap/ScrollTrigger.js";

gsap.registerPlugin(MorphSVGPlugin);
gsap.registerPlugin(ScrollTrigger);

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

export function animateCustomWaveLines() {
  const wavePaths = document.querySelectorAll(
    ".custom-wave-line .wavy-line path"
  );

  wavePaths.forEach((path) => {
    gsap.to(path, {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      morphSVG: {
        shape: "M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15",
      },
    });
  });
}

export function animateTealBars() {
  const timeline = gsap.timeline();

  // Step 1: Animate 3 background bars (staggered slowly and smoothly)
  timeline.to(".bar-bg", {
    width: "100%",
    duration: 1.5,
    stagger: 1, // 3 bars = total 3s of background animation
    ease: "power4.out",
  });

  // Step 2: Animate foreground teal bars (start before all backgrounds are done)
  timeline.to(
    ".bar-1",
    {
      width: "90%",
      duration: 1,
      ease: "power4.out",
    },
    "<+0.5" // start 0.5s after last tween starts (not at the end)
  );

  timeline.to(
    ".bar-2",
    {
      width: "70%",
      duration: 1,
      ease: "power4.out",
    },
    "-=0.6"
  );

  timeline.to(
    ".bar-3",
    {
      width: "80%",
      duration: 1,
      ease: "power4.out",
    },
    "-=0.6"
  );

  // Step 3: Fade in labels after bars begin animating
  timeline.to(
    ".bar-label",
    {
      opacity: 1,
      duration: 1.2,
      ease: "power2.out",
      stagger: 0.2,
    },
    "-=0.4" // Start while last bar is still animating
  );
}
