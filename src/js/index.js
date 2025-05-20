import gsap from "gsap";
import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";
import { setupResponsiveImages } from "./responsiveImages.js";
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  animateTealBars,
} from "./animations.js";

// Reveal section with GSAP
const revealSection = (targetId) => {
  try {
    const section = document.getElementById(targetId);
    if (!section || section.classList.contains("visible")) return;

    gsap.to(section, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      onStart: () => {
        section.classList.add("visible");
        section.style.pointerEvents = "auto";

        // Trigger bar animation when about section is revealed
        if (targetId === "about") {
          animateTealBars();
        }
      },
    });
  } catch (e) {
    // Silent failure — no user disruption
  }
};

// Init sections hidden
const initSections = () => {
  try {
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
  } catch (e) {
    // Safe fail
  }
};

// Navigation click handling
const setupNavigation = () => {
  try {
    const navLinks = document.querySelectorAll("a[href^='#']");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth" });
        revealSection(targetId);
      });
    });
  } catch (e) {
    // Ignore gracefully
  }
};

// Case study scroll-to-top
const setupCaseStudyScroll = () => {
  try {
    const caseLinks = document.querySelectorAll(".work-link[href^='#']");
    const header = document.querySelector("header");

    caseLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const section = document.getElementById(targetId);

        if (section) {
          revealSection(targetId);

          const scrollToSection = () => {
            const headerOffset = header ? header.offsetHeight : 0;
            const elementTop =
              section.getBoundingClientRect().top + window.scrollY;
            const offsetTop = elementTop - headerOffset;

            window.scrollTo({
              top: offsetTop,
              behavior: "smooth",
            });
          };

          const observer = new IntersectionObserver(
            (entries, obs) => {
              if (entries[0].isIntersecting) {
                scrollToSection();
                obs.disconnect();
              }
            },
            { threshold: 0.1 }
          );

          observer.observe(section);
        }
      });
    });
  } catch (e) {
    // silent fail
  }
};

// Scroll-based header class
const setupHeaderScrollEffect = () => {
  try {
    const header = document.querySelector("header");
    if (!header) return;

    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    });
  } catch (e) {
    // Silent error
  }
};

document.addEventListener("DOMContentLoaded", () => {
  try {
    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();
  } catch (e) {}

  try {
    setupMenuToggle();
  } catch (e) {}

  try {
    setupResponsiveImages();
  } catch (e) {}

  try {
    showLoader();
    setTimeout(hideLoader, 3000);
  } catch (e) {}

  try {
    initSections();
    setupNavigation();
    setupCaseStudyScroll();
    setupHeaderScrollEffect();
  } catch (e) {}
});
