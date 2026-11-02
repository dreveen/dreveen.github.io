// "The real me": Van Gogh's The Starry Night (1889, public domain) as a living background.
// Layers: the painting itself, a thin layer of brush strokes that swirl over it, and softly pulsing stars.
(function () {
  const art = document.getElementById("meArt");
  const sky = document.getElementById("meSky");
  const starsCv = document.getElementById("meStars");
  if (!art || !sky || !starsCv) return;
  const actx = art.getContext("2d");
  const sctx = sky.getContext("2d");
  const tctx = starsCv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // entrance: walk into the framed painting
  const gate = document.getElementById("meGate");
  const enter = document.getElementById("meEnter");
  const gateFrame = document.getElementById("meFrame");
  let going = false;
  function open() {
    if (going) return; going = true;
    if (gate) gate.classList.add("entering");
    setTimeout(() => { document.body.classList.add("entered"); window.scrollTo(0, 0); }, reduce ? 0 : 1500);
  }
  if (enter) enter.addEventListener("click", open);
  if (gateFrame) gateFrame.addEventListener("click", open);
  if (enter && document.documentElement.classList.contains("js")) setTimeout(() => enter.focus({ preventScroll: true }), 300);

  // stars and moon of the painting, as fractions of the image (x, y) and of its width (r)
  const STARS = [
    { x: 0.906, y: 0.173, r: 0.09, ph: 0.4, moon: true },
    { x: 0.105, y: 0.044, r: 0.034, ph: 1.1 }, { x: 0.23, y: 0.035, r: 0.021, ph: 2.2 }, { x: 0.344, y: 0.04, r: 0.03, ph: 3.3 },
    { x: 0.41, y: 0.064, r: 0.024, ph: 4.1 }, { x: 0.61, y: 0.084, r: 0.04, ph: 5.0 }, { x: 0.238, y: 0.173, r: 0.035, ph: 0.9 },
    { x: 0.707, y: 0.232, r: 0.036, ph: 2.7 }, { x: 0.324, y: 0.325, r: 0.028, ph: 3.9 }, { x: 0.348, y: 0.528, r: 0.062, ph: 1.6 },
    { x: 0.047, y: 0.449, r: 0.024, ph: 4.8 }, { x: 0.129, y: 0.478, r: 0.03, ph: 5.7 },
  ];
  // the two big spirals of the sky, so the strokes turn around them like in the painting
  const SPIRALS = [{ x: 0.5, y: 0.345, r: 0.16 }, { x: 0.69, y: 0.48, r: 0.08 }];

  const img = new Image();
  let ready = false;
  let W = 0, H = 0, dpr = 1;
  let s = 1, ox = 0, oy = 0; // painting -> screen transform
  let prog = 0;
  let samp = null, sw = 0, sh = 0; // small copy of the painting to read colours from
  const pointer = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };
  let t = 0, last = 0, running = true;

  function layout() {
    // cover the screen with a little extra, then pan across the painting while scrolling (the corridor walk)
    s = Math.max(W / img.width, H / img.height) * 1.1;
    const ow = img.width * s - W, oh = img.height * s - H;
    ox = -ow * (0.12 + 0.76 * prog);
    oy = -oh * (0.5 - 0.25 * prog);
  }
  function drawArt() {
    if (!ready) return;
    layout();
    actx.fillStyle = "#050d24"; actx.fillRect(0, 0, W, H);
    actx.drawImage(img, ox, oy, img.width * s, img.height * s);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.floor(window.innerWidth * dpr);
    H = Math.floor(window.innerHeight * dpr);
    art.width = sky.width = starsCv.width = W;
    art.height = sky.height = starsCv.height = H;
    drawArt();
    if (ready) drawStars(0);
  }

  const toScreen = (fx, fy) => ({ x: ox + fx * img.width * s, y: oy + fy * img.height * s });
  function colorAt(x, y) {
    const ix = Math.min(sw - 1, Math.max(0, Math.floor(((x - ox) / (img.width * s)) * sw)));
    const iy = Math.min(sh - 1, Math.max(0, Math.floor(((y - oy) / (img.height * s)) * sh)));
    const i = (iy * sw + ix) * 4;
    return [samp[i], samp[i + 1], samp[i + 2]];
  }

  function field(x, y) {
    const f = img.width * s;
    let vx = Math.cos(y * 0.006 / dpr + t * 0.12) * 0.5;
    let vy = Math.sin(x * 0.005 / dpr - t * 0.1) * 0.35;
    for (let i = 0; i < SPIRALS.length; i++) {
      const p = toScreen(SPIRALS[i].x, SPIRALS[i].y), R = SPIRALS[i].r * f;
      const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) + 1;
      const k = 2.1 * Math.exp(-d / (R * 1.6));
      vx += (-dy / d) * k; vy += (dx / d) * k;
    }
    for (let i = 0; i < STARS.length; i++) {
      const p = toScreen(STARS[i].x, STARS[i].y), R = STARS[i].r * f;
      const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) + 1;
      const k = 1.8 * Math.exp(-d / (R * 2.4));
      vx += (-dy / d) * k; vy += (dx / d) * k;
    }
    return [vx, vy];
  }

  function paint(n) {
    sctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      let x = Math.random() * W, y = Math.random() * H;
      const c = colorAt(x, y), l = 1.12;
      sctx.strokeStyle = "rgb(" + Math.min(255, c[0] * l) + "," + Math.min(255, c[1] * l) + "," + Math.min(255, c[2] * l) + ")";
      sctx.globalAlpha = 0.22 + Math.random() * 0.3;
      sctx.lineWidth = (2.5 + Math.random() * 4.5) * dpr;
      sctx.beginPath(); sctx.moveTo(x, y);
      const step = (4 + Math.random() * 4) * dpr;
      for (let k = 0; k < 8; k++) {
        const v = field(x, y), m = Math.hypot(v[0], v[1]) || 1;
        x += (v[0] / m) * step; y += (v[1] / m) * step;
        sctx.lineTo(x, y);
      }
      sctx.stroke();
    }
    sctx.globalAlpha = 1;
  }

  function drawStars(time) {
    tctx.clearRect(0, 0, W, H);
    tctx.globalCompositeOperation = "lighter";
    pointer.sx += (pointer.x - pointer.sx) * 0.04; pointer.sy += (pointer.y - pointer.sy) * 0.04;
    const f = img.width * s || 1;
    for (let i = 0; i < STARS.length; i++) {
      const st = STARS[i], p = toScreen(st.x, st.y);
      const cx = p.x + (pointer.sx - 0.5) * 10 * dpr, cy = p.y + (pointer.sy - 0.5) * 10 * dpr;
      if (cx < -300 || cy < -300 || cx > W + 300 || cy > H + 300) continue;
      const pulse = reduce ? 1 : 1 + 0.1 * Math.sin(time * 0.75 + st.ph);
      const R = st.r * f * pulse;
      const g = tctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.4);
      g.addColorStop(0, "rgba(255,244,190,0.5)");
      g.addColorStop(0.25, "rgba(255,222,110,0.3)");
      g.addColorStop(0.6, "rgba(242,190,60,0.1)");
      g.addColorStop(1, "rgba(242,190,60,0)");
      tctx.fillStyle = g;
      tctx.beginPath(); tctx.arc(cx, cy, R * 2.4, 0, Math.PI * 2); tctx.fill();
    }
    tctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < 40) return; // about 25 fps, calm and light
    const dt = Math.min(0.1, (now - last) / 1000 || 0.04);
    last = now; t += dt;
    // old strokes dissolve back into the painting while new ones swirl in
    sctx.globalCompositeOperation = "destination-out"; sctx.fillStyle = "rgba(0,0,0,0.05)"; sctx.fillRect(0, 0, W, H);
    sctx.globalCompositeOperation = "source-over";
    paint(Math.max(50, Math.round((W * H) / 11000)));
    drawStars(t);
  }

  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    prog = Math.min(1, window.scrollY / max);
    document.documentElement.style.setProperty("--p", prog.toFixed(3));
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; drawArt(); if (reduce) drawStars(0); }); }
  }, { passive: true });
  window.addEventListener("pointermove", (e) => { pointer.x = e.clientX / window.innerWidth; pointer.y = e.clientY / window.innerHeight; }, { passive: true });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden && !reduce;
    if (running) requestAnimationFrame(frame);
  });

  img.onload = () => {
    // a small copy to read the painting's colours from
    const c = document.createElement("canvas");
    sw = 256; sh = Math.round(256 * img.height / img.width);
    c.width = sw; c.height = sh;
    const cc = c.getContext("2d"); cc.drawImage(img, 0, 0, sw, sh);
    samp = cc.getImageData(0, 0, sw, sh).data;
    ready = true;
    resize();
    document.body.classList.add("art-ready");
    if (!reduce) requestAnimationFrame(frame);
  };
  img.src = "starry-night.jpg";
  resize();
})();
