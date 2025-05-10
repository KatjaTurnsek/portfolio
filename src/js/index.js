import { updateSwitcherPosition } from "./toggle.js";
import { hideLoader, showLoader } from "./loader.js";
import { setupMenuToggle } from "./nav.js";

// Toggle
document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
});

// Loader
window.addEventListener("DOMContentLoaded", () => {
  showLoader();

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

// logo
const themeToggle = document.getElementById("theme-toggle");
const siteLogos = document.querySelectorAll(".site-logo");

function updateLogo() {
  const isDark = document.body.classList.contains("dark-theme");
  document.querySelectorAll(".site-logo").forEach((logo) => {
    logo.src = isDark
      ? "assets/images/logo-katjadev-light.svg"
      : "assets/images/logo-katjadev-dark.svg";
  });
}

// Set theme based on system preference if none is set
if (
  !document.documentElement.classList.contains("dark-theme") &&
  !document.documentElement.classList.contains("light-theme")
) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.add(
    prefersDark ? "dark-theme" : "light-theme"
  );
}

updateLogo();

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark-theme");
  document.documentElement.classList.toggle("light-theme");
  updateLogo();
});
