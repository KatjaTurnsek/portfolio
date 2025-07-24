const body = document.body;
const themeToggle = document.getElementById("theme-toggle");

// Function to update the switcher position (dark mode / light mode)
export function updateSwitcherPosition(isDark) {
  themeToggle.classList.toggle("dark-mode", isDark);
}

// Function to update the logo based on the theme
function updateLogo() {
  const isDark = document.body.classList.contains("dark-theme");
  const menuIsOpen = document.body.classList.contains("menu-open");

  document.querySelectorAll(".site-logo").forEach((logo) => {
    const isMenuLogo = logo.classList.contains("site-logo-menu");

    if (isMenuLogo) {
      // MENU LOGO
      logo.src = isDark
        ? "assets/images/logo-katjadev-light.svg"
        : "assets/images/logo-katjadev-dark.svg";
    } else {
      // HEADER LOGO
      logo.src = "assets/images/logo-katjadev-dark.svg";
    }
  });
}

// Handle theme loading and setting on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  // Check the stored theme preference or system preference
  const storedTheme = localStorage.getItem("theme");
  let isDark;

  if (storedTheme) {
    isDark = storedTheme === "dark"; // Use stored theme if it exists
  } else {
    // Default to system preference
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // Apply the theme to the body element
  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(isDark ? "dark-theme" : "light-theme");

  // Update the switcher and the logo after theme is set
  updateSwitcherPosition(isDark);
  updateLogo();
});

// Handle theme switching when the theme toggle button is clicked
themeToggle.addEventListener("click", () => {
  const isDark = body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";

  // Remove current theme and add the new one
  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(`${newTheme}-theme`);

  // Update the switcher position and logo
  updateSwitcherPosition(newTheme === "dark");
  updateLogo();

  // Save the selected theme in localStorage
  localStorage.setItem("theme", newTheme);
});
