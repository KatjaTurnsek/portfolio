import './gh-redirect.js';

/**
 * History-API router with clean, crawlable paths.
 * - Static routes: "/", "/work", "/about", "/contact"
 * - Dynamic case routes: "/work/:slug" → "#case-:slug",
 *                        "/work/:slug/:sub" → "#case-:slug-:sub"
 * - Shows the target immediately; lets init.js animate inner content.
 * - Avoids writing inline transforms/opacity on section containers.
 */

(function initRouter() {
  if (typeof window !== 'undefined') window.__routerActive = true;

  const ACTIVE_CLASS = 'is-active';
  const BASE = (import.meta?.env?.BASE_URL || '/').replace(/\/$/, '');

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
    let p = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
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
      // clear any leftover layout-affecting styles (don’t set transform)
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
    if (canonical) canonical.setAttribute('href', location.origin + BASE + idToPath(el.id));
  }

  function setActiveLinkById(id) {
    const routedPath = idToPath(id) || normalizePathname(location.pathname);
    document.querySelectorAll('nav a').forEach((a) => {
      let isActive = false;
      try {
        const u = new URL(a.getAttribute('href') || '', location.origin);
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

    immediateShow(id);
    setMetaFromSection(el);
    setActiveLinkById(id);
    window.__currentSectionId = id;

    history.replaceState({ path: idToPath(id) }, '', BASE + idToPath(id));

    // Let init.js handle animation and event emission.
    if (typeof window.revealSection === 'function') window.revealSection(id);
  }

  function render(path, { replace = false } = {}) {
    const id = pathToId(path) || routes['/'];
    immediateShow(id);

    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const h = el.querySelector('h1, h2, h3');
      if (h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      if (h) setTimeout(() => h.focus?.(), 50);

      setMetaFromSection(el);
      setActiveLinkById(id);
      if (typeof window.revealSection === 'function') window.revealSection(id);
    }

    const state = { path };
    if (replace) history.replaceState(state, '', BASE + path);
    else history.pushState(state, '', BASE + path);
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
      url = new URL(el.href, location.origin);
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
