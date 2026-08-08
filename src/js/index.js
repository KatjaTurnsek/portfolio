/**
 * @file index.js
 * @overview App initialization & wiring:
 *  - Router setup
 *  - Safe section reveal + runtime min-height sizing
 *  - Menu open/close + cleanup
 *  - Loader show/hide + visuals
 *  - Footer copyright year update
 *
 * Assumptions:
 *  - Browser-only module (DOM APIs available)
 *  - Vite environment (optional import.meta.env.BASE_URL)
 */

import "../css/main.css";

import "./toggle.js";

import { restoreGhPagesDeepLink } from "./app/boot/ghPagesRestore.js";
import { installHistoryBaseGuard } from "./app/boot/historyBaseGuard.js";
import { bindAppHandlers } from "./app/boot/bindAppHandlers.js";
import { bootOnDomReady } from "./app/boot/domReady.js";

import { sizeSectionMinHeight } from "./init.js";

/* ────────────────────────────────────────────────────────────────────────── */
/* GH Pages boot (must run BEFORE router boot)                                */
/* ────────────────────────────────────────────────────────────────────────── */

function bootGhPages() {
  restoreGhPagesDeepLink();
  installHistoryBaseGuard();
}

bootGhPages();

/**
 * Load the router AFTER we’ve potentially rewritten the URL so it sees the final path.
 * Marks window.__routerActive when ready.
 */
import("./router.js");

/* ────────────────────────────────────────────────────────────────────────── */
/* Footer copyright                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Update the footer copyright year to the current year.
 * @returns {void}
 */
function updateCopyrightYear() {
  const yearEl = document.getElementById("copyright-year");
  if (!yearEl) return;

  yearEl.textContent = String(new Date().getFullYear());
}

/* ────────────────────────────────────────────────────────────────────────── */
/* App handlers                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

bindAppHandlers({
  sizeFn: sizeSectionMinHeight,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* DOM ready                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function bootAppOnDomReady() {
  updateCopyrightYear();
  bootOnDomReady();
}

document.addEventListener("DOMContentLoaded", bootAppOnDomReady);
