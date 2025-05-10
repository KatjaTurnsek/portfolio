export function setupMenuToggle() {
  try {
    const menuToggle = document.getElementById("menuToggle");
    const menuClose = document.getElementById("menuClose");
    const menu = document.getElementById("menu");

    if (!menuToggle || !menuClose || !menu) return;

    function openMenu() {
      try {
        menu.classList.add("open");
        menu.removeAttribute("inert");
        menuToggle.classList.add("opened");
        menuToggle.style.display = "none";
        menuClose.focus();
      } catch (_) {}
    }

    function closeMenu() {
      try {
        menu.classList.remove("open");
        menu.setAttribute("inert", "");
        menuToggle.style.display = "inline-block";
        menuToggle.classList.remove("opened");
        menuToggle.focus();
      } catch (_) {}
    }

    menuToggle.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      try {
        if (e.key === "Escape" && menu.classList.contains("open")) {
          closeMenu();
        }
      } catch (_) {}
    });

    const navLinks = menu.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setTimeout(closeMenu, 100);
      });
    });
  } catch (_) {}
}
