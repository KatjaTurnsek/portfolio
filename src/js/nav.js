export function setupMenuToggle() {
  try {
    const menuToggle = document.getElementById("menuToggle");
    const menuClose = document.getElementById("menuClose");
    const menu = document.getElementById("menu");

    if (!menuToggle || !menuClose || !menu) return;

    function openMenu() {
      try {
        menu.classList.remove("animating-out");
        menu.classList.add("open", "animating-in");
        menu.removeAttribute("inert");
        menuToggle.classList.add("opened");
        menuToggle.style.display = "none";
        menuClose.focus();

        setTimeout(() => {
          menu.classList.remove("animating-in");
        }, 1000);
      } catch (_) {}
    }

    function closeMenu() {
      try {
        menu.classList.add("animating-out");
        menu.setAttribute("inert", "");
        menuToggle.style.display = "inline-block";
        menuToggle.classList.remove("opened");
        menuToggle.focus();

        setTimeout(() => {
          menu.classList.remove("open", "animating-out");
        }, 600);
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
