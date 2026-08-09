/**
 * @file waves.js
 * @description Viewport-aware heading wave animations.
 */

import { gsap, isSafari } from './env.js';
import { getAnimationSpeed, prefersReducedMotion } from '../motion.js';

const MOBILE_BREAKPOINT = 768;

/** @type {gsap.core.Tween|null} */
let _heroWaveTween = null;

/** @type {IntersectionObserver|null} */
let _heroWaveObserver = null;

/** @type {SVGPathElement|null} */
let _heroWavePath = null;

/** @type {string|null} */
let _heroWaveOriginalPath = null;

let _heroWaveIsVisible = false;
let _waveLifecycleBound = false;

/** @type {null|(() => void)} */
let _waveVisibilityHandler = null;

/** @type {null|(() => void)} */
let _activeWaveCleanup = null;

/**
 * Check whether the viewport uses the mobile animation profile.
 * @returns {boolean}
 */
function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

/**
 * Initialize both heading-wave systems as one owned lifecycle.
 * Calling this again first releases every resource from the previous run.
 *
 * @returns {() => void} Cleanup function for observers, listeners, tickers, and tweens.
 */
export function initWaveAnimations() {
  if (_activeWaveCleanup) {
    _activeWaveCleanup();
  } else {
    _releaseWaveResources();
  }

  insertWaveLines();
  animateWaveLine();
  animateCustomWaveLines();

  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;

    cleaned = true;
    _releaseWaveResources();

    if (_activeWaveCleanup === cleanup) {
      _activeWaveCleanup = null;
    }
  };

  _activeWaveCleanup = cleanup;

  return cleanup;
}

/**
 * Animate a single path inside #wavy-line using MorphSVG when available.
 * Graceful fallback uses a subtle Y translation.
 * (Safe no-op if #wavy-line doesn't exist.)
 * @returns {void}
 */
export function animateWaveLine() {
  _releaseHeroWaveResources();

  const path = /** @type {SVGPathElement|null} */ (document.querySelector('#wavy-line path'));

  if (!path) return;

  _heroWavePath = path;
  _heroWaveOriginalPath = path.getAttribute('d');

  const ALT_D = 'M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15';

  gsap.killTweensOf(path);

  if (isMobileViewport() || prefersReducedMotion()) {
    gsap.set(path, { clearProps: 'transform' });
    return;
  }

  if (gsap.plugins?.MorphSVGPlugin && !isSafari) {
    _heroWaveTween = gsap.to(path, {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      morphSVG: { shape: ALT_D },
      paused: true,
    });
  } else {
    _heroWaveTween = gsap.to(path, {
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      y: 2,
      paused: true,
    });
  }

  _bindWaveLifecycle();

  const section = path.closest('.fullscreen-section');
  const observedElement = section || path.closest('svg') || path;

  _heroWaveIsVisible = section
    ? section.classList.contains('visible')
    : observedElement.getClientRects().length > 0;

  _syncHeroWaveTween();

  if (typeof IntersectionObserver === 'undefined') {
    _heroWaveIsVisible = true;
    _syncHeroWaveTween();
    return;
  }

  _heroWaveObserver = new IntersectionObserver(
    ([entry]) => {
      _heroWaveIsVisible = Boolean(entry?.isIntersecting);
      _syncHeroWaveTween();
    },
    { threshold: 0 }
  );

  _heroWaveObserver.observe(observedElement);
}

/**
 * Insert wave SVGs below main headings and every case-study H1.
 * Guards against inserting duplicates.
 * @returns {void}
 */
export function insertWaveLines() {
  document
    .querySelectorAll('#about h2, #work h2, #contact h2, .fullscreen-section[id^="case-"] h1')
    .forEach((heading) => {
      const next = heading.nextElementSibling;

      if (next?.classList.contains('wavy-line')) {
        return;
      }

      const isCaseStudyHeading = heading.matches('.fullscreen-section[id^="case-"] h1');

      const waveSVG = `
        <svg
          class="wavy-line${isCaseStudyHeading ? ' wavy-line-hero' : ''}"
          viewBox="0 0 500 30"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <polyline
            class="wavy-polyline"
            fill="none"
            stroke="currentColor"
            stroke-width="${isCaseStudyHeading ? 2 : 1}"
          />
        </svg>
      `;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = waveSVG;

      const svg = wrapper.firstElementChild;

      if (svg) {
        heading.insertAdjacentElement('afterend', svg);
      }
    });
}

