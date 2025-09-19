// Restore the original deep link after GitHub Pages 404 redirect.
(function restoreGhRedirect() {
  const saved = sessionStorage.getItem("gh_redirect");
  if (saved) {
    sessionStorage.removeItem("gh_redirect");
    history.replaceState(null, "", saved);
  }
})();
