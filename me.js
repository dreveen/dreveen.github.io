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

  // entrance: a painted starry night; touching its glowing star floods the screen with light and opens the room
  const gate = document.getElementById("meGate");
  const enterBtn = document.getElementById("meEnter");
  const gsky = document.getElementById("meGateSky");
  const gst = document.getElementById("meGateStars");
  let gateRun = !!(gsky && gst);
  let going = false;
  function open() {
    if (going) return; going = true;
    if (gate) gate.classList.add("entering");
    setTimeout(() => { document.body.classList.add("entered"); gateRun = false; window.scrollTo(0, 0); }, reduce ? 0 : 1700);
  }
  if (enterBtn) {
    enterBtn.addEventListener("click", open);
    if (document.documentElement.classList.contains("js")) setTimeout(() => enterBtn.focus({ preventScroll: true }), 400);
  }
  if (!gate) document.body.classList.add("entered");
  if (gateRun) {
    const g1 = gsky.getContext("2d"), g2 = gst.getContext("2d");
    const GB = ["#081a4f", "#0e2a78", "#173f9c", "#2456c0", "#3b78dc", "#6aa3f0", "#a9d0ff"];
    const GY = ["#c99a1f", "#f2d25b", "#ffe9a0", "#fff6cf"];
    // a lighter sky: a few stars of different sizes (same soft glowing look as before)
    // Placed by chance on every visit, but never on the centre star, the text, the language switch or on each other.
    const GS = [], DOTS = [];
    (function scatter() {
      const free = (x, y, minD) => {
        if (Math.hypot((x - 0.5) * 1.1, y - 0.46) < 0.24) return false;                 // the central star
        if (x > 0.26 && x < 0.74 && y > 0.54 && y < 0.68) return false;                // the sentence
        if (x > 0.74 && y < 0.1) return false;                                          // language switch
        if (y > 0.9 && x > 0.3 && x < 0.7) return false;                               // "Not now"
        return GS.every((s) => Math.hypot(x - s.x, y - s.y) > minD);
      };
      let tries = 0;
      while (GS.length < 8 && tries++ < 400) {
        const x = 0.07 + Math.random() * 0.86, y = 0.06 + Math.random() * 0.88;
        if (!free(x, y, 0.2)) continue;
        GS.push({ x: x, y: y, r: 0.022 + Math.random() * 0.03, ph: Math.random() * 6.28 });
      }
    })();
    let gw = 0, gh = 0, gd = 1, gt = 0, gl = 0, grt;
    const gp = (s) => ({ x: s.x * gw, y: s.y * gh, R: s.r * (gw + gh) * 0.5 });
    function gfield(x, y) {
      let vx = Math.cos(y * 0.007 / gd + gt * 0.12) * 0.7, vy = Math.sin(x * 0.006 / gd - gt * 0.1) * 0.5;
      // one big whirl around the central star, smaller ones around the others
      const c = { x: gw * 0.5, y: gh * 0.46 }, dx0 = x - c.x, dy0 = y - c.y, d0 = Math.hypot(dx0, dy0) + 1, k0 = 3.2 * Math.exp(-d0 / (Math.min(gw, gh) * 0.55));
      vx += (-dy0 / d0) * k0; vy += (dx0 / d0) * k0;
      for (let i = 0; i < GS.length; i++) {
        const p = gp(GS[i]), dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) + 1, k = 1.8 * Math.exp(-d / (p.R * 3.2));
        vx += (-dy / d) * k; vy += (dx / d) * k;
      }
      return [vx, vy];
    }
    function gcolor(x, y) {
      for (let i = 0; i < GS.length; i++) { const p = gp(GS[i]); if (Math.hypot(x - p.x, y - p.y) < p.R * 1.9 && Math.random() < 0.55) return GY[(Math.random() * GY.length) | 0]; }
      if (Math.hypot(x - gw * 0.5, y - gh * 0.46) < Math.min(gw, gh) * 0.13 && Math.random() < 0.5) return GY[(Math.random() * GY.length) | 0];
      const depth = Math.min(1, Math.max(0, y / gh));
      return GB[Math.min(GB.length - 1, Math.floor((0.15 + Math.random() * 0.8) * (2 + depth * 5)))];
    }
    function gpaint(n) {
      g1.lineCap = "round";
      for (let i = 0; i < n; i++) {
        let x = Math.random() * gw, y = Math.random() * gh;
        g1.strokeStyle = gcolor(x, y); g1.globalAlpha = 0.1 + Math.random() * 0.22; g1.lineWidth = (2 + Math.random() * 4.5) * gd;
        g1.beginPath(); g1.moveTo(x, y);
        const step = (5 + Math.random() * 5) * gd;
        for (let s = 0; s < 9; s++) { const v = gfield(x, y), m = Math.hypot(v[0], v[1]) || 1; x += (v[0] / m) * step; y += (v[1] / m) * step; g1.lineTo(x, y); }
        g1.stroke();
      }
      g1.globalAlpha = 1;
    }
    function gstars(time) {
      g2.clearRect(0, 0, gw, gh);
      g2.globalCompositeOperation = "lighter";
      for (let i = 0; i < GS.length; i++) {
        const p = gp(GS[i]), R = p.R * (reduce ? 1 : 1 + 0.08 * Math.sin(time * 0.8 + GS[i].ph));
        const g = g2.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 2.6);
        g.addColorStop(0, "rgba(255,244,190,0.85)"); g.addColorStop(0.2, "rgba(255,222,110,0.5)"); g.addColorStop(0.55, "rgba(242,190,60,0.15)"); g.addColorStop(1, "rgba(242,190,60,0)");
        g2.fillStyle = g; g2.beginPath(); g2.arc(p.x, p.y, R * 2.6, 0, Math.PI * 2); g2.fill();
        g2.lineWidth = 2 * gd;
        for (let k = 1; k <= 3; k++) { g2.strokeStyle = "rgba(255,236,150," + (0.2 / k).toFixed(3) + ")"; g2.beginPath(); g2.arc(p.x, p.y, R * (0.8 + k * 0.5), 0, Math.PI * 2); g2.stroke(); }
      }
      g2.globalCompositeOperation = "source-over";
    }
    function gresize() {
      gd = Math.min(window.devicePixelRatio || 1, 1.5);
      gw = Math.floor(window.innerWidth * gd); gh = Math.floor(window.innerHeight * gd);
      gsky.width = gst.width = gw; gsky.height = gst.height = gh;
      g1.fillStyle = "#050d24"; g1.fillRect(0, 0, gw, gh);
      gpaint(Math.round((gw * gh) / 520));
      gstars(0);
    }
    function gframe(now) {
      if (!gateRun) return;
      requestAnimationFrame(gframe);
      if (now - gl < 40) return;
      gt += Math.min(0.1, (now - gl) / 1000 || 0.04); gl = now;
      g1.globalAlpha = 0.03; g1.fillStyle = "#050d24"; g1.fillRect(0, 0, gw, gh); g1.globalAlpha = 1;
      gpaint(Math.max(50, Math.round((gw * gh) / 9000)));
      gstars(gt);
    }
    window.addEventListener("resize", () => { if (gateRun) { clearTimeout(grt); grt = setTimeout(gresize, 200); } });
    gresize();
    if (!reduce) requestAnimationFrame(gframe);
  }

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