/**
 * @typedef {Object} PolylineItem
 * @property {SVGPolylineElement} polyline
 * @property {SVGPoint[]} points
 * @property {number} segments
 * @property {number} amplitude
 * @property {number} frequency
 * @property {number} phase
 * @property {boolean} isVisible
 * @property {SVGSVGElement} observedElement
 */

/** @type {PolylineItem[]} */
let _polylineItems = [];

let _polylineTickerAdded = false;

/** @type {IntersectionObserver|null} */
let _polylineObserver = null;

let _polylineLastTick = 0;

/**
 * Animate all inserted .wavy-polyline elements by mutating their points each tick.
 * Safe to call multiple times.
 * @returns {void}
 */
export function animateCustomWaveLines() {
  const polylines = document.querySelectorAll('.wavy-polyline');
  const isMobile = isMobileViewport();

  _bindWaveLifecycle();
  _ensurePolylineObserver();

  polylines.forEach((polyline) => {
    if (!(polyline instanceof SVGPolylineElement)) return;
    if (polyline.dataset.waveInit === '1') return;

    polyline.dataset.waveInit = '1';

    const svg = polyline.closest('svg');
    if (!svg) return;

    const width = 500;
    const amplitude = 10;
    const frequency = 2;
    const segments = isMobile ? 50 : isSafari ? 50 : 100;
    const interval = width / segments;

    /** @type {SVGPoint[]} */
    const points = [];

    while (polyline.points.numberOfItems > 0) {
      polyline.points.removeItem(0);
    }

    for (let i = 0; i <= segments; i++) {
      // @ts-ignore - SVGSVGElement has createSVGPoint
      const point = svg.createSVGPoint();

      point.x = i * interval;
      point.y = 15;

      points.push(point);
      polyline.points.appendItem(point);
    }

    const item = {
      polyline,
      points,
      segments,
      amplitude,
      frequency,
      phase: 0,
      isVisible: typeof IntersectionObserver === 'undefined',
      observedElement: svg,
    };

    _polylineItems.push(item);
    _drawPolyline(item, 0);
    _polylineObserver?.observe(svg);
  });

  if (prefersReducedMotion()) {
    _drawAllPolylines();
    _syncPolylineTicker();
    return;
  }

  _syncPolylineTicker();
}

/**
 * Internal ticker update for visible polyline waves.
 * @returns {void}
 */
function _updateAllPolylines() {
  const now = performance.now();

  const elapsed = _polylineLastTick ? Math.min((now - _polylineLastTick) * 0.002, 0.1) : 0;

  _polylineLastTick = now;

  _removeDisconnectedPolylines();

  for (const item of _polylineItems) {
    if (!item.isVisible) continue;

    item.phase += elapsed * getAnimationSpeed();
    _drawPolyline(item, item.phase);
  }

  _syncPolylineTicker();
}

/**
 * Draw every registered polyline at its saved point in the wave cycle.
 * @returns {void}
 */
function _drawAllPolylines() {
  _removeDisconnectedPolylines();

  for (const item of _polylineItems) {
    _drawPolyline(item, item.phase);
  }
}

/**
 * Draw one registered polyline.
 * @param {PolylineItem} item
 * @param {number} time
 * @returns {void}
 */
function _drawPolyline(item, time) {
  const { polyline, points, segments, amplitude, frequency } = item;

  if (!polyline.points || polyline.points.numberOfItems < segments + 1) {
    return;
  }

  for (let i = 0; i <= segments; i++) {
    const y = 15 + Math.sin((i / segments) * Math.PI * frequency + time) * -amplitude;

    points[i].y = y;
    polyline.points.getItem(i).y = y;
  }
}

