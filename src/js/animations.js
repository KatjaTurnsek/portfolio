import { gsap } from "gsap";
import { MorphSVGPlugin } from "../../node_modules/gsap/MorphSVGPlugin.js";
import { ScrollTrigger } from "../../node_modules/gsap/ScrollTrigger.js";

gsap.registerPlugin(MorphSVGPlugin);
gsap.registerPlugin(ScrollTrigger);

export function animateWaveLine() {
  const original = "M0,15 C50,5 100,25 150,15 S250,25 300,15 S400,5 500,15";
  const alt = "M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15";

  gsap.to("#wavy-line path", {
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    morphSVG: {
      shape: alt,
    },
  });
}

// H2 waves
export function insertWaveLines() {
  const waveSVG = `
    <svg class="wavy-line" viewBox="0 0 500 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <polyline class="wavy-polyline" fill="none" stroke="currentColor" stroke-width="1" />
    </svg>
  `;

  const headings = document.querySelectorAll("h2");

  headings.forEach((heading) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = waveSVG;
    heading.insertAdjacentElement("afterend", wrapper.firstElementChild);
  });
}

export function animateCustomWaveLines() {
  const polylines = document.querySelectorAll(".wavy-polyline");

  polylines.forEach((polyline) => {
    const svg = polyline.closest("svg");
    const width = 500;
    const amplitude = 10;
    const frequency = 2;
    const segments = 100;
    const interval = width / segments;

    const points = [];

    for (let i = 0; i <= segments; i++) {
      const point = svg.createSVGPoint();
      point.x = i * interval;
      point.y = 15;

      points.push(point);
      polyline.points.appendItem(point);

      gsap
        .to(point, {
          y: 15 + Math.sin((i / segments) * Math.PI * frequency) * -amplitude,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
        .progress(i / segments);
    }

    // Redraw the polyline on every animation frame
    gsap.ticker.add(() => {
      for (let i = 0; i < points.length; i++) {
        polyline.points.getItem(i).y = points[i].y;
      }
    });
  });
}

export function animateTealBars() {
  const timeline = gsap.timeline();

  timeline.to(".bar-bg", {
    width: "100%",
    duration: 1.5,
    stagger: 1,
    ease: "power4.out",
  });

  timeline.to(
    ".bar-1",
    {
      width: "90%",
      duration: 1,
      ease: "power4.out",
    },
    "<+0.5"
  );

  timeline.to(
    ".bar-2",
    {
      width: "70%",
      duration: 1,
      ease: "power4.out",
    },
    "-=0.6"
  );

  timeline.to(
    ".bar-3",
    {
      width: "80%",
      duration: 1,
      ease: "power4.out",
    },
    "-=0.6"
  );

  timeline.to(
    ".bar-label",
    {
      opacity: 1,
      duration: 1.2,
      ease: "power2.out",
      stagger: 0.2,
    },
    "-=0.4"
  );
}

// --- Gooey Blobs with Group Wrappers ---
export function animateGooeyBlobs() {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const isMobile = VW < 768;
  const svgns = "http://www.w3.org/2000/svg";
  const container = document.getElementById("blobs-g");

  if (!container) return;

  const blobCount = 30;
  const clusterCenters = [
    { x: VW * 0.3, y: VH * 0.5 },
    { x: VW * 0.7, y: VH * 0.5 },
  ];

  const spread = isMobile ? 400 : 700;
  const motionDistance = isMobile ? 200 : 400;

  for (let i = 1; i <= blobCount; i++) {
    const center = clusterCenters[i % 2];
    const x = center.x + Math.random() * spread - spread / 2;
    const y = center.y + Math.random() * spread - spread / 2;
    const size = Math.floor(Math.random() * 60) + 80;

    const group = document.createElementNS(svgns, "g");
    group.setAttribute("class", "blob-group");
    group.setAttribute("id", `blob-group-${i}`);
    group.setAttribute("transform", "translate(0,0)");
    container.appendChild(group);

    const circle = document.createElementNS(svgns, "circle");
    circle.setAttribute("class", "blob");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", size);
    group.appendChild(circle);

    let pos = { x, y, rotation: 0 };
    gsap.set(group, { x: pos.x, y: pos.y });

    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatRefresh: true });
    const targetX1 = x + Math.random() * motionDistance - motionDistance / 2;
    const targetY1 = y + Math.random() * motionDistance - motionDistance / 2;
    const targetX2 = x + Math.random() * motionDistance - motionDistance / 2;
    const targetY2 = y + Math.random() * motionDistance - motionDistance / 2;

    tl.to(pos, {
      duration: 12 + Math.random() * 4,
      x: targetX1,
      y: targetY1,
      rotation: Math.random() > 0.5 ? "+=180" : "-=180",
      ease: "sine.inOut",
      onUpdate: () => {
        group.setAttribute(
          "transform",
          `translate(${pos.x},${pos.y}) rotate(${pos.rotation})`
        );
      },
    });

    tl.to(pos, {
      duration: 12 + Math.random() * 4,
      x: targetX2,
      y: targetY2,
      rotation: Math.random() > 0.5 ? "+=180" : "-=180",
      ease: "sine.inOut",
      onUpdate: () => {
        group.setAttribute(
          "transform",
          `translate(${pos.x},${pos.y}) rotate(${pos.rotation})`
        );
      },
    });

    gsap.to(circle, {
      scaleX: "random(0.9, 1.14)",
      scaleY: "random(0.9, 1.14)",
      duration: "random(2, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  // --- GSAP Scroll Fade-Out ---
  gsap.to(container, {
    opacity: 0.3,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

// --- Closest Blob Reacts to Mouse or Touch (Jelly Effect) ---
export function enableInteractiveJellyBlob() {
  const svg = document.getElementById("blob-svg");
  if (!svg) return;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let activeBlob = null;
  let isDragging = false;
  let originalTransforms = new Map();

  const getScale = (dx, dy) =>
    Math.min(Math.sqrt(dx * dx + dy * dy) / 500, 0.25);
  const getAngle = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;

  function getSVGCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function getClosestBlob(x, y) {
    const blobs = document.querySelectorAll(".blob-group");
    let closest = null;
    let minDist = Infinity;

    blobs.forEach((blob) => {
      const matrix = blob.getScreenCTM();
      if (!matrix) return;

      const cx = matrix.e;
      const cy = matrix.f;
      const dist = Math.hypot(cx - x, cy - y);
      const radius =
        parseFloat(blob.querySelector("circle")?.getAttribute("r")) || 60;

      if (dist < minDist) {
        minDist = dist;
        closest = blob;
      }
    });

    return closest;
  }

  function updatePointer(e) {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const svgPos = getSVGCoords(clientX, clientY);

    target.x = svgPos.x;
    target.y = svgPos.y;

    const closestBlob = getClosestBlob(clientX, clientY);
    if (closestBlob && closestBlob !== activeBlob) {
      if (activeBlob) returnBlobToOriginal(activeBlob);
      activeBlob = closestBlob;

      if (!originalTransforms.has(activeBlob)) {
        const transform = gsap.getProperty(activeBlob);
        originalTransforms.set(activeBlob, {
          x: transform("x"),
          y: transform("y"),
          rotation: transform("rotation"),
          scaleX: transform("scaleX"),
          scaleY: transform("scaleY"),
        });
      }

      gsap.killTweensOf(activeBlob);
    }
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!isDragging || !activeBlob) return;

    vel.x = target.x - current.x;
    vel.y = target.y - current.y;

    current.x += vel.x * 0.1;
    current.y += vel.y * 0.1;

    const angle = getAngle(vel.x, vel.y);
    const scale = getScale(vel.x, vel.y);

    gsap.set(activeBlob, {
      x: current.x,
      y: current.y,
      rotation: angle + "_short",
      scaleX: 1 + scale,
      scaleY: 1 - scale,
      transformOrigin: "center",
    });
  }

  function returnBlobToOriginal(blob) {
    const original = originalTransforms.get(blob);
    if (!original) return;

    let targetY = Math.max(original.y, 400);

    gsap.to(blob, {
      x: original.x,
      y: targetY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.8,
      ease: "power2.out",
    });
  }

  window.addEventListener("mousedown", (e) => {
    isDragging = true;
    updatePointer(e);
  });
  window.addEventListener("touchstart", (e) => {
    isDragging = true;
    updatePointer(e);
  });

  window.addEventListener("mousemove", updatePointer);
  window.addEventListener("touchmove", updatePointer);

  window.addEventListener("mouseup", () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  });
  window.addEventListener("touchend", () => {
    isDragging = false;
    if (activeBlob) returnBlobToOriginal(activeBlob);
    activeBlob = null;
  });

  loop();
}

// --- Dripping Waves on Top ---
export function animateTopDrippingWaves() {
  const canvas = document.getElementById("top-waves-canvas");
  const ctx = canvas.getContext("2d");
  const resolution = window.devicePixelRatio || 1;

  let vw, vh;
  let waves = [];
  let resized = false;
  let waveOffset = 0;

  resizeCanvas();
  initWaves();
  gsap.ticker.add(update);
  window.addEventListener("resize", () => (resized = true));

  function isMobile() {
    return window.innerWidth < 850;
  }

  function resizeCanvas() {
    vw = window.innerWidth;
    vh = isMobile() ? 200 : 300;

    canvas.width = vw * resolution;
    canvas.height = vh * resolution;
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(resolution, resolution);
  }

  function getCssVar(varName, fallback) {
    const value = getComputedStyle(document.body).getPropertyValue(varName);
    return value.trim() || fallback;
  }

  function initWaves() {
    waves = [];

    const wave1 = createWave({
      amplitude: isMobile() ? 40 : 100,
      duration: 8, // slower animation
      frequency: 0.5,
      segments: 100,
      waveHeight: isMobile() ? 70 : vh * 0.4,
      colorVar: "--wave-color-1",
    });

    const wave2 = createWave({
      amplitude: isMobile() ? 20 : 50,
      duration: 10,
      frequency: 0.3,
      segments: 100,
      waveHeight: isMobile() ? 75 : vh * 0.4,
      colorVar: "--wave-color-2",
    });

    gsap.to(wave1, {
      duration: 36, // slower
      amplitude: isMobile() ? 6 : 100,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(wave2, {
      duration: 44,
      amplitude: isMobile() ? 5 : 80,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to([wave1, wave2], {
      duration: 64,
      waveHeight: vh / 2,
      ease: "sine.inOut",
      repeat: -1,
      repeatDelay: 1,
      yoyo: true,
    });

    waves.push(wave1, wave2);
  }

  function update() {
    if (resized) {
      resizeCanvas();
      waves.forEach((wave) => wave.resize(vw, vh));
      resized = false;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "source-over";

    waves.forEach((wave) => {
      wave.draw(); // just draw based on current tween state
    });
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      frequency: options.frequency,
      duration: options.duration,
      segments: options.segments,
      waveHeight: options.waveHeight,
      colorVar: options.colorVar,
      points: [],
      tweens: [],
      width: vw,
      height: vh,

      init,
      resize,
      draw,
    };

    function init() {
      wave.points = [];
      wave.tweens = [];
      const interval = wave.width / wave.segments;

      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, {
            duration: wave.duration,
            y: -1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          })
          .progress((i / wave.segments) * wave.frequency);

        wave.tweens.push(tween);
        wave.points.push(point);
      }
    }

    function resize(width, height) {
      wave.width = width;
      wave.height = height;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    function draw() {
      const height = wave.amplitude / 2;
      const startY = wave.waveHeight;
      const fill = getCssVar(wave.colorVar, "rgba(0,0,0,0.2)");

      ctx.beginPath();
      ctx.moveTo(wave.points[0].x, startY - wave.points[0].y * height);

      for (let i = 1; i < wave.points.length - 1; i++) {
        const current = wave.points[i];
        const next = wave.points[i + 1];
        const cx = (current.x + next.x) / 2;
        const cy = startY - ((current.y + next.y) / 2) * height;
        ctx.quadraticCurveTo(current.x, startY - current.y * height, cx, cy);
      }

      const last = wave.points[wave.points.length - 1];
      ctx.lineTo(last.x, startY - last.y * height);
      ctx.lineTo(wave.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    wave.init();
    return wave;
  }
}

// --- Menu Dripping Waves ---
export function animateMenuDrippingWaves() {
  const canvas = document.getElementById("menu-waves-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const resolution = window.devicePixelRatio || 1;

  let vw, vh;
  let waves = [];
  let resized = false;

  resizeCanvas();
  initWaves();
  gsap.ticker.add(update);
  window.addEventListener("resize", () => (resized = true));

  function isMobile() {
    return window.innerWidth < 850;
  }

  function resizeCanvas() {
    vw = window.innerWidth;
    vh = isMobile() ? 200 : 300;

    canvas.width = vw * resolution;
    canvas.height = vh * resolution;
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(resolution, resolution);
  }

  function getCssVar(varName, fallback) {
    const value = getComputedStyle(document.body).getPropertyValue(varName);
    return value.trim() || fallback;
  }

  function initWaves() {
    waves = [];

    const wave1 = createWave({
      amplitude: isMobile() ? 40 : 100,
      duration: 8,
      frequency: 0.5,
      segments: 100,
      waveHeight: isMobile() ? 70 : vh * 0.4,
      colorVar: "--wave-color-1",
    });

    const wave2 = createWave({
      amplitude: isMobile() ? 20 : 50,
      duration: 10,
      frequency: 0.3,
      segments: 100,
      waveHeight: isMobile() ? 75 : vh * 0.4,
      colorVar: "--wave-color-2",
    });

    gsap.to(wave1, {
      duration: 36,
      amplitude: isMobile() ? 6 : 100,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(wave2, {
      duration: 44,
      amplitude: isMobile() ? 5 : 80,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to([wave1, wave2], {
      duration: 64,
      waveHeight: vh / 2,
      ease: "sine.inOut",
      repeat: -1,
      repeatDelay: 1,
      yoyo: true,
    });

    waves.push(wave1, wave2);
  }

  function update() {
    if (resized) {
      resizeCanvas();
      waves.forEach((wave) => wave.resize(vw, vh));
      resized = false;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "source-over";

    waves.forEach((wave) => {
      wave.draw();
    });
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      frequency: options.frequency,
      duration: options.duration,
      segments: options.segments,
      waveHeight: options.waveHeight,
      colorVar: options.colorVar,
      points: [],
      tweens: [],
      width: vw,
      height: vh,

      init,
      resize,
      draw,
    };

    function init() {
      wave.points = [];
      wave.tweens = [];
      const interval = wave.width / wave.segments;

      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, {
            duration: wave.duration,
            y: -1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          })
          .progress((i / wave.segments) * wave.frequency);

        wave.tweens.push(tween);
        wave.points.push(point);
      }
    }

    function resize(width, height) {
      wave.width = width;
      wave.height = height;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    function draw() {
      const height = wave.amplitude / 2;
      const startY = wave.waveHeight;
      const fill = getCssVar(wave.colorVar, "rgba(0,0,0,0.2)");

      ctx.beginPath();
      ctx.moveTo(wave.points[0].x, startY - wave.points[0].y * height);

      for (let i = 1; i < wave.points.length; i++) {
        const pt = wave.points[i];
        ctx.lineTo(pt.x, startY - pt.y * height);
      }

      ctx.lineTo(wave.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    wave.init();
    return wave;
  }
}
