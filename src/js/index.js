import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";

// Set up menu toggle functionality
document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
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
