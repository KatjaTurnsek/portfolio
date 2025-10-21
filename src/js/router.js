// src/js/router.js
// History-API router with clean, crawlable paths.
// - Static routes: "/", "/work", "/about", "/contact"
// - Dynamic: "/work/:slug" → "case-:slug", "/work/:slug/:sub" → "case-:slug-:sub"
// - Shows target immediately; lets init.js animate inner content.

(function initRouter() {
  if (typeof window !== 'undefined') window.__routerActive = true;

  const ACTIVE_CLASS = 'is-active';

  // Prefer runtime base set in index.js, fall back to Vite env, then "/"
  const RAW_BASE = window.__BASE_URL__ || import.meta?.env?.BASE_URL || '/';
  const BASE = RAW_BASE.replace(/\/?$/, ''); // "/portfolio"
  const BASE_SLASH = BASE + '/'; // "/portfolio/"

  /** @type {Record<string,string>} */
  const routes = {
    '/': 'home',
    '/work': 'work',
    '/about': 'about',
    '/contact': 'contact',
  };

  const idsToPaths = Object.fromEntries(Object.entries(routes).map(([p, id]) => [id, p]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sections = () => $$('.fullscreen-section');

  function normalizePathname(pathname) {
    // Strip the "/portfolio" prefix (with or without trailing slash)
    let p = pathname;
    if (p.startsWith(BASE_SLASH)) p = '/' + p.slice(BASE_SLASH.length);
    else if (p.startsWith(BASE)) p = '/' + p.slice(BASE.length);
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  function pathToId(path) {
    if (path in routes) return routes[path];

    if (path.startsWith('/work/')) {
      const parts = path.split('/').filter(Boolean); // ["work","slug","sub?"]
      const slug = parts[1];
      const sub = parts[2];
      if (!slug) return null;
      const id = 'case-' + slug + (sub ? '-' + sub : '');
      if (document.getElementById(id)) return id;
    }

    // allow top-level ids like "/about", "/contact", "/thank-you"
    const top = path.slice(1); // drop leading "/"
    if (top && document.getElementById(top)) return top;

    return null;
  }

  function idToPath(id) {
    if (id in idsToPaths) return idsToPaths[id];
    if (id.startsWith('case-')) {
      const rest = id.slice(5);
      const firstDash = rest.indexOf('-');
      if (firstDash === -1) return '/work/' + rest;
      const slug = rest.slice(0, firstDash);
      const sub = rest.slice(firstDash + 1);
      return '/work/' + slug + '/' + sub;
    }
    return '/';
  }

  /** Never write transforms/opacity to containers; just toggle visibility. */
  function immediateShow(id) {
    sections().forEach((s) => {
      const on = s.id === id;
      s.classList.toggle('visible', on);
      s.style.display = on ? 'block' : 'none';
      s.style.visibility = on ? 'visible' : 'hidden';
      s.style.pointerEvents = on ? 'auto' : 'none';
      s.style.transform = 'none';
      s.style.opacity = on ? '1' : '0';
    });
  }

  function setMetaFromSection(el) {
    if (!el) return;
    const title = el.getAttribute('data-title');
    if (title) document.title = title;

    const desc = el.getAttribute('data-description');
    const meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical)
      canonical.setAttribute(
        'href',
        location.origin + BASE_SLASH + idToPath(el.id).replace(/^\//, '')
      );
  }

  function setActiveLinkById(id) {
    const routedPath = idToPath(id) || normalizePathname(location.pathname);
    document.querySelectorAll('nav a').forEach((a) => {
      let isActive = false;
      try {
        const href = a.getAttribute('href') || '';
        const u = new URL(href, location.href);
        isActive = normalizePathname(u.pathname) === routedPath;
      } catch {}
      a.classList.toggle(ACTIVE_CLASS, isActive);
    });
  }

  function initialShow(path, hash) {
    const hashId = hash && document.getElementById(hash) ? hash : null;
    const id = hashId || pathToId(path) || routes['/'];
    const el = document.getElementById(id);
    if (!el) return;

    window.__currentSectionId = id;
    immediateShow(id);
    setMetaFromSection(el);
    setActiveLinkById(id);

    const newPath = idToPath(id);
    history.replaceState({ path: newPath }, '', BASE_SLASH + newPath.replace(/^\//, ''));

    // Let init.js handle animation and event emission.
    if (typeof window.revealSection === 'function') window.revealSection(id);
  }

  function render(path, { replace = false } = {}) {
    const id = pathToId(path) || routes['/'];
    window.__currentSectionId = id; // keep index.js in sync

    immediateShow(id);

    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const h = el.querySelector('h1, h2, h3, [role="heading"]');
      if (h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      if (h) setTimeout(() => h.focus?.(), 50);

      setMetaFromSection(el);
      setActiveLinkById(id);
      if (typeof window.revealSection === 'function') window.revealSection(id);
    }

    const state = { path };
    const url = BASE_SLASH + path.replace(/^\//, '');
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
  }

  function smartBack(href) {
    const before = location.href;
    const popOnce = () => window.removeEventListener('popstate', popOnce);
    window.addEventListener('popstate', popOnce, { once: true });
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

  function onClick(e) {
    const el = e.target instanceof Element ? e.target.closest('a,button') : null;
    if (!el) return;

    if (el.hasAttribute('data-back')) {
      e.preventDefault();
      smartBack(el instanceof HTMLAnchorElement ? el.href : '/');
      return;
    }

    if (!(el instanceof HTMLAnchorElement)) return;
    if (el.target && el.target !== '_self') return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    let url;
    try {
      // resolve relative links correctly against current document URL
      url = new URL(el.getAttribute('href') || '', location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;

    const path = normalizePathname(url.pathname);
    const hash = url.hash ? url.hash.slice(1) : null;

    if (hash && document.getElementById(hash)) {
      e.preventDefault();
      render(idToPath(hash));
      return;
    }

    const id = pathToId(path);
    if (!id) return; // let browser handle non-routed links

    e.preventDefault();
    render(path);
  }

  function onPopState() {
    const path = normalizePathname(location.pathname);
    render(path, { replace: true });
  }

  function start() {
    const initialPath = normalizePathname(location.pathname);
    const initialHash = location.hash ? location.hash.slice(1) : null;

    initialShow(initialPath, initialHash);
    document.addEventListener('click', onClick, { passive: false });
    window.addEventListener('popstate', onPopState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
