import "./gh-redirect.js";

/**
 * History-API router for a one-page site with “pretty” paths.
 *
 * Features:
 *  - Shows exactly one section at a time (no full page reloads).
 *  - Defers the very first reveal until the global loader fires `loader:done`.
 *  - Supports deep links (`/work#case-foo`) and Back/Forward.
 *  - Keeps nav state in sync and focuses the first heading for a11y.
 *
 * Expects each route to map to a section with that `id` in the DOM.
 * Exposes `window.__routerActive = true` so other modules can opt out of legacy behaviors.
 *
 * @typedef {Record<string, string>} RouteMap - Maps path -> section id.
 */
(function initRouter() {
  if (typeof window !== "undefined") window.__routerActive = true;

  const ACTIVE_CLASS = "is-active";
  const BASE = (import.meta?.env?.BASE_URL || "/").replace(/\/$/, "");

  /** @type {RouteMap} */
  const routes = {
    "/": "home",
    "/work": "work",
    "/about": "about",
    "/contact": "contact",
  };

  /** @type {Record<string, string>} - Reverse map: section id -> path */
  const idsToPaths = Object.fromEntries(
    Object.entries(routes).map(([path, id]) => [id, path])
  );

  /** @returns {HTMLElement[]} */
  const allSections = () =>
    Array.from(document.querySelectorAll(".fullscreen-section"));

  /**
   * Normalizes a pathname by stripping the Vite base and trailing slash.
   * Falls back to "/" if the path isn't a known route.
   * @param {string} pathname
   * @returns {keyof RouteMap}
   */
  function normalizePathname(pathname) {
    let p = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return /** @type {keyof RouteMap} */ (p in routes ? p : "/");
  }

  /**
   * Closes the full-screen menu and clears body lock classes if present.
   * @returns {void}
   */
  function closeMenuIfOpen() {
    const menu = document.getElementById("menu");
    if (menu && menu.classList.contains("open")) menu.classList.remove("open");
    document.body.classList.remove("menu-open", "no-scroll", "overflow-hidden");
  }

  /**
   * Hides all sections except the provided id and resets their animated state.
   * @param {string} idToShow
   * @returns {void}
   */
  function hideAllExcept(idToShow) {
    allSections().forEach((s) => {
      if (s.id === idToShow) return;
      s.classList.remove("visible");
      s.style.display = "none";
      s.style.visibility = "hidden";
      s.style.pointerEvents = "none";
      s.style.opacity = "0";
      s.style.transform = "translateY(50px)";
    });
  }

  /**
   * Prepares a section for reveal: measurable & interactive, but at the animation start state.
   * @param {HTMLElement} el
   * @returns {void}
   */
  function prepTargetForReveal(el) {
    el.style.display = "block";
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
    el.style.opacity = "0";
    el.style.transform = "translateY(50px)";
    el.classList.remove("visible");
  }

  /**
   * Applies the active class to nav links whose path matches the given section id.
   * @param {string} id
   * @returns {void}
   */
  function setActiveLinkById(id) {
    const routedPath = idsToPaths[id] || normalizePathname(location.pathname);
    document.querySelectorAll("nav a").forEach((a) => {
      let isActive = false;
      try {
        const aURL = new URL(a.getAttribute("href") || "", location.origin);
        const aPath = normalizePathname(aURL.pathname);
        isActive = aPath === routedPath;
      } catch {
        isActive = false;
      }
      a.classList.toggle(ACTIVE_CLASS, isActive);
    });
  }

  /**
   * Prepares the initial section (no animation yet) and seeds history state.
   * The actual reveal is triggered later by the global loader (`loader:done`).
   * @param {keyof RouteMap} path
   * @param {string|null} hash
   * @returns {void}
   */
  function initialShow(path, hash) {
    const baseId = routes[path] || routes["/"];
    const id = hash && document.getElementById(hash) ? hash : baseId;
    const el = document.getElementById(id);
    if (!el) return;

    hideAllExcept(id);
    prepTargetForReveal(el);

    const title = el.getAttribute("data-title");
    if (title) document.title = title;
    setActiveLinkById(id);

    // Remember which section to reveal when loader completes.
    window.__currentSectionId = id;

    history.replaceState(
      { path, hash },
      "",
      BASE + path + (hash ? `#${hash}` : "")
    );
  }

  /**
   * First-time reveal trigger (runs once). Called on `loader:done` or timeout fallback.
   * @returns {void}
   */
  function kickInitialReveal() {
    if (window.__initialRevealed) return;
    window.__initialRevealed = true;
    const id = window.__currentSectionId;
    if (id) window.revealSection?.(id);
  }

  document.addEventListener("loader:done", kickInitialReveal);
  // Dev fallback if loader isn't shown:
  setTimeout(kickInitialReveal, 1200);

  /**
   * Core navigation: updates history/URL and animates the target section.
   * @param {keyof RouteMap} path
   * @param {{hash?: string|null, replace?: boolean}} [opts]
   * @returns {void}
   */
  function render(path, { hash = null, replace = false } = {}) {
    const baseId = routes[path] || routes["/"];
    const id = hash && document.getElementById(hash) ? hash : baseId;

    closeMenuIfOpen();
    hideAllExcept(id);

    const el = document.getElementById(id);
    if (el) {
      prepTargetForReveal(el);

      window.scrollTo({ top: 0, behavior: "auto" });

      const h = el.querySelector("h1, h2, h3");
      if (h && !h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
      if (h) setTimeout(() => h.focus?.(), 50);

      const title = el.getAttribute("data-title");
      if (title) document.title = title;

      setActiveLinkById(id);
      window.revealSection?.(id);
    }

    const url = BASE + path + (hash ? `#${hash}` : "");
    const state = { path, hash };
    if (replace) history.replaceState(state, "", url);
    else history.pushState(state, "", url);
  }

  /**
   * Intercepts same-origin link clicks for SPA navigation.
   * Lets browser handle external links, downloads, and non-route anchors.
   * @param {MouseEvent} e
   * @returns {void}
   */
  function onClick(e) {
    const a = /** @type {HTMLElement|null} */ (
      e.target instanceof Element ? e.target.closest("a") : null
    );
    if (!a) return;

    if (
      /** @type {HTMLAnchorElement} */ (a).target &&
      /** @type {HTMLAnchorElement} */ (a).target !== "_self"
    )
      return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    let url;
    try {
      url = new URL(/** @type {HTMLAnchorElement} */ (a).href, location.origin);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;

    const path = normalizePathname(url.pathname);
    const hash = url.hash ? url.hash.slice(1) : null;

    const isRoutedPath = path in routes;
    const hashTargetsSection = !!(hash && document.getElementById(hash));

    if (!isRoutedPath && !hashTargetsSection) return;

    e.preventDefault();

    if (hash && idsToPaths[hash]) {
      render(idsToPaths[hash]);
      return;
    }

    const basePath = isRoutedPath ? path : normalizePathname(location.pathname);
    render(basePath, { hash });
  }

  /**
   * Handles Back/Forward navigation by re-rendering the current URL.
   * @returns {void}
   */
  function onPopState() {
    const path = normalizePathname(location.pathname);
    const hash = location.hash ? location.hash.slice(1) : null;
    render(path, { hash, replace: true });
  }

  /**
   * Boots the router after the DOM is ready.
   * @returns {void}
   */
  function start() {
    const initialPath = normalizePathname(location.pathname);
    const initialHash = location.hash ? location.hash.slice(1) : null;

    initialShow(initialPath, initialHash);

    document.addEventListener("click", onClick, { passive: false });
    window.addEventListener("popstate", onPopState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
