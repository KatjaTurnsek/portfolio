function animateWave() {
  const path = document.querySelector(".wave");
  if (!path) return;

  const width = 100;
  const height = 10;
  const midY = height / 2;
  const amplitude = 1;
  const frequency = 2;
  const startX = 1;
  const endX = 99;
  const points = 100;

  let t = 0;

  function draw() {
    let d = "";
    for (let i = 0; i <= points; i++) {
      const x = startX + ((endX - startX) * i) / points;
      const y =
        midY + Math.sin((i / points) * frequency * Math.PI * 2 + t) * amplitude;
      d +=
        i === 0
          ? `M${x.toFixed(2)},${y.toFixed(2)}`
          : ` L${x.toFixed(2)},${y.toFixed(2)}`;
    }
    path.setAttribute("d", d);
    t += 0.02;
    requestAnimationFrame(draw);
  }

  draw();
}

export function showLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.classList.remove("hidden");
    animateWave();
  }
}

export function hideLoader() {
  const loader = document.querySelector(".loader");
  if (loader) loader.classList.add("hidden");
}
