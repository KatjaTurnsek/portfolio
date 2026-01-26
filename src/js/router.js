/**
 * @file router.js
 * @overview History-API router bootstrap.
 * Keeps the entry file name stable so index.js can keep: import('./router.js')
 */

import { startRouter } from './router/startRouter.js';

(function initRouter() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startRouter);
  } else {
    startRouter();
  }
})();
