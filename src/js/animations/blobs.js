/**
 * @file blobs.js
 * @description Ambient morphing background blobs with shared-layer scroll fading and
 * smooth, isolated jelly dragging.
 */

import { gsap, isSafari } from './env.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MOBILE_BREAKPOINT = 768;

const scrollOpacity = { value: 1 };

/** @type {SVGGElement|null} */
let opacityContainer = null;

/** @type {null|(() => void)} */
let removeFallbackScroll = null;

/**
 * Keep a number between a minimum and maximum value.
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Read a numeric CSS custom property.
 * @param {CSSStyleDeclaration} styles
 * @param {string} property
 * @param {number} fallback
 * @returns {number}
 */
function readCssNumber(styles, property, fallback) {
  const value = Number.parseFloat(styles.getPropertyValue(property));
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Create a smooth, closed organic SVG path centred around 0,0.
 * @param {number} size
 * @param {number} waveA
 * @param {number} waveB
 * @param {number} frequencyA
 * @param {number} frequencyB
 * @param {number} phaseA
 * @param {number} phaseB
 * @returns {string}
 */
function makeSoftBlobPath(size, waveA, waveB, frequencyA, frequencyB, phaseA, phaseB) {
  const pointCount = 48;
  const radius = size / 2;
  const points = [];

  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2;

    const variation =
      1 +
      waveA * Math.sin(frequencyA * angle + phaseA) +
      waveB * Math.sin(frequencyB * angle + phaseB);

    points.push({
      x: Math.cos(angle) * radius * variation,
      y: Math.sin(angle) * radius * variation,
    });
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < pointCount; index += 1) {
    const previous = points[(index - 1 + pointCount) % pointCount];
    const current = points[index];
    const next = points[(index + 1) % pointCount];
    const afterNext = points[(index + 2) % pointCount];

    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (afterNext.x - current.x) / 6;
    const controlTwoY = next.y - (afterNext.y - current.y) / 6;

    path +=
      ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}` +
      ` ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}` +
      ` ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return `${path} Z`;
}

/**
 * Ensure that the blob wrapper, SVG, ambient group, and drag overlay exist.
 * @returns {{
 *   svg: SVGSVGElement,
 *   container: SVGGElement,
 *   dragOverlay: SVGGElement,
 *   width: number,
 *   height: number
 * }}
 */
function ensureBlobDOM() {
  let wrapper = document.querySelector('.morphing-blob-wrapper');

  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'morphing-blob-wrapper';
    document.body.prepend(wrapper);
  }

  let svg = /** @type {SVGSVGElement|null} */ (document.getElementById('blob-svg'));

  if (!svg) {
    svg = /** @type {SVGSVGElement} */ (document.createElementNS(SVG_NS, 'svg'));

    svg.id = 'blob-svg';
    svg.setAttribute('viewBox', '0 0 1200 800');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    wrapper.appendChild(svg);
  }

  if (!svg.hasAttribute('viewBox')) {
    svg.setAttribute('viewBox', '0 0 1200 800');
  }

  let container = /** @type {SVGGElement|null} */ (svg.querySelector('#blobs-g'));

  if (!container) {
    container = /** @type {SVGGElement} */ (document.createElementNS(SVG_NS, 'g'));

    container.id = 'blobs-g';
    svg.appendChild(container);
  }

  let dragOverlay = /** @type {SVGGElement|null} */ (svg.querySelector('#blob-drag-overlay'));

  if (!dragOverlay) {
    dragOverlay = /** @type {SVGGElement} */ (document.createElementNS(SVG_NS, 'g'));

    dragOverlay.id = 'blob-drag-overlay';
    svg.appendChild(dragOverlay);
  }

  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || 1200;
  const height = viewBox.height || 800;

  return { svg, container, dragOverlay, width, height };
}

/**
 * Set opacity with inline !important so older CSS cannot override it.
 * @param {Element} element
 * @param {number} opacity
 * @returns {void}
 */
