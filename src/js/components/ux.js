import gsap from 'gsap';

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * NEW behavior: hide legacy canvases and make sure wave hosts are visible
 * for ALL browsers (not only Safari). Safe if canvases aren't present.
 * Backward-compatible name so old imports keep working.
 */
export function enableSafariWaveFallback() {
  // Hide any leftover canvases
  ['#top-waves-canvas', '#menu-waves-canvas'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  // Ensure our hosts are visible (JS injects a single <img.waves-fallback>)
  ['.top-waves', '.menu-waves'].forEach((sel) => {
    const host = document.querySelector(sel);
    if (!host) return;
    host.style.display = 'block';
    host.style.pointerEvents = 'none';
    // If CSS isn’t applied yet, give them a reasonable default height
    if (!host.style.height) host.style.height = '160px';
    // Never mask the image
    host.style.overflow = 'visible';
  });
}

/**
 * Keep will-change hints light & correct. Target the new .waves-fallback image.
 * Limit scope to Safari (as originally intended) to avoid excessive hints elsewhere.
 */
export function addSafariWillChange() {
  if (!isSafari) return;
  const selectors = [
    '.blob-group',
    '.blob',
    '.bar-bg',
    '.bar-1',
    '.bar-2',
    '.bar-3',
    '.bar-label',
    '.wavy-line',
    '.wavy-polyline',
    // updated targets for waves:
    '.top-waves .waves-fallback',
    '.menu-waves .waves-fallback',
  ];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.willChange = 'transform, opacity';
    });
  });
}

/**
 * Sequentially fade in a batch of images (cards, gallery, etc).
 */
export function revealImagesSequentially(images) {
  let delay = 0;
  const fadeIn = (img, onComplete) => {
    gsap.to(img, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      delay,
      ease: 'power2.out',
      onComplete,
    });
    delay += 0.075;
  };
  const loadNext = (i) => {
    if (i >= images.length) return;
    const img = images[i];
    if (img.complete) {
      fadeIn(img, () => loadNext(i + 1));
    } else {
      img.onload = () => fadeIn(img, () => loadNext(i + 1));
      img.onerror = () => loadNext(i + 1);
    }
  };
  loadNext(0);
}

/**
 * Prevent text selection during drag interactions (minor UX polish).
 */
export function enableNoSelectDuringInteraction() {
  const body = document.body;
  const addNoSelect = () => body.classList.add('no-select');
  const removeNoSelect = () => body.classList.remove('no-select');
  document.addEventListener('mousedown', addNoSelect);
  document.addEventListener('mouseup', removeNoSelect);
  document.addEventListener('touchstart', addNoSelect);
  document.addEventListener('touchend', removeNoSelect);
}
