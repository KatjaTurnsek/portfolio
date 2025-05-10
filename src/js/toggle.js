const body = document.body;
const themeToggle = document.getElementById("theme-toggle");

export function updateSwitcherPosition(isDark) {
  themeToggle.classList.toggle("dark-mode", isDark);
}

window.addEventListener("DOMContentLoaded", () => {
  const storedTheme = localStorage.getItem("theme");
  let isDark;

  if (storedTheme) {
    isDark = storedTheme === "dark";
  } else {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(isDark ? "dark-theme" : "light-theme");
  updateSwitcherPosition(isDark);
});

themeToggle.addEventListener("click", () => {
  const isDark = body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";

  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(`${newTheme}-theme`);
  updateSwitcherPosition(newTheme === "dark");

  localStorage.setItem("theme", newTheme);
});
