/**
 * @file init.js
 * @description Router-friendly section initialization and reveal utilities.
 * Exposes `revealSection` (also on `window`) and keeps legacy hash navigation
 * helpers no-op when the History-API router is active.
 */

import gsap from "gsap";

/**
 * Reveals a section with a fade/slide animation and emits `sectionVisible`.
 * @param {string} targetId - Target section element id.
 * @returns {void}
 */
export function revealSection(targetId) {
  const section = document.getElementById(targetId);
  if (!section || section.classList.contains("visible")) return;

  section.style.display = "block";
  section.style.visibility = "visible";
  section.style.pointerEvents = "auto";

  gsap.to(section, {
    duration: 0.8,
    opacity: 1,
    y: 0,
    ease: "power2.out",
    onStart: () => {
      section.classList.add("visible");
      document.dispatchEvent(
        new CustomEvent("sectionVisible", { detail: targetId })
      );
    },
  });
}

/** Make `revealSection` callable from non-module code (router). */
if (typeof window !== "undefined") window.revealSection = revealSection;

/**
 * Initializes sections for non-router mode:
 * hides all, then reveals #home.
 * No-ops when the router is active.
 * @returns {void}
 */
export function initSections() {
  if (window.__routerActive) return;

  const sections = document.querySelectorAll(".fullscreen-section");
  const home = document.getElementById("home");

  sections.forEach((section) => {
    section.style.display = "none";
    section.style.opacity = 0;
    section.style.transform = "translateY(50px)";
    section.style.visibility = "hidden";
    section.style.pointerEvents = "none";
    section.classList.remove("visible");
  });

  if (home) {
    home.style.display = "block";
    home.style.visibility = "visible";
    home.style.pointerEvents = "auto";
    gsap.to(home, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.out",
      onStart: () => {
        home.classList.add("visible");
        document.dispatchEvent(
          new CustomEvent("sectionVisible", { detail: "home" })
        );
      },
    });
  }
}

/**
 * Legacy hash navigation (disabled when router is active).
 * @returns {void}
 */
export function setupNavigation() {
  if (window.__routerActive) return;
  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href")?.slice(1);
      if (!targetId) return;
      revealSection(targetId);
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/**
 * Legacy case-study scroller with header offset (disabled when router is active).
 * @returns {void}
 */
export function setupCaseStudyScroll() {
  if (window.__routerActive) return;
  const header = document.querySelector("header");
  document.querySelectorAll(".work-link[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href")?.slice(1);
      const section = targetId && document.getElementById(targetId);
      if (!section) return;

      revealSection(targetId);
      const top =
        section.getBoundingClientRect().top +
        window.scrollY -
        ((header && header.offsetHeight) || 0);
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

/**
 * Legacy "scroll to top" links (disabled when router is active).
 * @returns {void}
 */
export function setupScrollTopLinks() {
  if (window.__routerActive) return;
  document.querySelectorAll("a[data-scrolltop]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;
      e.preventDefault();
      const targetId = href.slice(1);
      const section = document.getElementById(targetId);
      if (!section) return;

      revealSection(targetId);
      window.scrollTo({ top: section.offsetTop, behavior: "smooth" });
      section.scrollTop = 0;
    });
  });
}

/**
 * Adds/removes `.scrolled` on the header based on scroll position.
 * @returns {void}
 */
export function setupHeaderScrollEffect() {
  const header = document.querySelector("header");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
