import gsap from "gsap";

// Reveal a section and trigger animations
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

// Initialize all sections and reveal home or hash section (after loader delay)
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
    // Wait for loader to finish before showing the section
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
            // Scroll to it only if it's not home
            initialTarget.scrollIntoView({ behavior: "auto" });
          }
        },
      });
    }, 1700);
  }
}

// Smooth scroll and reveal on anchor click
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

// Reveal and scroll to case studies with header offset
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

// Scroll to top of section with data-scrolltop
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

// Toggle header class when scrolled
export function setupHeaderScrollEffect() {
  const header = document.querySelector("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  });
}
