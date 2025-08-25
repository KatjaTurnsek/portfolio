/**
 * init.js
 *
 * Handles fullscreen section initialization and navigation:
 * - Reveals sections and dispatches `sectionVisible` events
 * - Handles anchor link navigation with smooth scrolling
 * - Adjusts scroll for case studies with header offset
 * - Enables scroll-to-top links
 * - Applies header scroll effect (adds `.scrolled` class)
 */

import gsap from "gsap";

/**
 * Reveals a fullscreen section by fading/sliding it in
 * and dispatches a `sectionVisible` event for animations.
 *
 * @function revealSection
 * @param {string} targetId - The id of the section element to reveal.
 * @returns {void}
 */
export function revealSection(targetId) {
  const section = document.getElementById(targetId);
  if (!section || section.classList.contains("visible")) return;

  gsap.to(section, {
    duration: 0.8,
    opacity: 1,
    y: 0,
    onStart: () => {
      section.classList.add("visible");
      section.style.pointerEvents = "auto";

      document.dispatchEvent(
        new CustomEvent("sectionVisible", { detail: targetId })
      );
    },
  });
}

/**
 * Initializes all fullscreen sections:
 * - Hides sections initially
 * - Reveals either the home section or the hash-targeted section
 *   after the loader delay
 * - Dispatches `sectionVisible` event for the initial section
 *
 * @function initSections
 * @returns {void}
 */
export function initSections() {
  const sections = document.querySelectorAll(".fullscreen-section");
  const home = document.getElementById("home");

  sections.forEach((section) => {
    section.style.opacity = 0;
    section.style.transform = "translateY(50px)";
    section.style.pointerEvents = "none";
  });

  const hash = window.location.hash?.substring(1);
  const initialTarget = document.getElementById(hash) || home;

  if (initialTarget) {
    setTimeout(() => {
      gsap.to(initialTarget, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        onStart: () => {
          initialTarget.classList.add("visible");
          initialTarget.style.pointerEvents = "auto";

          requestAnimationFrame(() => {
            document.dispatchEvent(
              new CustomEvent("sectionVisible", { detail: initialTarget.id })
            );
          });

          if (hash && initialTarget.id === hash) {
            initialTarget.scrollIntoView({ behavior: "auto" });
          }
        },
      });
    }, 1700);
  }
}

/**
 * Sets up smooth scrolling and section reveals
 * for all anchor links with `href="#id"`.
 *
 * @function setupNavigation
 * @returns {void}
 */
export function setupNavigation() {
  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
        revealSection(targetId);
      }
    });
  });
}

/**
 * Handles scrolling to case study sections (linked by `.work-link`).
 * Accounts for header offset and reveals the target section before scrolling.
 *
 * @function setupCaseStudyScroll
 * @returns {void}
 */
export function setupCaseStudyScroll() {
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
}

/**
 * Enables "scroll to top" links within sections.
 * Uses `a[data-scrolltop]` with hash targets.
 *
 * @function setupScrollTopLinks
 * @returns {void}
 */
export function setupScrollTopLinks() {
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
}

/**
 * Toggles `.scrolled` class on header
 * when the page is scrolled more than 10px.
 *
 * @function setupHeaderScrollEffect
 * @returns {void}
 */
export function setupHeaderScrollEffect() {
  const header = document.querySelector("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}