function setOpacity(element, opacity) {
  element.style.setProperty('opacity', String(clamp(opacity, 0, 1)), 'important');
}

/**
 * Apply the current scroll opacity equally to the ambient blobs
 * and the drag overlay.
 * @returns {void}
 */
function applyBlobOpacities() {
  if (!opacityContainer) return;

  setOpacity(opacityContainer, scrollOpacity.value);

  const dragOverlay = document.querySelector('#blob-drag-overlay');

  if (dragOverlay) {
    setOpacity(dragOverlay, scrollOpacity.value);
  }
}

/**
 * Return the released blob to the ambient container without changing
 * its visible opacity.
 * @param {SVGGElement} group
 * @param {SVGGElement} container
 * @returns {void}
 */
function restoreScrollOpacity(group, container) {
  setOpacity(group, 1);
  group.removeAttribute('data-dragging');
  container.appendChild(group);
  applyBlobOpacities();
}

/**
 * Fade normal blobs near the beginning of the page scroll.
 * The opacity reaches its final value after roughly 65% of one viewport.
 *
 * @param {SVGGElement} container
 * @returns {void}
 */
function setupScrollOpacity(container) {
  opacityContainer = container;

  const styles = getComputedStyle(document.documentElement);

  const opacityStart = clamp(readCssNumber(styles, '--blob-opacity-start', 1), 0, 1);
  const opacityEnd = clamp(readCssNumber(styles, '--blob-opacity-end', 0.55), 0, 1);

  const getFadeDistance = () => Math.max(1, window.innerHeight * 0.65);

  scrollOpacity.value = opacityStart;

  applyBlobOpacities();

  if (removeFallbackScroll) {
    removeFallbackScroll();
    removeFallbackScroll = null;
  }

  let updateRequested = false;
  let lastScrollTarget = null;

  const getScrollTop = () => {
    const documentScrollTop = Math.max(
      window.scrollY || 0,
      document.scrollingElement?.scrollTop || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    );

    const elementScrollTop =
      lastScrollTarget instanceof Element ? lastScrollTarget.scrollTop || 0 : 0;

    return Math.max(documentScrollTop, elementScrollTop);
  };

  const updateFromScroll = () => {
    updateRequested = false;

    const progress = clamp(getScrollTop() / getFadeDistance(), 0, 1);

    scrollOpacity.value = opacityStart + (opacityEnd - opacityStart) * progress;

    applyBlobOpacities();
  };

  const requestUpdate = (event = null) => {
    if (event?.target instanceof Element) {
      lastScrollTarget = event.target;
    }

    if (updateRequested) return;

    updateRequested = true;
    requestAnimationFrame(updateFromScroll);
  };

  document.addEventListener('scroll', requestUpdate, {
    capture: true,
    passive: true,
  });

  window.addEventListener('resize', requestUpdate, {
    passive: true,
  });

  removeFallbackScroll = () => {
    document.removeEventListener('scroll', requestUpdate, true);
    window.removeEventListener('resize', requestUpdate);
  };

  updateFromScroll();
}

/**
 * Animate one blob's ambient movement and shape.
 * @param {SVGGElement} group
 * @param {SVGPathElement} path
 * @param {number} centreX
 * @param {number} centreY
 * @param {number} size
 * @param {number} index
 * @returns {void}
 */
