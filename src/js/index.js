import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";

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
  setupMenuToggle();

  // Combine both header and fullscreen menu links here
  const navLinks = document.querySelectorAll("a[href^='#']");
  const allSections = document.querySelectorAll(".fullscreen-section");

  // Set all sections to hidden initially
  allSections.forEach((section) => {
    section.style.opacity = 0;
    section.style.transform = "translateY(50px)";
    section.style.pointerEvents = "none";
  });

  // Show home section immediately
  const home = document.getElementById("home");
  if (home) {
    gsap.set(home, { opacity: 1, y: 0 });
    home.classList.add("visible");
    home.style.pointerEvents = "auto";
  }

  // Handle both header and fullscreen-menu links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);

      // Scroll to target section
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });

      // Animate in the section if not already visible
      revealSection(targetId);
    });
  });
});

// Loader functionality
window.addEventListener("DOMContentLoaded", () => {
  showLoader();
  setTimeout(() => {
    hideLoader();
  }, 3000);
});

// Scroll effect on header
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
