import "./gh-redirect.js";

/**
 * History-API router with clean, crawlable paths.
 * - Static routes: "/", "/work", "/about", "/contact"
 * - Dynamic case routes: "/work/:slug" → "#case-:slug",
 *                        "/work/:slug/:sub" → "#case-:slug-:sub"
 * - Defers first reveal until `loader:done`
 * - [data-back] links behave like a real Back button with SPA fallback
 *
 * Expects a section with an id matching the route target to exist in the DOM.
 * Sets `window.__routerActive = true` so other modules can disable legacy flows.
 *
 * @typedef {Record<string, string>} RouteMap
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

  /** Reverse static map (id → path). */
  const idsToPaths = Object.fromEntries(
    Object.entries(routes).map(([path, id]) => [id, path])
  );

  /** @returns {HTMLElement[]} */
  const allSections = () =>
    Array.from(document.querySelectorAll(".fullscreen-section"));

  /**
   * Strip base and trailing slash, ensure leading slash.
   * @param {string} pathname
   * @returns {string}
   */
  function normalizePathname(pathname) {
    let p = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  /**
   * Convert a path to a section id if it exists in DOM.
   * @param {string} path
   * @returns {string|null}
   */
  function pathToId(path) {
    if (path in routes) return routes[path];
    if (path.startsWith("/work/")) {
      const parts = path.split("/").filter(Boolean); // ["work", "slug", "sub?"]
      const slug = parts[1];
      const sub = parts[2];
      if (!slug) return null;
      const id = "case-" + slug + (sub ? "-" + sub : "");
      if (document.getElementById(id)) return id;
    }
    return null;
  }

  /**
   * Convert a section id to its pretty path.
   * @param {string} id
   * @returns {string}
   */
  function idToPath(id) {
    if (id in idsToPaths) return idsToPaths[id];
    if (id.startsWith("case-")) {
      const rest = id.slice(5);
      const firstDash = rest.indexOf("-");
      if (firstDash === -1) return "/work/" + rest;
      const slug = rest.slice(0, firstDash);
      const sub = rest.slice(firstDash + 1);
      return "/work/" + slug + "/" + sub;
    }
    return "/";
  }

  /** Close fullscreen menu if open. */
  function closeMenuIfOpen() {
    const menu = document.getElementById("menu");
    if (menu && menu.classList.contains("open")) menu.classList.remove("open");
    document.body.classList.remove("menu-open", "no-scroll", "overflow-hidden");
  }

  /**
   * Hide all sections except target and reset their animated state.
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
   * Prepare target for reveal (measurable, interactive, start state).
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
   * Apply active class to nav links that match the routed path for this id.
   * @param {string} id
   * @returns {void}
   */
  function setActiveLinkById(id) {
    const routedPath = idToPath(id) || normalizePathname(location.pathname);
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
   * Initial prep and history normalization (waits for loader to reveal).
   * Accepts legacy deep links with hashes and converts to pretty paths.
   * @param {string} path
   * @param {string|null} hash
   * @returns {void}
   */
  function initialShow(path, hash) {
    const hashId = hash && document.getElementById(hash) ? hash : null;
    const id = hashId || pathToId(path) || routes["/"];
    const el = document.getElementById(id);
    if (!el) return;

    hideAllExcept(id);
    prepTargetForReveal(el);

    const t = el.getAttribute("data-title");
    if (t) document.title = t;

    setActiveLinkById(id);
    window.__currentSectionId = id;

    const pretty = idToPath(id);
    history.replaceState({ path: pretty }, "", BASE + pretty);
  }

  /** Reveal current section once (on `loader:done` or fallback). */
  function kickInitialReveal() {
    if (window.__initialRevealed) return;
    window.__initialRevealed = true;
    const id = window.__currentSectionId;
    if (id) window.revealSection?.(id);
  }

  document.addEventListener("loader:done", kickInitialReveal);
  setTimeout(kickInitialReveal, 1200);

  /**
   * Core render: show target id for a given path and update history.
   * @param {string} path
   * @param {{ replace?: boolean }} [opts]
   * @returns {void}
   */
  function render(path, { replace = false } = {}) {
    const id = pathToId(path) || routes["/"];

    closeMenuIfOpen();
    hideAllExcept(id);

    const el = document.getElementById(id);
    if (el) {
      prepTargetForReveal(el);

      window.scrollTo({ top: 0, behavior: "auto" });

      const h = el.querySelector("h1, h2, h3");
      if (h && !h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
      if (h) setTimeout(() => h.focus?.(), 50);

      const t = el.getAttribute("data-title");
      if (t) document.title = t;

      setActiveLinkById(id);
      window.revealSection?.(id);
    }

    const state = { path };
    const url = BASE + path;
    if (replace) history.replaceState(state, "", url);
    else history.pushState(state, "", url);
  }

  /**
   * Try real history.back(); if it doesn't navigate, fall back to `href`.
   * @param {string} href
   * @returns {void}
   */
  function smartBack(href) {
    const before = location.href;
    const popOnce = () => window.removeEventListener("popstate", popOnce);
    window.addEventListener("popstate", popOnce, { once: true });
    history.back();
    setTimeout(() => {
      if (location.href === before) {
        const url = new URL(href, location.origin);
        const path = normalizePathname(url.pathname);
        const id = pathToId(path);
        if (id) render(path);
        else location.assign(href);
      }
    }, 250);
  }

  /**
   * Intercept same-origin links for SPA nav.
   * Supports `[data-back]` and legacy hash links (#id → pretty path).
   * @param {MouseEvent} e
   * @returns {void}
   */
  function onClick(e) {
    const el =
      e.target instanceof Element ? e.target.closest("a,button") : null;
    if (!el) return;

    if (el.hasAttribute("data-back")) {
      e.preventDefault();
      const href = el instanceof HTMLAnchorElement ? el.href : "/";
      smartBack(href);
      return;
    }

    if (!(el instanceof HTMLAnchorElement)) return;

    if (el.target && el.target !== "_self") return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    let url;
    try {
      url = new URL(el.href, location.origin);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;

    const path = normalizePathname(url.pathname);
    const hash = url.hash ? url.hash.slice(1) : null;

    // Hash → pretty path (#id → /..., if such section exists)
    if (hash && document.getElementById(hash)) {
      e.preventDefault();
      render(idToPath(hash));
      return;
    }

    const id = pathToId(path);
    if (!id) return; // not a routed path → let browser handle (PDFs, files, etc.)

    e.preventDefault();
    render(path);
  }

  /** Popstate handler: re-render current URL without new history entries. */
  function onPopState() {
    const path = normalizePathname(location.pathname);
    render(path, { replace: true });
  }

  /** Boot after DOM is ready. */
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
