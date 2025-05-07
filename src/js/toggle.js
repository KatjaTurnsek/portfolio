const body = document.body;
const themeToggle = document.getElementById("theme-toggle");

export function updateSwitcherPosition(isDark) {
  if (isDark) {
    themeToggle.classList.add("dark-mode");
  } else {
    themeToggle.classList.remove("dark-mode");
  }
}

themeToggle.addEventListener("click", () => {
  const isDark = body.classList.contains("dark-theme");
  body.classList.toggle("dark-theme", !isDark);
  body.classList.toggle("light-theme", isDark);
  updateSwitcherPosition(!isDark);
  localStorage.setItem("theme", !isDark ? "dark" : "light");
});

window.addEventListener("DOMContentLoaded", () => {
  const storedTheme = localStorage.getItem("theme");
  const isDark = storedTheme === "dark";
  if (storedTheme) {
    body.classList.remove("light-theme", "dark-theme");
    body.classList.add(`${storedTheme}-theme`);
    updateSwitcherPosition(isDark);
  }
});
