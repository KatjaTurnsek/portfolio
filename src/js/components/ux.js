import gsap from 'gsap';

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export function enableSafariWaveFallback() {
  if (!isSafari) return;
  const topCanvas = document.getElementById('top-waves-canvas');
  if (topCanvas) topCanvas.style.display = 'none';
  const menuCanvas = document.getElementById('menu-waves-canvas');
  if (menuCanvas) menuCanvas.style.display = 'none';
  const topWaves = document.querySelector('.top-waves');
  if (topWaves) topWaves.style.display = 'block';
  const menuWaves = document.querySelector('.menu-waves');
  if (menuWaves) menuWaves.style.display = 'block';
}

export function addSafariWillChange() {
  if (!isSafari) return;
  [
    '.blob-group',
    '.blob',
    '.bar-bg',
    '.bar-1',
    '.bar-2',
    '.bar-3',
    '.bar-label',
    '.wavy-line',
    '.wavy-polyline',
    '#top-waves-canvas',
    '#menu-waves-canvas',
    '.top-waves img',
    '.menu-waves img',
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.willChange = 'transform, opacity';
    });
  });
}

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

export function enableNoSelectDuringInteraction() {
  const body = document.body;
  const addNoSelect = () => body.classList.add('no-select');
  const removeNoSelect = () => body.classList.remove('no-select');
  document.addEventListener('mousedown', addNoSelect);
  document.addEventListener('mouseup', removeNoSelect);
  document.addEventListener('touchstart', addNoSelect);
  document.addEventListener('touchend', removeNoSelect);
}
