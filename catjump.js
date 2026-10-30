// Cat Jump: a stylised cat runs through the night and leaps over puddles.
(function () {
  const canvas = document.getElementById("cat");
  if (!canvas) return;

  const scoreEl = document.getElementById("cat-score");
  const bestEl = document.getElementById("cat-best");
  const startBtn = document.getElementById("cat-start");
  const BEST_KEY = "dreveen-cat-best";

  let W = 720, H = 220, GROUND = 172;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d");
  // on narrow screens use a smaller, taller world so the cat and obstacles look bigger
  function layout() {
    const narrow = (canvas.parentElement.clientWidth || 800) < 640;
    W = narrow ? 520 : 720;
    H = narrow ? 250 : 220;
    GROUND = H - 48;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.aspectRatio = W + " / " + H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  layout();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GRAVITY = 2400;
  const AIR_TIME = 0.62;
  const JUMP_V = (GRAVITY * AIR_TIME) / 2;
  const CAT_X = 90;

  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) {}
  bestEl.textContent = best;

  let state = "idle"; // idle | running | paused | over
  let raf = 0;
  let last = 0;
  let t = 0;
  let dist = 0;
  let speed = 280;
  let y = 0; // height above the ground
  let vy = 0;
  let puddles = [];
  let nextGap = 0;
  let stars = [];
  let hitX = 0;
  let hitKind = "puddle";
  let cleared = 0;

  function makeStars() {
    stars = [];
    for (let i = 0; i < 38; i++) stars.push({ x: Math.random() * W, y: Math.random() * (GROUND - 60), r: Math.random() * 1.2 + 0.3, s: Math.random() * 0.3 + 0.1 });
  }
  makeStars();

  function reset() {
    dist = 0;
    speed = 280;
    y = 0;
    vy = 0;
    t = 0;
    puddles = [];
    cleared = 0;
    lastKind = "";
    nextGap = W * 0.9;
    scoreEl.textContent = "0";
  }

  // obstacle kinds: water (wide, flat), plant (bush with a rose bud) and rock (low stone)
  const KINDS = ["puddle", "plant", "rock"];
  let lastKind = "";
  function spawn() {
    // alternate: never the same kind twice in a row
    const pool = KINDS.filter((k) => k !== lastKind);
    const kind = pool[Math.floor(Math.random() * pool.length)];
    lastKind = kind;
    const w = kind === "puddle" ? 52 + Math.random() * 48 : kind === "plant" ? 28 + Math.random() * 12 : 30 + Math.random() * 16;
    const h = kind === "plant" ? 30 : kind === "rock" ? 22 : 0;
    puddles.push({ x: W + 20, w: w, h: h, kind: kind, seed: Math.random() });

    // later in a run, sometimes add a second small obstacle right behind it, close enough
    // to clear with a single jump (never wider than 55% of the jump distance)
    let span = w;
    if (cleared >= 8 && kind !== "puddle" && Math.random() < Math.min(0.15 + (cleared - 8) * 0.02, 0.4)) {
      const k2 = Math.random() < 0.5 ? "plant" : "rock";
      const w2 = k2 === "plant" ? 28 + Math.random() * 10 : 30 + Math.random() * 12;
      const g2 = 16 + Math.random() * 10;
      if (w + g2 + w2 <= 0.55 * speed * AIR_TIME) {
        puddles.push({ x: W + 20 + w + g2, w: w2, h: k2 === "plant" ? 30 : 22, kind: k2, seed: Math.random() });
        span = w + g2 + w2;
        lastKind = k2;
      }
    }

    // keep room to land and jump again; the random part of the gap shrinks slowly as you clear more
    const slack = Math.max(0.95 - cleared * 0.02, 0.45);
    nextGap = span + speed * (0.55 + Math.random() * slack);
  }

  // silly lines: a speech bubble when the cat jumps, a one-liner when it fails
  const JUMP_LINES = [
    "Meow-velous!", "Paws up!", "Cat-apult!", "I meant to do that.", "Purr-fect!",
    "Not today, puddle!", "Fur real?", "Nine lives, nine jumps.", "Look ma, dry paws!",
    "Whisker me away!", "Hiss-terical!", "Zoom zoom!", "Elegance, darling.",
  ];
  const WATER_LINES = [
    "I'm not wet, I'm moisturized.", "Dignity: lost.", "Meow-ch, my paws!",
    "That was on purpose.", "Towel, please.", "Cats and water: still a bad idea.",
  ];
  const HIT_LINES = [
    "That rock came out of nowhere.", "Was that a plant? Rude.", "I'm calling it a nap.",
    "Bonk! Zero stars.", "The plant started it.", "Smooth. Very smooth.", "Thorns? Really?",
  ];
  let bubble = null; // { text, t0 }
  let lastLine = "";
  let failLine = "";
  const pick = (a) => {
    let s;
    do { s = a[Math.floor(Math.random() * a.length)]; } while (a.length > 1 && s === lastLine);
    lastLine = s;
    return s;
  };

  function jump() {
    if (state !== "running" || y > 0) return;
    vy = JUMP_V;
    if (Math.random() < 0.65) bubble = { text: pick(JUMP_LINES), t0: t };
  }

  function step(dt) {
    t += dt;
    // difficulty follows the number of obstacles cleared: a little faster each time, capped
    speed += (Math.min(280 + cleared * 12, 500) - speed) * Math.min(dt * 1.5, 1);
    const dx = speed * dt;
    dist += dx;

    // physics
    if (y > 0 || vy > 0) {
      vy -= GRAVITY * dt;
      y += vy * dt;
      if (y <= 0) { y = 0; vy = 0; }
    }

    // puddles
    nextGap -= dx;
    if (nextGap <= 0) spawn();
    puddles.forEach((p) => {
      p.x -= dx;
      if (!p.passed && p.x + p.w < CAT_X + 8) { p.passed = true; cleared++; }
    });
    puddles = puddles.filter((p) => p.x + p.w > -20);

    stars.forEach((s) => { s.x -= s.s * dx * 0.2; if (s.x < 0) s.x += W; });

    // collision: feet in the water, or the cat's body against a plant / rock
    const a = CAT_X + 8, b = CAT_X + 46;
    for (const p of puddles) {
      const inX = b > p.x + 8 && a < p.x + p.w - 8;
      if (!inX) continue;
      if (p.kind === "puddle" ? y < 6 : y < p.h - 4) { hitX = p.x + p.w / 2; hitKind = p.kind; end(); return; }
    }
    scoreEl.textContent = Math.floor(dist / 10);
  }

  function end() {
    state = "over";
    bubble = null;
    failLine = pick(hitKind === "puddle" ? WATER_LINES : HIT_LINES);
    cancelAnimationFrame(raf);
    const score = Math.floor(dist / 10);
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    startBtn.textContent = "Play again";
    GameLock.set(false);
    draw();
  }

  function loop(now) {
    if (state !== "running") return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    if (state === "running") { draw(); raf = requestAnimationFrame(loop); }
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    state = "running";
    startBtn.textContent = "Pause";
    startBtn.blur();
    GameLock.set(true);
    const card = canvas.closest(".game-card");
    if (card) card.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    if (state !== "running") return;
    cancelAnimationFrame(raf);
    state = "paused";
    startBtn.textContent = "Resume";
    GameLock.set(false);
    draw();
  }

  function resume() {
    state = "running";
    startBtn.textContent = "Pause";
    startBtn.blur();
    GameLock.set(true);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  // ---------- drawing ----------
  function drawCat() {
    const phase = t * (speed / 28);
    const air = y > 1;
    ctx.save();
    ctx.translate(CAT_X + 28, GROUND - y);
    ctx.rotate(air ? -Math.min(Math.max(vy / 2600, -0.25), 0.25) : 0);

    const g = ctx.createLinearGradient(0, -46, 0, 0);
    g.addColorStop(0, "#f6e7c6");
    g.addColorStop(1, "#c9a87a");
    ctx.fillStyle = g;
    ctx.strokeStyle = g;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // tail
    const sway = air ? 0 : Math.sin(phase * 0.5) * 3;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.bezierCurveTo(-34, -22 + sway, -38, -40, -28, -46 + sway);
    ctx.stroke();

    // legs
    ctx.lineWidth = 5.5;
    const legs = [[-13, 0], [-8, Math.PI], [11, Math.PI], [16, 0]];
    legs.forEach((l) => {
      const s = air ? (l[1] === 0 ? 1 : -1) * 0.9 : Math.sin(phase + l[1]);
      const lift = air ? 0 : Math.max(0, Math.cos(phase + l[1])) * 4;
      ctx.beginPath();
      ctx.moveTo(l[0], -13);
      ctx.lineTo(l[0] + s * (air ? 12 : 9), -lift - (air ? 7 : 0));
      ctx.stroke();
    });

    // body (a little rounder)
    ctx.beginPath();
    ctx.ellipse(0, -23, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // head (bigger and rounder = cuter)
    ctx.beginPath();
    ctx.arc(22, -31, 11.500, 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(13.500, -37);
    ctx.lineTo(15.500, -50);
    ctx.lineTo(24, -40.500);
    ctx.closePath();
    ctx.moveTo(21, -40.500);
    ctx.lineTo(29.500, -50);
    ctx.lineTo(32, -37);
    ctx.closePath();
    ctx.fill();
    // inner ears
    ctx.fillStyle = "#e8a3b3";
    ctx.beginPath();
    ctx.moveTo(16, -39);
    ctx.lineTo(16.800, -46);
    ctx.lineTo(21.500, -41);
    ctx.closePath();
    ctx.moveTo(23, -41);
    ctx.lineTo(28, -46);
    ctx.lineTo(29.800, -39);
    ctx.closePath();
    ctx.fill();
    // cheek blush
    ctx.fillStyle = "rgba(232, 163, 179, 0.5)";
    ctx.beginPath();
    ctx.ellipse(25, -26.500, 3.200, 2.200, 0, 0, Math.PI * 2);
    ctx.fill();
    // big glossy eye
    ctx.fillStyle = "#2a0d17";
    ctx.beginPath();
    ctx.ellipse(27, -33, 2.800, 3.300, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(27.900, -34.200, 1, 0, Math.PI * 2);
    ctx.fill();
    // little nose
    ctx.fillStyle = "#d23a58";
    ctx.beginPath();
    ctx.moveTo(31.500, -30.500);
    ctx.lineTo(34.500, -30.500);
    ctx.lineTo(33, -28.500);
    ctx.closePath();
    ctx.fill();
    // whiskers
    ctx.strokeStyle = "rgba(60, 25, 35, 0.55)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(30, -27.500); ctx.lineTo(39, -29.500);
    ctx.moveTo(30, -26); ctx.lineTo(39, -25);
    ctx.stroke();
    ctx.restore();
  }

  function drawRock(p) {
    const x = p.x, w = p.w, h = p.h, b = GROUND + 1;
    const g = ctx.createLinearGradient(0, b - h, 0, b);
    g.addColorStop(0, "#8a7378");
    g.addColorStop(1, "#4a3a3f");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, b);
    ctx.quadraticCurveTo(x + w * 0.02, b - h * 0.75, x + w * 0.32, b - h);
    ctx.quadraticCurveTo(x + w * 0.7, b - h * 1.05, x + w * 0.92, b - h * 0.5);
    ctx.quadraticCurveTo(x + w * 1.02, b - h * 0.2, x + w, b);
    ctx.closePath();
    ctx.fill();
    // light edge + small companion stone
    ctx.strokeStyle = "rgba(241, 222, 184, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, b - h * 0.55);
    ctx.quadraticCurveTo(x + w * 0.3, b - h * 0.98, x + w * 0.55, b - h * 0.98);
    ctx.stroke();
    ctx.fillStyle = "#5a474c";
    ctx.beginPath();
    ctx.ellipse(x + w + 5, b - 3, 5, 3.500, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // an ugly, spiky weed: jagged dark blades, thorny stems and a withered brown bud
  function drawPlant(p) {
    const cx = p.x + p.w / 2, b = GROUND + 1, h = p.h;
    const sway = Math.sin(t * 2.4 + p.seed * 6) * 1.200;
    ctx.lineCap = "round";
    ctx.lineJoin = "miter";

    // jagged blades (sickly olive and swamp green)
    const blades = [[-1, 0.62, "#3b4a22"], [1, 0.7, "#4f5c2a"], [-0.55, 0.95, "#2c3a1a"], [0.5, 1.0, "#5a6a2c"], [0, 0.85, "#34421e"]];
    blades.forEach((l) => {
      ctx.fillStyle = l[2];
      const tipX = cx + l[0] * p.w * 0.5 + sway * l[1];
      const tipY = b - h * l[1];
      ctx.beginPath();
      ctx.moveTo(cx - 4, b);
      ctx.lineTo(cx + l[0] * p.w * 0.12 - 2, b - h * l[1] * 0.45);
      ctx.lineTo(cx + l[0] * p.w * 0.3 - 3, b - h * l[1] * 0.5);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(cx + l[0] * p.w * 0.22 + 3, b - h * l[1] * 0.35);
      ctx.lineTo(cx + l[0] * p.w * 0.1 + 3, b - h * l[1] * 0.3);
      ctx.lineTo(cx + 4, b);
      ctx.closePath();
      ctx.fill();
    });

    // thorny stems with little triangular spikes
    ctx.strokeStyle = "#2a2f16";
    ctx.lineWidth = 2;
    [-0.5, 0.5].forEach((d, i) => {
      const sx = cx + d * p.w * 0.3;
      const ex = sx + d * 7 + sway;
      const ey = b - h * (0.78 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(sx, b);
      ctx.quadraticCurveTo(sx + d * 8, b - h * 0.5, ex, ey);
      ctx.stroke();
      ctx.fillStyle = "#c9b36a";
      for (let k = 1; k <= 3; k++) {
        const f = k / 4;
        const px = sx + (ex - sx) * f + d * Math.sin(f * 3) * 3;
        const py = b - (b - ey) * f;
        ctx.beginPath();
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px + d * 7, py - 5);
        ctx.lineTo(px, py + 1.500);
        ctx.closePath();
        ctx.fill();
      }
    });

    // withered bud + a few spikes on top
    const bx = cx + sway, by = b - h + 2;
    ctx.fillStyle = "#6d4a32";
    ctx.beginPath();
    ctx.ellipse(bx, by, 3.800, 4.800, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9b36a";
    [-1, 0, 1].forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(bx + d * 3 - 1.500, by - 2);
      ctx.lineTo(bx + d * 5, by - 9 + Math.abs(d) * 2);
      ctx.lineTo(bx + d * 3 + 1.500, by - 2);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawBubble() {
    if (!bubble) return;
    const age = t - bubble.t0;
    const life = 1.3;
    if (age > life) { bubble = null; return; }
    const alpha = Math.min(age / 0.12, 1) * Math.min((life - age) / 0.3, 1);
    ctx.save();
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.font = 'italic 16px "Playfair Display", Georgia, serif';
    const w = ctx.measureText(bubble.text).width + 24;
    const x = Math.min(CAT_X - 4, W - w - 8);
    const by = Math.max(GROUND - Math.max(y, 0) - 82, 10) - age * 6;
    ctx.fillStyle = "rgba(21, 9, 17, 0.9)";
    ctx.strokeStyle = "rgba(201, 168, 122, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, by);
    ctx.lineTo(x + w - 8, by);
    ctx.quadraticCurveTo(x + w, by, x + w, by + 8);
    ctx.lineTo(x + w, by + 22);
    ctx.quadraticCurveTo(x + w, by + 30, x + w - 8, by + 30);
    ctx.lineTo(x + 40, by + 30);
    ctx.lineTo(x + 30, by + 38);
    ctx.lineTo(x + 28, by + 30);
    ctx.lineTo(x + 8, by + 30);
    ctx.quadraticCurveTo(x, by + 30, x, by + 22);
    ctx.lineTo(x, by + 8);
    ctx.quadraticCurveTo(x, by, x + 8, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f1deb8";
    ctx.textAlign = "left";
    ctx.fillText(bubble.text, x + 12, by + 20);
    ctx.restore();
  }

  function drawObstacle(p) {
    if (p.kind === "rock") drawRock(p);
    else if (p.kind === "plant") drawPlant(p);
    else drawPuddle(p);
  }

  function drawPuddle(p) {
    const cx = p.x + p.w / 2;
    const cy = GROUND + 3;
    const grad = ctx.createLinearGradient(p.x, cy - 8, p.x, cy + 8);
    grad.addColorStop(0, "rgba(150, 178, 205, 0.75)");
    grad.addColorStop(1, "rgba(70, 100, 135, 0.7)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.w / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // shimmer + ripples
    ctx.strokeStyle = "rgba(241, 222, 184, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.w / 2 - 1, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    const r = ((t * 0.9 + p.w) % 1);
    ctx.strokeStyle = "rgba(241, 222, 184, " + (0.5 * (1 - r)) + ")";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 4 + r * (p.w / 2 - 8), 1 + r * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw() {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a0710");
    sky.addColorStop(1, "#0a0406");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // moon
    ctx.fillStyle = "#f1deb8";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(W - 100, 52, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0710";
    ctx.beginPath();
    ctx.arc(W - 90, 46, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // stars
    ctx.fillStyle = "rgba(241, 222, 184, 0.6)";
    stars.forEach((s) => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });

    // ground
    ctx.strokeStyle = "rgba(201, 168, 122, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 0.5);
    ctx.lineTo(W, GROUND + 0.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(201, 168, 122, 0.25)";
    for (let i = 0; i < 18; i++) {
      const gx = ((i * 83 - dist * 0.9) % (W + 40) + (W + 40)) % (W + 40) - 20;
      ctx.fillRect(gx, GROUND + 12 + (i % 3) * 8, 14 + (i % 4) * 5, 1.5);
    }

    puddles.forEach(drawObstacle);

    // shadow
    if (state !== "over") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(CAT_X + 28, GROUND + 2, 22 - Math.min(y / 8, 10), 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCat();
    drawBubble();

    if (state === "over" && hitKind === "puddle") {
      // splash (water only)
      ctx.fillStyle = "rgba(190, 215, 235, 0.9)";
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * Math.PI;
        const d = 14 + (i % 3) * 8;
        ctx.beginPath();
        ctx.arc(hitX + Math.cos(a) * d * 1.4, GROUND - Math.sin(a) * d - 4, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (state === "idle") overlay("Ready?", "Press Start, then tap or press Space to jump");
    if (state === "paused") overlay("Paused", "Press Resume");
    if (state === "over") overlay(hitKind === "puddle" ? "Splash!" : "Ouch!", failLine, "Score " + Math.floor(dist / 10));
  }

  function overlay(title, sub, extra) {
    ctx.fillStyle = "rgba(10, 4, 6, 0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f3e9e2";
    ctx.font = 'italic 40px "Playfair Display", Georgia, serif';
    ctx.fillText(title, W / 2, H / 2 - 4);
    ctx.fillStyle = "#c9a87a";
    ctx.font = '16px "Inter", Arial, sans-serif';
    ctx.fillText(sub, W / 2, H / 2 + 28);
    if (extra) { ctx.fillStyle = "#f3e9e2"; ctx.fillText(extra, W / 2, H / 2 + 52); }
  }

  // ---------- input ----------
  startBtn.addEventListener("click", () => {
    if (state === "running") pause();
    else if (state === "paused") resume();
    else start();
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (state === "running") { e.preventDefault(); jump(); }
    else if (state === "idle" || state === "over") start();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { pause(); return; }
    if (state !== "running") return;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      if (e.target && e.target.tagName === "BUTTON" && e.key === " ") return;
      e.preventDefault();
      jump();
    }
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  document.addEventListener("gamehide", pause);

  // re-fit when the screen size or orientation changes (only between games)
  window.addEventListener("resize", () => {
    if (state === "running") return;
    layout();
    makeStars();
    reset();
    state = "idle";
    startBtn.textContent = "Start";
    draw();
  });

  reset();
  draw();
})();
