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
import { animateTextInSection } from "./animatedTexts.js";

// Fade-in utility for images
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

// Handle sectionVisible custom event
document.addEventListener("sectionVisible", (e) => {
  const sectionId = e.detail;
  const section = document.getElementById(sectionId);
  if (!section) return;

  // About-specific animation
  if (sectionId === "about") {
    animateTealBars();
  }

  // Animate text
  animateTextInSection(section);

  // Animate images
  const loadedImages = setupResponsiveImages(section);
  revealImagesSequentially(loadedImages);
});

// Animate menu waves when opened
const menu = document.getElementById("menu");
if (menu) {
  const observer = new MutationObserver(() => {
    if (menu.classList.contains("open")) {
      animateMenuDrippingWaves();
    }
  });
  observer.observe(menu, { attributes: true, attributeFilter: ["class"] });
}

// ✅ MAIN INIT
document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
  showLoader();

  setTimeout(() => {
    hideLoader();
    insertWaveLines();
    animateWaveLine();
    animateCustomWaveLines();

    // 1. Fade in dripping waves slightly earlier
    const wavesCanvas = document.getElementById("top-waves-canvas");
    if (wavesCanvas) {
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

    // 2. Fade in gooey blobs slightly later
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
});