/**
 * Create the observer that tracks whether each inserted wave is onscreen.
 * @returns {void}
 */
function _ensurePolylineObserver() {
  if (_polylineObserver || typeof IntersectionObserver === 'undefined') {
    return;
  }

  _polylineObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        for (const item of _polylineItems) {
          if (item.observedElement === entry.target) {
            item.isVisible = entry.isIntersecting;
          }
        }
      }

      _syncPolylineTicker();
    },
    { threshold: 0 }
  );
}

/**
 * Remove waves that no longer exist after route or DOM changes.
 * @returns {void}
 */
function _removeDisconnectedPolylines() {
  _polylineItems = _polylineItems.filter((item) => {
    if (item.polyline.isConnected) {
      return true;
    }

    _polylineObserver?.unobserve(item.observedElement);
    return false;
  });
}

/**
 * Add the custom wave callback only while at least one wave is visible.
 * @returns {void}
 */
function _syncPolylineTicker() {
  _removeDisconnectedPolylines();

  const shouldRun =
    !isMobileViewport() &&
    !prefersReducedMotion() &&
    document.visibilityState === 'visible' &&
    _polylineItems.some((item) => item.isVisible);

  if (shouldRun && !_polylineTickerAdded) {
    _polylineTickerAdded = true;
    _polylineLastTick = 0;

    gsap.ticker.add(_updateAllPolylines);
    return;
  }

  if (!shouldRun && _polylineTickerAdded) {
    gsap.ticker.remove(_updateAllPolylines);

    _polylineTickerAdded = false;
    _polylineLastTick = 0;
  }
}

/**
 * Pause or resume the separate hero wave tween.
 * @returns {void}
 */
function _syncHeroWaveTween() {
  if (!_heroWaveTween) return;

  const shouldRun =
    !isMobileViewport() &&
    !prefersReducedMotion() &&
    document.visibilityState === 'visible' &&
    _heroWaveIsVisible;

  if (shouldRun) {
    _heroWaveTween.resume();
  } else {
    _heroWaveTween.pause();
  }
}

/**
 * Bind the browser-tab visibility listener once.
 * @returns {void}
 */
function _bindWaveLifecycle() {
  if (_waveLifecycleBound) return;

  _waveLifecycleBound = true;

  _waveVisibilityHandler = () => {
    _syncHeroWaveTween();
    _syncPolylineTicker();
  };

  document.addEventListener('visibilitychange', _waveVisibilityHandler);
}

/**
 * Release the separate hero-wave observer and tween and restore its base path.
 * @returns {void}
 */
function _releaseHeroWaveResources() {
  _heroWaveObserver?.disconnect();

  _heroWaveTween?.scrollTrigger?.kill();
  _heroWaveTween?.kill();

  if (_heroWavePath) {
    gsap.killTweensOf(_heroWavePath);

    if (_heroWaveOriginalPath !== null) {
      _heroWavePath.setAttribute('d', _heroWaveOriginalPath);
    }

    gsap.set(_heroWavePath, { clearProps: 'transform' });
  }

  _heroWaveTween = null;
  _heroWaveObserver = null;
  _heroWavePath = null;
  _heroWaveOriginalPath = null;
  _heroWaveIsVisible = false;
}

/**
 * Release every resource owned by the combined wave lifecycle.
 * @returns {void}
 */
function _releaseWaveResources() {
  _releaseHeroWaveResources();
  _polylineObserver?.disconnect();

  if (_polylineTickerAdded) {
    gsap.ticker.remove(_updateAllPolylines);
  }

  for (const item of _polylineItems) {
    delete item.polyline.dataset.waveInit;
  }

  if (_waveVisibilityHandler) {
    document.removeEventListener('visibilitychange', _waveVisibilityHandler);
  }

  _polylineItems = [];
  _polylineTickerAdded = false;
  _polylineObserver = null;
  _polylineLastTick = 0;
  _waveLifecycleBound = false;
  _waveVisibilityHandler = null;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (_activeWaveCleanup) {
      _activeWaveCleanup();
    } else {
      _releaseWaveResources();
    }
  });
}
