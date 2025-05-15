import gsap from "gsap";
import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";
import { animateWaveLine, insertWaveLines } from "./animations.js";

// GSAP animate-in function
const revealSection = (targetId) => {
  const section = document.getElementById(targetId);

  if (section && !section.classList.contains("visible")) {
    gsap.to(section, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      onStart: () => {
        section.classList.add("visible");
        section.style.pointerEvents = "auto";
      },
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Wavy SVG under all h2s
  insertWaveLines();

  // Init GSAP wave animation
  animateWaveLine();

  // Init menu toggle
  setupMenuToggle();

  // Show loader
  showLoader();
  setTimeout(hideLoader, 3000);

  // Initial section setup
  const allSections = document.querySelectorAll(".fullscreen-section");
  const home = document.getElementById("home");

  allSections.forEach((section) => {
    section.style.opacity = 0;
    section.style.transform = "translateY(50px)";
    section.style.pointerEvents = "none";
  });

  if (home) {
    gsap.set(home, { opacity: 1, y: 0 });
    home.classList.add("visible");
    home.style.pointerEvents = "auto";
  }

  // Smooth scroll and reveal on nav click
  const navLinks = document.querySelectorAll("a[href^='#']");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      revealSection(targetId);
    });
  });

  // Scroll-based header effect
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
});
