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

export function insertWaveLines() {
  const waveSVG = `
     <svg id="wavy-line" class="wavy-line" viewBox="0 0 500 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path id="wavy-path" d="M0,15 C50,5 100,25 150,15 S250,25 300,15 S400,5 500,15"></path></svg>
  `;

  const headings = document.querySelectorAll("h2");

  headings.forEach((heading) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = waveSVG;
    heading.insertAdjacentElement("afterend", wrapper.firstElementChild);
  });
}

export function animateCustomWaveLines() {
  const wavePaths = document.querySelectorAll(
    ".custom-wave-line .wavy-line path"
  );

  wavePaths.forEach((path) => {
    gsap.to(path, {
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      morphSVG: {
        shape: "M0,15 C50,25 100,5 150,15 S250,5 300,15 S400,25 500,15",
      },
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

  resizeCanvas();
  initWaves();

  gsap.ticker.add(update);
  window.addEventListener("resize", () => {
    resized = true;
  });

  function isMobile() {
    return window.innerWidth < 768;
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

  function initWaves() {
    waves = [];

    const syncedSegments = 120;
    const syncedDuration = isMobile() ? 16 : 18;
    const syncedFrequency = 1.25;

    waves.push(
      createWave({
        amplitude: isMobile() ? 80 : 160,
        duration: isMobile() ? 14 : 17,
        frequency: 1.5,
        segments: 120,
        waveHeight: isMobile() ? 90 : 120,
        colorVar: "--wave-color-1",
      }),
      createWave({
        amplitude: isMobile() ? 60 : 120,
        duration: isMobile() ? 16 : 20,
        frequency: 1,
        segments: 100,
        waveHeight: isMobile() ? 50 : 80,
        colorVar: "--wave-color-2",
      })
    );
  }

  function update() {
    if (resized) {
      resizeCanvas();
      initWaves();
      waves.forEach((wave) => wave.resize(vw));
      resized = false;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "source-over";

    for (let wave of waves) {
      wave.draw();
    }
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      duration: options.duration,
      frequency: options.frequency,
      waveHeight: options.waveHeight,
      segments: options.segments,
      colorVar: options.colorVar,
      points: [],
      width: window.innerWidth,
      tweens: [],
      init,
      resize,
      draw,
    };

    function init() {
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, {
            y: -1,
            duration: wave.duration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          })
          .progress((i / wave.segments) * wave.frequency);
        wave.tweens.push(tween);
        wave.points.push(point);
      }
    }

    function draw() {
      const styles = getComputedStyle(document.body);
      const color = styles.getPropertyValue(wave.colorVar).trim();
      const height = wave.amplitude / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wave.width, 0);
      ctx.lineTo(
        wave.width,
        wave.waveHeight + wave.points[wave.points.length - 1].y * height
      );

      for (let i = wave.points.length - 1; i >= 0; i--) {
        const pt = wave.points[i];
        ctx.lineTo(pt.x, wave.waveHeight + pt.y * height);
      }

      ctx.lineTo(0, wave.waveHeight + wave.points[0].y * height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function resize(width) {
      wave.width = width;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    init();
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
  window.addEventListener("resize", () => {
    resized = true;
  });

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

  function initWaves() {
    waves = [];

    waves.push(
      createWave({
        amplitude: isMobile() ? 80 : 160,
        duration: isMobile() ? 14 : 17,
        frequency: 1.5,
        segments: 120,
        waveHeight: isMobile() ? 90 : 120,
        colorVar: "--wave-color-1",
      }),
      createWave({
        amplitude: isMobile() ? 60 : 120,
        duration: isMobile() ? 16 : 20,
        frequency: 1,
        segments: 100,
        waveHeight: isMobile() ? 50 : 80,
        colorVar: "--wave-color-2",
      })
    );
  }

  function update() {
    if (resized) {
      resizeCanvas();
      initWaves();
      waves.forEach((wave) => wave.resize(vw));
      resized = false;
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "source-over";

    for (let wave of waves) {
      wave.draw();
    }
  }

  function createWave(options) {
    const wave = {
      amplitude: options.amplitude,
      duration: options.duration,
      frequency: options.frequency,
      waveHeight: options.waveHeight,
      segments: options.segments,
      colorVar: options.colorVar,
      points: [],
      width: window.innerWidth,
      tweens: [],
      init,
      resize,
      draw,
    };

    function init() {
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        const point = { x: i * interval, y: 1 };
        const tween = gsap
          .to(point, {
            y: -1,
            duration: wave.duration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          })
          .progress((i / wave.segments) * wave.frequency);
        wave.tweens.push(tween);
        wave.points.push(point);
      }
    }

    function draw() {
      const styles = getComputedStyle(document.body);
      const color = styles.getPropertyValue(wave.colorVar).trim();
      const height = wave.amplitude / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wave.width, 0);
      ctx.lineTo(
        wave.width,
        wave.waveHeight + wave.points[wave.points.length - 1].y * height
      );

      for (let i = wave.points.length - 1; i >= 0; i--) {
        const pt = wave.points[i];
        ctx.lineTo(pt.x, wave.waveHeight + pt.y * height);
      }

      ctx.lineTo(0, wave.waveHeight + wave.points[0].y * height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function resize(width) {
      wave.width = width;
      const interval = wave.width / wave.segments;
      for (let i = 0; i <= wave.segments; i++) {
        wave.points[i].x = i * interval;
      }
    }

    init();
    return wave;
  }
}
