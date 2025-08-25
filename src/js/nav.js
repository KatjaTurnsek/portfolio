/**
 * nav.js
 *
 * Handles fullscreen menu toggle and navigation:
 * - Opens/closes menu on button clicks or Escape key
 * - Smooth scrolls to anchors with header offset
 * - Closes menu after link click
 * - Ensures #home section is visible on page load
 */
export function setupMenuToggle() {
  try {
    const menuToggle = document.getElementById("menuToggle");
    const menuClose = document.getElementById("menuClose");
    const menu = document.getElementById("menu");

    if (!menuToggle || !menuClose || !menu) return;

    function openMenu() {
      menu.classList.add("open");
      menu.removeAttribute("inert");
      menuToggle.classList.add("opened");
      menuToggle.style.display = "none";
      menuClose.focus();
    }

    function closeMenu() {
      menu.classList.remove("open");
      menu.setAttribute("inert", "");
      menuToggle.style.display = "inline-block";
      menuToggle.classList.remove("opened");
      menuToggle.focus();
    }

    menuToggle.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
      }
    });

    // Smooth scroll for all anchor links
    const navLinks = document.querySelectorAll("a[href^='#']");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          const offsetTop =
            targetSection.getBoundingClientRect().top + window.scrollY;
          const header = document.querySelector("header");
          const headerHeight = header ? header.offsetHeight : 160;

          window.scrollTo({
            top: offsetTop - headerHeight + 10,
            behavior: "smooth",
          });

          // Mark target as visible
          setTimeout(() => {
            document
              .querySelectorAll(".fullscreen-section")
              .forEach((section) => section.classList.remove("visible"));
            targetSection.classList.add("visible");
          }, 500);
        }

        setTimeout(closeMenu, 100);
      });
    });

    // Reveal #home section on page load
    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("home")?.classList.add("visible");
    });
  } catch (err) {
    console.error("Menu setup failed:", err);
  }
}
