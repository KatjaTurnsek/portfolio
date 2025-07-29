import gsap from "gsap";
import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";
import { setupResponsiveImages } from "./responsiveImages.js";
import {
  animateWaveLine,
  insertWaveLines,
  animateCustomWaveLines,
  animateGooeyBlobs,
  enableInteractiveJellyBlob,
  animateTopDrippingWaves,
  animateMenuDrippingWaves,
  animateTealBars,
} from "./animations.js";
import {
  initSections,
  revealSection,
  setupNavigation,
  setupCaseStudyScroll,
  setupScrollTopLinks,
  setupHeaderScrollEffect,
} from "./init.js";
import { animateTextInSection, animateMenuLinks } from "./animatedTexts.js";

// --- Detect Safari ---
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// --- Safari Fallback for Waves ---
function enableSafariWaveFallback() {
  // Hide animated canvases
  const topCanvas = document.getElementById("top-waves-canvas");
  if (topCanvas) topCanvas.style.display = "none";

  const menuCanvas = document.getElementById("menu-waves-canvas");
  if (menuCanvas) menuCanvas.style.display = "none";

  // Show static fallback waves
  const topWaves = document.querySelector(".top-waves");
  if (topWaves) topWaves.style.display = "block";

  const menuWaves = document.querySelector(".menu-waves");
  if (menuWaves) menuWaves.style.display = "block";
}

// --- Safari-specific will-change optimization ---
function addSafariWillChange() {
  if (!isSafari) return;
  const selectors = [
    ".blob-group",
    ".blob",
    ".bar-bg",
    ".bar-1",
    ".bar-2",
    ".bar-3",
    ".bar-label",
    ".wavy-line",
    ".wavy-polyline",
    "#top-waves-canvas",
    "#menu-waves-canvas",
    ".top-waves img",
    ".menu-waves img",
  ];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.willChange = "transform, opacity";
    });
  });
}

// --- Fade-in utility for images ---
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
      img.onerror = () => loadNext(index + 1);
    }
  };
  loadNext(0);
};

// --- Handle sectionVisible custom event ---
document.addEventListener("sectionVisible", (e) => {
  const sectionId = e.detail;
  const section = document.getElementById(sectionId);
  if (!section) return;

  if (sectionId === "about") {
    animateTealBars();
  }

  animateTextInSection(section);
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

// --- Animate menu waves when opened ---
const menu = document.getElementById("menu");
if (menu) {
  const observer = new MutationObserver(() => {
    if (menu.classList.contains("open")) {
      if (!isSafari) animateMenuDrippingWaves(); // Skip for Safari
      animateMenuLinks();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ["class"] });
}

// --- MAIN INIT ---
document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
  showLoader();

  // Safari fallback applied here
  if (isSafari) {
    gsap.ticker.fps(50); // Limit FPS to reduce CPU strain
    enableSafariWaveFallback();
  }

  setTimeout(() => {
    hideLoader();
    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const wavesCanvas = document.getElementById("top-waves-canvas");
    if (wavesCanvas && !isSafari) {
      // Skip animateTopDrippingWaves for Safari (using static WebP waves)
      gsap.fromTo(
        wavesCanvas,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          ease: "power2.out",
          onStart: animateTopDrippingWaves,
        }
      );
    }

    const blobWrapper = document.querySelector(".morphing-blob-wrapper");
    if (blobWrapper) {
      gsap.fromTo(
        blobWrapper,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.8,
          ease: "power2.out",
          onStart: () => {
            animateGooeyBlobs();
            enableInteractiveJellyBlob();
          },
        }
      );
    }
  }, 1500);

  function enableNoSelectDuringInteraction() {
    const body = document.body;
    const addNoSelect = () => body.classList.add("no-select");
    const removeNoSelect = () => body.classList.remove("no-select");

    document.addEventListener("mousedown", addNoSelect);
    document.addEventListener("mouseup", removeNoSelect);
    document.addEventListener("touchstart", addNoSelect);
    document.addEventListener("touchend", removeNoSelect);
  }

  const hireBtn = document.getElementById("hireBtn");
  if (hireBtn) {
    hireBtn.addEventListener("click", () => {
      const contact = document.getElementById("contact");
      if (contact) {
        contact.scrollIntoView({ behavior: "smooth" });
        revealSection("contact");
      }
    });
  }

  initSections();
  setupNavigation();
  setupCaseStudyScroll();
  setupScrollTopLinks();
  setupHeaderScrollEffect();
  enableNoSelectDuringInteraction();

  // Apply Safari-specific performance tweaks
  addSafariWillChange();
});
