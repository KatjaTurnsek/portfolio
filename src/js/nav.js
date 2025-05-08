export function setupMenuToggle() {
  const menuToggle = document.getElementById("menuToggle");
  const menuClose = document.getElementById("menuClose");
  const menu = document.getElementById("menu");

  function openMenu() {
    menu.classList.add("open");
    menuToggle.style.display = "none";
  }

  function closeMenu() {
    menu.classList.remove("open");
    menuToggle.style.display = "inline-block";
  }

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
}
