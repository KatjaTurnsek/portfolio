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
    { x: VW * 0.3, y: VH * 0.4 },
    { x: VW * 0.7, y: VH * 0.6 },
  ];

  const spread = isMobile ? 400 : 700;
  const motionDistance = isMobile ? 100 : 250;

  for (let i = 1; i <= blobCount; i++) {
    const center = clusterCenters[i % 2];
    const x = center.x + Math.random() * spread - spread / 2;
    const y = center.y + Math.random() * spread - spread / 2;
    const size = Math.floor(Math.random() * 60) + 80;

    const group = document.createElementNS(svgns, "g");
    group.setAttribute("class", "blob-group");
    group.setAttribute("id", `blob-group-${i}`);
    group.setAttribute("transform", "translate(0,0)");
    gsap.set(group, { x, y });

    const circle = document.createElementNS(svgns, "circle");
    circle.setAttribute("class", "blob");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", size);

    group.appendChild(circle);
    container.appendChild(group);

    // Animate the group position and rotation
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatRefresh: true });
    const targetX1 = x + Math.random() * motionDistance - motionDistance / 2;
    const targetY1 = y + Math.random() * motionDistance - motionDistance / 2;
    const targetX2 = x + Math.random() * motionDistance - motionDistance / 2;
    const targetY2 = y + Math.random() * motionDistance - motionDistance / 2;

    tl.to(group, {
      duration: 15 + Math.random() * 4, // faster movement
      x: targetX1,
      y: targetY1,
      rotation: Math.random() > 0.5 ? "+=180" : "-=180",
      ease: "sine.inOut",
    }).to(group, {
      duration: 15 + Math.random() * 4,
      x: targetX2,
      y: targetY2,
      rotation: Math.random() > 0.5 ? "+=180" : "-=180",
      ease: "sine.inOut",
    });

    // Subtle jelly scaling
    gsap.to(circle, {
      scaleX: "random(0.92, 1.08)",
      scaleY: "random(0.92, 1.08)",
      duration: "random(3, 6)",
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
      if (activeBlob) returnBlobToOriginal(activeBlob); // reset previous
      activeBlob = closestBlob;

      // store original transform if not already stored
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

      // Stop any ongoing drift animation temporarily
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

    gsap.to(blob, {
      x: original.x,
      y: original.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 1.2,
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
