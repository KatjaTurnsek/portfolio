import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";

document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
});

window.addEventListener("DOMContentLoaded", () => {
  showLoader();

  // Always hide after delay (simulate content load)
  setTimeout(() => {
    hideLoader();
  }, 3000);
});

window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (window.scrollY > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
