/**
 * index.js
 *
 * Main entry point for site initialization:
 * - Runs loader, wave and blob animations
 * - Applies Safari-specific fallbacks
 * - Handles section visibility events
 * - Sets up navigation, scroll effects, and interactions
 */

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
/**
 * Flag to check if the current browser is Safari.
 * Used for applying specific fallbacks and performance tweaks.
 * @constant {boolean}
 */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// --- Safari Fallback for Waves ---
/**
 * Replaces animated wave canvases with static fallback images
 * to avoid Safari rendering issues and high CPU usage.
 *
 * @function enableSafariWaveFallback
 * @returns {void}
 */
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
/**
 * Applies CSS `will-change` property on key animated elements
 * in Safari to improve rendering performance.
 *
 * @function addSafariWillChange
 * @returns {void}
 */
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
/**
 * Sequentially fades in images with a blur-to-sharp transition.
 * Waits until each image is loaded before revealing the next.
 *
 * @function revealImagesSequentially
 * @param {HTMLImageElement[]} images - Array of images to fade in.
 * @returns {void}
 */
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
/**
 * Listener for the custom "sectionVisible" event.
 * Triggers text animations, teal bars, and image fade-ins
 * whenever a section enters the viewport.
 *
 * @event sectionVisible
 * @param {CustomEvent<string>} e - Event with `detail` set to the section ID.
 */
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
/**
 * Observes the menu element for "open" class changes.
 * Runs dripping wave animation (non-Safari) and link animations when menu opens.
 *
 * @constant {MutationObserver}
 */
const menu = document.getElementById("menu");
if (menu) {
  const observer = new MutationObserver(() => {
    if (menu.classList.contains("open")) {
      if (!isSafari) animateMenuDrippingWaves();
      animateMenuLinks();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ["class"] });
}

// --- MAIN INIT ---
/**
 * Main initialization routine for the site.
 * Runs after DOM is ready: shows loader, applies Safari fallbacks,
 * starts wave/blob animations, sets up navigation and interactions.
 *
 * @event DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
  showLoader();

  // Safari fallback applied here
  if (isSafari) {
    gsap.ticker.fps(50);
    enableSafariWaveFallback();
  }

  setTimeout(() => {
    hideLoader();
    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    const wavesCanvas = document.getElementById("top-waves-canvas");
    if (wavesCanvas && !isSafari) {
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

  /**
   * Temporarily disables text selection during drag/touch interactions
   * (e.g., when dragging blobs).
   *
   * @function enableNoSelectDuringInteraction
   * @returns {void}
   */
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