function animateBlob(group, path, centreX, centreY, size, index) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.set(group, {
    x: centreX,
    y: centreY,
    rotation: gsap.utils.random(-8, 8),
    transformOrigin: 'center',
  });

  if (reducedMotion) return;

  const driftX = gsap.utils.random(size * 0.08, size * 0.2);
  const driftY = gsap.utils.random(size * 0.08, size * 0.2);

  gsap.to(group, {
    x: centreX + gsap.utils.random(-driftX, driftX),
    y: centreY + gsap.utils.random(-driftY, driftY),
    rotation: gsap.utils.random(-14, 14),
    duration: gsap.utils.random(9, 16),
    delay: index * -0.17,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });

  const nextShape = makeSoftBlobPath(
    size,
    0.055 + Math.random() * 0.015,
    0.03 + Math.random() * 0.015,
    3,
    5,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );

  if (gsap.plugins?.MorphSVGPlugin) {
    gsap.to(path, {
      morphSVG: nextShape,
      duration: gsap.utils.random(7, 13),
      delay: index * -0.11,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  } else {
    gsap.to(path, {
      scaleX: gsap.utils.random(0.94, 1.07),
      scaleY: gsap.utils.random(0.94, 1.07),
      rotation: gsap.utils.random(-7, 7),
      transformOrigin: 'center',
      duration: gsap.utils.random(6, 11),
      delay: index * -0.13,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }
}

/**
 * Create and animate the background blob field.
 * @returns {void}
 */
export function animateGooeyBlobs() {
  const { svg, container, width, height } = ensureBlobDOM();

  if (svg.dataset.blobsAnimated === '1') {
    setupScrollOpacity(container);
    return;
  }

  svg.dataset.blobsAnimated = '1';
  container.replaceChildren();

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  const blobCount = isSafari ? (isMobile ? 10 : 16) : isMobile ? 14 : 28;

  const shortestSide = Math.min(width, height);

  for (let index = 0; index < blobCount; index += 1) {
    const size = gsap.utils.random(shortestSide * 0.2, shortestSide * 0.42);

    const centreX = gsap.utils.random(-size * 0.1, width + size * 0.1);

    const centreY = gsap.utils.random(-size * 0.1, height + size * 0.1);

    const group = /** @type {SVGGElement} */ (document.createElementNS(SVG_NS, 'g'));

    group.classList.add('blob-group');
    group.id = `blob-group-${index}`;

    const dragLayer = /** @type {SVGGElement} */ (document.createElementNS(SVG_NS, 'g'));

    dragLayer.classList.add('blob-drag-layer');

    const path = /** @type {SVGPathElement} */ (document.createElementNS(SVG_NS, 'path'));

    path.classList.add('blob');
    path.setAttribute('opacity', '1');
    path.setAttribute('fill-opacity', '1');

    path.setAttribute(
      'd',
      makeSoftBlobPath(
        size,
        0.055 + Math.random() * 0.015,
        0.03 + Math.random() * 0.015,
        3,
        5,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )
    );

    dragLayer.appendChild(path);
    group.appendChild(dragLayer);
    container.appendChild(group);

    setOpacity(group, 1);
    setOpacity(dragLayer, 1);
    setOpacity(path, 1);

    animateBlob(group, path, centreX, centreY, size, index);
  }

  setupScrollOpacity(container);
}

/**
 * Enable smooth jelly dragging without changing the selected blob mid-drag.
 *
 * Drag transforms are written to an inner layer, so they do not compete
 * with the ambient transform on .blob-group.
 *
 * @returns {void}
 */
export function enableInteractiveJellyBlob() {
  const { svg, container } = ensureBlobDOM();

  if (!svg.querySelector('.blob-group')) {
    animateGooeyBlobs();
  }

  if (svg.dataset.jellyEnabled === '1') return;

  svg.dataset.jellyEnabled = '1';

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const previous = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  const dragOrigin = { x: 0, y: 0 };
  const startPointer = { x: 0, y: 0 };

  /** @type {SVGGElement|null} */
  let activeBlob = null;

  /** @type {SVGGElement|null} */
  let activeDragLayer = null;

  /** @type {DOMMatrix|null} */
  let dragInverseMatrix = null;

  let activePointerId = null;
  let isDragging = false;
  let currentAngle = 0;
  let currentStretch = 0;
  let previousFrameTime = performance.now();

  /**
   * Convert viewport coordinates using the matrix captured at drag start.
   * Keeping this matrix fixed prevents movement feedback and jitter.
   *
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{x: number, y: number}}
   */
  function getStableLocalPointer(clientX, clientY) {
    if (!dragInverseMatrix) {
      return { x: clientX, y: clientY };
    }

    const point = svg.createSVGPoint();

    point.x = clientX;
    point.y = clientY;

    const localPoint = point.matrixTransform(dragInverseMatrix);

    return {
      x: localPoint.x,
      y: localPoint.y,
    };
  }

  /**
   * Find a blob close to the pointer's visible position.
   *
   * Using the path bounds rather than the outer group's transform means a
   * blob can still be selected after it has been moved. The pickup radius
   * also leaves the rest of the page available for normal touch scrolling.
   *
   * @param {number} clientX
   * @param {number} clientY
   * @returns {SVGGElement|null}
   */
  function getClosestBlob(clientX, clientY) {
    const groups = svg.querySelectorAll('.blob-group');

    let closest = null;
    let closestDistance = Infinity;

    groups.forEach((group) => {
      if (group.hasAttribute('data-dragging')) return;

      const path = group.querySelector('.blob');
      if (!path) return;

      const bounds = path.getBoundingClientRect();

      if (!bounds.width || !bounds.height) return;

      const centreX = bounds.left + bounds.width / 2;
      const centreY = bounds.top + bounds.height / 2;

      const distance = Math.hypot(centreX - clientX, centreY - clientY);

      const pickupRadius = Math.max(48, Math.min(Math.min(bounds.width, bounds.height) * 0.5, 150));

      if (distance <= pickupRadius && distance < closestDistance) {
        closestDistance = distance;
        closest = group;
      }
    });

    return /** @type {SVGGElement|null} */ (closest);
  }

  /**
   * Start dragging and lock one blob until pointer release.
   *
   * @param {PointerEvent} event
   * @returns {void}
   */
  function startDrag(event) {
    if (isDragging) return;

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const eventTarget = event.target instanceof Element ? event.target : null;

    if (
      eventTarget?.closest('a, button, input, textarea, select, summary, [contenteditable="true"]')
    ) {
      return;
    }

    const selectedBlob = getClosestBlob(event.clientX, event.clientY);

    if (!selectedBlob) return;

    const selectedLayer = /** @type {SVGGElement|null} */ (
      selectedBlob.querySelector('.blob-drag-layer')
    );

    const matrix = selectedBlob.getScreenCTM();

    if (!selectedLayer || !matrix) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    activeBlob = selectedBlob;
    activeDragLayer = selectedLayer;
    activePointerId = event.pointerId;
    dragInverseMatrix = matrix.inverse();
    isDragging = true;

    gsap.killTweensOf(activeDragLayer);

    const localPointer = getStableLocalPointer(event.clientX, event.clientY);

    startPointer.x = localPointer.x;
    startPointer.y = localPointer.y;

    dragOrigin.x = Number(gsap.getProperty(activeDragLayer, 'x')) || 0;
    dragOrigin.y = Number(gsap.getProperty(activeDragLayer, 'y')) || 0;

    target.x = dragOrigin.x;
    target.y = dragOrigin.y;

    current.x = dragOrigin.x;
    current.y = dragOrigin.y;

    previous.x = current.x;
    previous.y = current.y;

    velocity.x = 0;
    velocity.y = 0;

    currentAngle = Number(gsap.getProperty(activeDragLayer, 'rotation')) || 0;
    currentStretch = 0;

    activeBlob.setAttribute('data-dragging', 'true');

    container.appendChild(activeBlob);

    setOpacity(activeBlob, 1);
    setOpacity(activeDragLayer, 1);

    const path = activeDragLayer.querySelector('.blob');

    if (path) {
      setOpacity(path, 1);
    }
  }

  /**
   * Update only the destination.
   * The animation loop supplies the smoothing.
   *
   * @param {PointerEvent} event
   * @returns {void}
   */
  function updateDrag(event) {
    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const localPointer = getStableLocalPointer(event.clientX, event.clientY);

    target.x = dragOrigin.x + localPointer.x - startPointer.x;
    target.y = dragOrigin.y + localPointer.y - startPointer.y;
  }

  /**
   * Settle the selected blob at its released position, then restore the
   * current scroll opacity. The outer group keeps supplying its ambient
   * movement, so the relocated blob continues floating with the field.
   *
   * @param {PointerEvent|null} event
   * @returns {void}
   */
  function endDrag(event = null) {
    if (!isDragging) return;

    if (event && event.pointerId !== activePointerId) {
      return;
    }

    if (event && dragInverseMatrix) {
      const localPointer = getStableLocalPointer(event.clientX, event.clientY);

      target.x = dragOrigin.x + localPointer.x - startPointer.x;
      target.y = dragOrigin.y + localPointer.y - startPointer.y;
    }

    const releasedBlob = activeBlob;
    const releasedLayer = activeDragLayer;
    const releasedX = target.x;
    const releasedY = target.y;

    isDragging = false;
    activePointerId = null;
    activeBlob = null;
    activeDragLayer = null;
    dragInverseMatrix = null;

    if (!releasedBlob || !releasedLayer) return;

    releasedBlob.setAttribute('data-dragging', 'returning');

    setOpacity(releasedBlob, 1);

    gsap.to(releasedLayer, {
      x: releasedX,
      y: releasedY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.75,
      ease: 'elastic.out(1, 0.55)',
      overwrite: true,

      onUpdate: () => {
        setOpacity(releasedLayer, 1);
      },

      onComplete: () => {
        restoreScrollOpacity(releasedBlob, container);
      },
    });
  }

  /**
   * Smoothly interpolate the drag layer toward the pointer.
   *
   * @param {number} time
   * @returns {void}
   */
  function animationLoop(time) {
    if (!svg.isConnected) return;

    requestAnimationFrame(animationLoop);

    const frameRatio = clamp((time - previousFrameTime) / 16.67, 0.5, 2);

    previousFrameTime = time;

    if (!isDragging || !activeDragLayer) return;

    previous.x = current.x;
    previous.y = current.y;

    const smoothing = 1 - Math.pow(1 - 0.16, frameRatio);

    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;

    const movementX = current.x - previous.x;
    const movementY = current.y - previous.y;

    velocity.x += (movementX - velocity.x) * 0.3;
    velocity.y += (movementY - velocity.y) * 0.3;

    const speed = Math.hypot(velocity.x, velocity.y);
    const maximumStretch = isSafari ? 0.12 : 0.18;
    const desiredStretch = Math.min(speed / 45, maximumStretch);

    currentStretch += (desiredStretch - currentStretch) * 0.24;

    if (speed > 0.025) {
      const desiredAngle = (Math.atan2(velocity.y, velocity.x) * 180) / Math.PI;

      const angleDifference = ((desiredAngle - currentAngle + 540) % 360) - 180;

      currentAngle += angleDifference * 0.18;
    }

    gsap.set(activeDragLayer, {
      x: current.x,
      y: current.y,
      rotation: currentAngle,
      scaleX: 1 + currentStretch,
      scaleY: 1 - currentStretch,
      transformOrigin: 'center',
    });

    setOpacity(activeDragLayer, 1);
  }

  /**
   * Stop native touch panning only while a blob is actively being moved.
   * Touches that did not begin close to a blob retain normal page scrolling.
   *
   * @param {TouchEvent} event
   * @returns {void}
   */
  function preventTouchScroll(event) {
    if (isDragging && event.cancelable) {
      event.preventDefault();
    }
  }

  window.addEventListener('pointerdown', startDrag, {
    passive: false,
  });

  window.addEventListener('pointermove', updateDrag, {
    passive: false,
  });

  window.addEventListener('pointerup', endDrag, {
    passive: true,
  });

  window.addEventListener('pointercancel', endDrag, {
    passive: true,
  });

  window.addEventListener('touchmove', preventTouchScroll, {
    passive: false,
  });

  window.addEventListener('blur', () => {
    endDrag();
  });

  requestAnimationFrame(animationLoop);
}