// Van Gogh's own words, taken from his letters to his brother Theo (vangoghletters.org); they appear one at a time at the bottom
(function () {
  const box = document.getElementById("meQuote");
  const txt = document.getElementById("meQuoteText");
  const src = document.getElementById("meQuoteSrc");
  if (!box || !txt || !src) return;
  const Q = [
    { en: "It often seems to me that the night is much more alive and richly coloured than the day.", it: "Mi sembra spesso che la notte sia molto più viva e ricca di colori del giorno.", from: ["Letter 676 to Theo, Arles, 8 September 1888", "Lettera 676 a Theo, Arles, 8 settembre 1888"] },
    { en: "But the sight of the stars always makes me dream in as simple a way as the black spots on the map, representing towns and villages, make me dream.", it: "Ma la vista delle stelle mi fa sempre sognare, in modo semplice come i puntini neri sulla carta, che rappresentano città e villaggi, mi fanno sognare.", from: ["Letter 638 to Theo, Arles, 9 or 10 July 1888", "Lettera 638 a Theo, Arles, 9 o 10 luglio 1888"] },
    { en: "It is good to love as much as one can, for therein lies true strength, and he who loves much does much and is capable of much, and that which is done with love is well done.", it: "È bene amare quanto più si può, perché lì sta la vera forza, e chi ama molto fa molto ed è capace di molto, e ciò che si fa con amore è ben fatto.", from: ["Letter 143 to Theo, Amsterdam, 3 April 1878", "Lettera 143 a Theo, Amsterdam, 3 aprile 1878"] },
    { en: "Even though I'm often in a mess, inside me there's still a calm, pure harmony and music.", it: "Anche se spesso sono in difficoltà, dentro di me c'è ancora un'armonia calma e pura, e musica.", from: ["Letter 249 to Theo, The Hague, about 21 July 1882", "Lettera 249 a Theo, L'Aia, circa 21 luglio 1882"] },
  ];
  let i = 0, timer = null;
  function show() {
    const q = Q[i % Q.length];
    txt.textContent = "“" + I18N.pick(q.en, q.it) + "”";
    src.textContent = "Vincent van Gogh · " + I18N.pick(q.from[0], q.from[1]);
  }
  function next() {
    box.classList.remove("on");
    setTimeout(() => { i++; show(); box.classList.add("on"); }, 1500);
  }
  function start() { show(); box.classList.add("on"); timer = setInterval(next, 11000); }
  // begin once she has walked into the room
  const wait = setInterval(() => { if (document.body.classList.contains("entered")) { clearInterval(wait); setTimeout(start, 1500); } }, 400);
  window.addEventListener("langchange", show);
})();

// her words light up one by one as they reach the middle of the screen
(function () {
  const paras = Array.from(document.querySelectorAll("#meFlow .me-para"));
  if (!paras.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let words = [];
  function build() {
    const lang = window.I18N && I18N.lang === "it" ? "it" : "en";
    words = [];
    paras.forEach((p) => {
      const text = p.dataset[lang] || p.textContent;
      p.textContent = "";
      text.split(/\s+/).forEach((w, i, all) => {
        const s = document.createElement("span");
        s.className = "me-w" + (reduce ? " on" : "");
        s.textContent = w;
        p.appendChild(s);
        if (i < all.length - 1) p.appendChild(document.createTextNode(" "));
        words.push(s);
      });
    });
    update();
  }
  function update() {
    if (reduce) return;
    const vh = window.innerHeight;
    for (let i = 0; i < words.length; i++) {
      const r = words[i].getBoundingClientRect();
      // lit once it has risen above 72% of the screen height, and stays lit
      words[i].classList.toggle("on", r.top < vh * 0.72);
    }
  }
  let q = false;
  window.addEventListener("scroll", () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("langchange", () => setTimeout(build, 0));
  build();
})();
