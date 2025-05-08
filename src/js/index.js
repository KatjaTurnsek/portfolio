import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";

window.addEventListener("DOMContentLoaded", () => {
  showLoader();

  // Always hide after delay (simulate content load)
  setTimeout(() => {
    hideLoader();
  }, 3000);
});
