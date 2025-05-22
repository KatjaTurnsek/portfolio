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

        if (targetId === "about") {
          animateTealBars();
        }
      },
    });
  } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
};

// Global scroll-to-top for any link with data-scrolltop
const setupScrollTopLinks = () => {
  const scrollLinks = document.querySelectorAll("a[data-scrolltop]");

  scrollLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const targetId = href.substring(1);
      const section = document.getElementById(targetId);
      if (!section) return;

      e.preventDefault();
      revealSection(targetId);

      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth",
      });

      section.scrollTop = 0;
    });
  });
};

// Header scroll effect
const setupHeaderScrollEffect = () => {
  try {
    const header = document.querySelector("header");
    if (!header) return;

    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    });
  } catch (e) {}
};

// Sequential fade-in loader for images
const revealImagesSequentially = (images) => {
  let delay = 0;

  const loadNext = (index) => {
    if (index >= images.length) return;

    const img = images[index];
    if (img.complete) {
      fadeIn(img, () => loadNext(index + 1));
    } else {
      img.onload = () => fadeIn(img, () => loadNext(index + 1));
    }
  };

  const fadeIn = (img, callback) => {
    gsap.to(img, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.5,
      delay,
      ease: "power2.out",
      onComplete: callback,
    });
    delay += 0.075;
  };

  loadNext(0);
};

document.addEventListener("DOMContentLoaded", () => {
  insertWaveLines();
  animateWaveLine();
  animateCustomWaveLines();
  setupMenuToggle();

  const responsiveImgs = setupResponsiveImages();

  showLoader();
  setTimeout(hideLoader, 3000);

  initSections();
  setupNavigation();
  setupCaseStudyScroll();
  setupScrollTopLinks();
  setupHeaderScrollEffect();

  // Load images one by one in sequence
  revealImagesSequentially(responsiveImgs);
});
