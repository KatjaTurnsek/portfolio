import gsap from "gsap";
import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { attachMiniLoaders } from "./loader.js";
import { setupMenuToggle } from "./nav.js";
import { setupResponsiveImages } from "./responsiveImages.js";
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  animateTealBars,
} from "./animations.js";

// Reveal section
const revealSection = (targetId) => {
  const section = document.getElementById(targetId);
  if (!section || section.classList.contains("visible")) return;

  gsap.to(section, {
    duration: 0.8,
    opacity: 1,
    y: 0,
    onStart: () => {
      section.classList.add("visible");
      section.style.pointerEvents = "auto";

      if (targetId === "about") animateTealBars();
    },
  });
};

// Init sections hidden except "home"
const initSections = () => {
  const sections = document.querySelectorAll(".fullscreen-section");
  const home = document.getElementById("home");

  sections.forEach((section) => {
    section.style.opacity = 0;
    section.style.transform = "translateY(50px)";
    section.style.pointerEvents = "none";
  });

  if (home) {
    gsap.set(home, { opacity: 1, y: 0 });
    home.classList.add("visible");
    home.style.pointerEvents = "auto";
  }
};

// Navigation click handling
const setupNavigation = () => {
  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      revealSection(targetId);
    });
  });
};

// Case study scroll-to-top
const setupCaseStudyScroll = () => {
  const header = document.querySelector("header");

  document.querySelectorAll(".work-link[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const section = document.getElementById(targetId);
      if (!section) return;

      revealSection(targetId);

      const scrollToSection = () => {
        const offset =
          section.getBoundingClientRect().top +
          window.scrollY -
          (header?.offsetHeight || 0);
        window.scrollTo({ top: offset, behavior: "smooth" });
      };

      const observer = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            scrollToSection();
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(section);
    });
  });
};

// Global scroll-to-top
const setupScrollTopLinks = () => {
  document.querySelectorAll("a[data-scrolltop]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const targetId = href.substring(1);
      const section = document.getElementById(targetId);
      if (!section) return;

      e.preventDefault();
      revealSection(targetId);

      window.scrollTo({ top: section.offsetTop, behavior: "smooth" });
      section.scrollTop = 0;
    });
  });
};

// Sticky header scroll effect
const setupHeaderScrollEffect = () => {
  const header = document.querySelector("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
};

// Sequential image fade-in
const revealImagesSequentially = (images) => {
  let delay = 0;

  const fadeIn = (img, onComplete) => {
    gsap.to(img, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.5,
      delay,
      ease: "power2.out",
      onComplete,
    });
    delay += 0.075;
  };

  const loadNext = (index) => {
    if (index >= images.length) return;

    const img = images[index];
    if (img.complete) {
      fadeIn(img, () => loadNext(index + 1));
    } else {
      img.onload = () => fadeIn(img, () => loadNext(index + 1));
    }
  };

  loadNext(0);
};

// Main init
document.addEventListener("DOMContentLoaded", () => {
  insertWaveLines();
  animateWaveLine();
  animateCustomWaveLines();
  setupMenuToggle();

  const responsiveImgs = setupResponsiveImages();
  const miniLoaders = attachMiniLoaders(responsiveImgs);

  showLoader();

  Promise.all(
    responsiveImgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = img.onerror = () => resolve();
          })
    )
  ).then(() => {
    setTimeout(() => {
      revealImagesSequentially(responsiveImgs);
      hideLoader();
    }, 1500);
  });

  initSections();
  setupNavigation();
  setupCaseStudyScroll();
  setupScrollTopLinks();
  setupHeaderScrollEffect();
});
