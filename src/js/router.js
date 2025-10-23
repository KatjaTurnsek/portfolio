// src/js/router.js
// History-API router with clean, crawlable paths.
// - Static routes: "/", "/work", "/about", "/contact"
// - Dynamic: "/work/:slug" → "case-:slug", "/work/:slug/:sub" → "case-:slug-:sub"
// - Shows target immediately; lets init.js animate inner content.

import { BASE } from './paths.js';

(function initRouter() {
  if (typeof window !== 'undefined') window.__routerActive = true;

  // Mark document as JS-enabled (CSS can provide a default visible section)
  document.documentElement.classList.add('js-ready');

  /** Adds/removes this on active nav links. */
  const ACTIVE_CLASS = 'is-active';

  /** BASE variants: with and without trailing slash. */
  const BASE_SLASH = BASE; // already ends with "/"
  const BASE_NO_SLASH = BASE.replace(/\/$/, ''); // e.g. "/portfolio"

  /** @type {Record<string,string>} Path → Section ID mapping for top-level routes. */
  const routes = {
    '/': 'home',
    '/work': 'work',
    '/about': 'about',
    '/contact': 'contact',
  };

  /** Reverse mapping (Section ID → Path). */
  const idsToPaths = Object.fromEntries(Object.entries(routes).map(([p, id]) => [id, p]));

  /**
   * @template {Element} T
   * @param {string} sel
   * @param {ParentNode} [root=document]
   * @returns {T|null}
   */
  const $ = (sel, root = document) => root.querySelector(sel);

  /**
   * @param {string} sel
   * @param {ParentNode} [root=document]
   * @returns {Element[]}
   */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** @returns {HTMLElement[]} All fullscreen sections. */
  const sections = () => /** @type {HTMLElement[]} */ ($$('.fullscreen-section'));

  /**
   * Normalize a pathname by stripping the site BASE and trailing slash.
   * @param {string} pathname
   * @returns {string} normalized (e.g. "/work/slug" → "/work/slug")
   */
  function normalizePathname(pathname) {
    let p = pathname;
    if (p.startsWith(BASE_SLASH)) p = '/' + p.slice(BASE_SLASH.length);
    else if (p.startsWith(BASE_NO_SLASH)) p = '/' + p.slice(BASE_NO_SLASH.length);
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  /**
   * Map path → section ID, supporting dynamic cases.
   * @param {string} path
   * @returns {string|null}
   */
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

    // Allow top-level IDs like "/about", "/contact", "/thank-you"
    const top = path.slice(1);
    if (top && document.getElementById(top)) return top;

    return null;
  }

  /**
   * Map section ID → canonical path.
   * @param {string} id
   * @returns {string}
   */
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

  /**
   * Immediately show only the requested section.
   * Avoid animating container transforms/opacity; just toggle visibility.
   * @param {string} id
   */
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

  /**
   * Update title/meta/canonical from the current section element.
   * @param {HTMLElement|null} el
   */
  function setMetaFromSection(el) {
    if (!el) return;
    const title = el.getAttribute('data-title');
    if (title) document.title = title;

    const desc = el.getAttribute('data-description');
    const meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute(
        'href',
        location.origin + BASE_SLASH + idToPath(el.id).replace(/^\//, '')
      );
    }
  }

  /**
   * Toggle active class on nav links based on current routed path.
   * @param {string} id
   */
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

  /**
   * Initial render from current URL (path or hash).
   * @param {string} path
   * @param {string|null} hash
   */
  function initialShow(path, hash) {
    const fallback = 'home';
    const hashId = hash && document.getElementById(hash) ? hash : null;
    const id = hashId || pathToId(path) || routes['/'] || fallback;
    const el = document.getElementById(id);
    if (!el) return;

    window.__currentSectionId = id;
    immediateShow(id);
    setMetaFromSection(el);
    setActiveLinkById(id);

    const newPath = idToPath(id);
    history.replaceState({ path: newPath }, '', BASE_SLASH + newPath.replace(/^\//, ''));

    if (typeof window.revealSection === 'function') window.revealSection(id);
  }

  /**
   * Core render: show a path and update history.
   * @param {string} path normalized path (e.g. "/work/slug")
   * @param {{ replace?: boolean }} [opts]
   */
  function render(path, { replace = false } = {}) {
    const fallback = 'home';
    const id = pathToId(path) || routes['/'] || fallback;
    window.__currentSectionId = id;

    immediateShow(id);

    const el = document.getElementById(id);
    if (el) {
      // Scroll to top for consistent UX on route change
      window.scrollTo({ top: 0, behavior: 'auto' });

      // Make first heading focusable once for a11y
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

  /**
   * Smart back: try history.back(), and if it didn't change, interpret href.
   * @param {string} href
   */
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

  /**
   * Global click handler to route internal links and bypass files.
   * @param {MouseEvent} e
   */
  function onClick(e) {
    const el = e.target instanceof Element ? e.target.closest('a,button') : null;
    if (!el) return;

    // Back buttons
    if (el.hasAttribute('data-back')) {
      e.preventDefault();
      smartBack(el instanceof HTMLAnchorElement ? el.href : '/');
      return;
    }

    // Only handle plain left-clicks on same-tab anchors
    if (!(el instanceof HTMLAnchorElement)) return;
    if (el.target && el.target !== '_self') return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // 1) QUICK RAW-HREF BYPASS (files, external-ish, download)
    const rawHref = el.getAttribute('href') || '';
    const isExternalRel = (el.getAttribute('rel') || '').includes('external');
    const isNoRouter = el.classList.contains('no-router');
    const isDownloadAttr = el.hasAttribute('download');
    const looksLikeFileByText = /\.[a-z0-9]{2,8}(\?|#|$)/i.test(rawHref); // .pdf/.png/.zip etc.
    if (isExternalRel || isNoRouter || isDownloadAttr || looksLikeFileByText) return;

    // 2) RESOLVE TO URL AND DOUBLE-CHECK IT'S NOT A FILE OR AN ASSET
    let url;
    try {
      url = new URL(rawHref, location.href); // robust for relative links
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;

    const pathname = url.pathname;
    const path = normalizePathname(pathname);
    const hash = url.hash ? url.hash.slice(1) : null;

    // Skip anything in the static assets folder under BASE (e.g. /portfolio/assets/...)
    const isUnderAssets = pathname.startsWith(BASE_SLASH + 'assets/');
    // Skip any URL that ends with a "file-ish" extension
    const looksLikeFileByPath = /\.[a-z0-9]{2,8}$/i.test(pathname);
    if (isUnderAssets || looksLikeFileByPath) return;

    // Hash → known section id (e.g. "#contact")
    if (hash && document.getElementById(hash)) {
      e.preventDefault();
      render(idToPath(hash), { replace: false });
      return;
    }

    // Not a routed internal URL → let the browser handle it
    const id = pathToId(path);
    if (!id) return;

    e.preventDefault();
    render(path);
  }

  /** Handle native back/forward navigations. */
  function onPopState() {
    const path = normalizePathname(location.pathname);
    render(path, { replace: true });
  }

  /** Initialize router and bind events. */
  function start() {
    // Let the SPA control scroll; avoids half-restores on mobile browsers
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const initialPath = normalizePathname(location.pathname);
    const initialHash = location.hash ? location.hash.slice(1) : null;

    initialShow(initialPath, initialHash);
    document.addEventListener('click', onClick, { passive: false });
    window.addEventListener('popstate', onPopState);

    // Re-hydrate after back/forward cache restores (iOS Safari & others)
    window.addEventListener('pageshow', (e) => {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      const cameFromBFCache = e.persisted || (nav && nav.type === 'back_forward');
      if (cameFromBFCache) {
        const path = normalizePathname(location.pathname);
        // Re-render the correct section and refresh any measurement-based libs
        requestAnimationFrame(() => {
          render(path, { replace: true });
          // Optional hooks if present in your app:
          window.ScrollTrigger?.refresh?.();
          const id = window.__currentSectionId;
          if (id && typeof window.revealSection === 'function') {
            window.revealSection(id);
          }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
