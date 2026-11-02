// Three abstract paintings in the manner of Van Gogh (thick bristle strokes that follow a flow), one for each part of "Beyond what you see":
//   logic  : logical thinking and curiosity  -> ordered rings of strokes turning against each other, and a thought travelling between stars
//   feel   : creativity and sensitivity      -> wide, soft, swirling wind in cobalt, turquoise and yellow
//   drive  : consistency and determination   -> a flame of strokes that rises steadily towards a star
(function () {
  const cvs = Array.from(document.querySelectorAll("canvas[data-art]"));
  if (!cvs.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLUE = [[12, 34, 120], [26, 70, 178], [48, 104, 214], [92, 144, 238], [152, 192, 250]];
  const YEL = [[246, 214, 96], [250, 232, 140], [255, 244, 190], [255, 252, 228]];
  const TUR = [[34, 150, 170], [70, 196, 196], [122, 224, 212]];
  const DEEP = [[10, 44, 86], [16, 62, 96]];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickc = (arr) => arr[(Math.random() * arr.length) | 0];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgb = (c, d) => "rgb(" + Math.max(0, Math.min(255, c[0] + d)) + "," + Math.max(0, Math.min(255, c[1] + d)) + "," + Math.max(0, Math.min(255, c[2] + d)) + ")";
  // gradient through several colours, k in 0..1
  function ramp(stops, k) {
    k = Math.max(0, Math.min(0.9999, k)) * (stops.length - 1);
    const i = k | 0;
    return mix(stops[i], stops[i + 1], k - i);
  }

  // one thick brush stroke made of three bristle lines
  function brush(cx, x, y, a, len, w, col) {
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    cx.lineCap = "round";
    for (let k = -1; k <= 1; k++) {
      cx.strokeStyle = rgb(col, k * 16);
      cx.lineWidth = w / 2.6 + 0.5;
      cx.beginPath();
      cx.moveTo(x + (nx * k * w) / 2.8, y + (ny * k * w) / 2.8);
      cx.lineTo(x + dx * len + (nx * k * w) / 2.8, y + dy * len + (ny * k * w) / 2.8);
      cx.stroke();
    }
  }
  function sparkle(cx, x, y, r, col, alpha) {
    cx.save(); cx.translate(x, y); cx.globalAlpha = alpha; cx.fillStyle = col;
    cx.beginPath();
    cx.moveTo(0, -r); cx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); cx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
    cx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); cx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
    cx.fill(); cx.restore();
  }
  function halo(cx, x, y, r, a) {
    const g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,248,205," + a + ")");
    g.addColorStop(0.35, "rgba(250,222,120," + a * 0.45 + ")");
    g.addColorStop(1, "rgba(250,222,120,0)");
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
  }

  // ---- 1. logical thinking and curiosity ----
  function makeLogic(S) {
    const c = S / 2, rings = 7, parts = [];
    const radius = (i) => S * (0.1 + 0.06 * i);
    for (let n = 0; n < 340; n++) {
      const i = (Math.random() * rings) | 0;
      parts.push({ i, th: rnd(0, 6.2832), j: rnd(-0.012, 0.012) * S, w: rnd(3, 6.2), col: i % 2 ? pickc(YEL) : pickc(BLUE.slice(1)) });
    }
    // stars on the rings, joined in order: the thought goes from one to the next
    const nodes = [[1, 0.4], [3, 2.2], [2, 4.0], [5, 5.3], [4, 1.1], [6, 3.1], [5, 0.2], [2, 2.6]].map((n) => ({ i: n[0], th: n[1] }));
    const pos = (nd, t) => { const dir = nd.i % 2 ? 1 : -1; const a = nd.th + dir * t * 0.09 * (1 / (1 + nd.i * 0.35)); return [c + Math.cos(a) * radius(nd.i), c + Math.sin(a) * radius(nd.i)]; };
    return {
      step(cx, t, dt) {
        for (const p of parts) {
          const dir = p.i % 2 ? 1 : -1;
          const om = (dir * 0.55) / (1 + p.i * 0.35);
          const r0 = radius(p.i) + p.j + Math.sin(t * 0.7 + p.th * 3) * S * 0.004;
          const a0 = p.th, a1 = p.th + om * dt;
          p.th = a1;
          const x0 = c + Math.cos(a0) * r0, y0 = c + Math.sin(a0) * r0, x1 = c + Math.cos(a1) * r0, y1 = c + Math.sin(a1) * r0;
          brush(cx, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) * 5 + S * 0.03, p.w * (S / 400), p.col);
        }
      },
      over(cx, t) {
        halo(cx, c, c, S * (0.16 + Math.sin(t * 1.4) * 0.012), 0.95);
        sparkle(cx, c, c, S * 0.06, "#fffbe6", 1);
        const pts = nodes.map((n) => pos(n, t));
        cx.lineWidth = 1.1; cx.strokeStyle = "rgba(246,232,200,.42)"; cx.beginPath();
        pts.forEach((p, k) => (k ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])));
        cx.stroke();
        pts.forEach((p, k) => sparkle(cx, p[0], p[1], S * 0.026 + Math.sin(t * 2 + k) * S * 0.004, "#fff3c8", 0.95));
        // the travelling thought
        const u = ((t * 0.16) % 1) * (pts.length - 1), k = Math.min(pts.length - 2, u | 0), f = u - k;
        halo(cx, pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f, S * 0.05, 0.9);
      },
    };
  }

  // ---- 2. creativity and sensitivity ----
  function makeFeel(S) {
    const parts = [];
    const vort = [[0.3, 0.34, 0.2, 1], [0.72, 0.68, 0.22, -1]];
    for (let n = 0; n < 380; n++) parts.push({ x: rnd(0, S), y: rnd(0, S), life: rnd(0, 120), w: rnd(3, 7), jit: rnd(-1, 1) });
    const angle = (x, y, t) => {
      const nx = x / S, ny = y / S;
      let a = 2.3 * Math.sin(nx * 3.1 + t * 0.32) * Math.cos(ny * 2.7 - t * 0.27) + 0.8 * Math.sin(nx * 7 + ny * 5 + t * 0.45);
      for (const v of vort) {
        const dx = nx - v[0], dy = ny - v[1], d2 = dx * dx + dy * dy, wgt = Math.exp(-d2 / (v[2] * v[2]));
        const tang = Math.atan2(dy, dx) + (Math.PI / 2) * v[3] + 0.5 * v[3];
        a = a * (1 - wgt) + tang * wgt;
      }
      return a;
    };
    const stops = [BLUE[0], BLUE[2], TUR[1], YEL[2], TUR[0], BLUE[1]];
    return {
      step(cx, t, dt) {
        const sp = 30 * (S / 400);
        for (const p of parts) {
          const a = angle(p.x, p.y, t);
          const len = sp * dt * 9 + 12;
          const k = ((p.y / S) * 0.55 + (p.x / S) * 0.45 + 0.12 * Math.sin(t * 0.25) + p.jit * 0.05 + 1) % 1;
          brush(cx, p.x, p.y, a, len, p.w * (S / 400), ramp(stops, k));
          p.x += Math.cos(a) * sp * dt; p.y += Math.sin(a) * sp * dt; p.life += 1;
          if (p.x < -10 || p.y < -10 || p.x > S + 10 || p.y > S + 10 || p.life > 260) { p.x = rnd(0, S); p.y = rnd(0, S); p.life = 0; }
        }
      },
      over(cx, t) {
        vort.forEach((v, i) => halo(cx, v[0] * S, v[1] * S, S * (0.12 + Math.sin(t * 0.8 + i * 2) * 0.015), 0.5));
      },
    };
  }

  // ---- 3. consistency and determination ----
  function makeDrive(S) {
    const parts = [], cxm = S / 2;
    const spawn = (p) => { p.x = cxm + (Math.random() + Math.random() + Math.random() - 1.5) * S * 0.3; p.y = rnd(S * 0.78, S * 1.02); p.life = 0; };
    for (let n = 0; n < 360; n++) { const p = { w: rnd(3, 6.5), life: 0 }; spawn(p); p.y = rnd(S * 0.1, S); parts.push(p); }
    const stops = [DEEP[0], BLUE[0], BLUE[2], TUR[1], YEL[0], YEL[2], YEL[3]];
    return {
      step(cx, t, dt) {
        const sp = 58 * (S / 400);
        for (const p of parts) {
          const ny = p.y / S;
          const sway = 0.42 * Math.sin(p.y * 0.034 - t * 2.1 + p.x * 0.02) * (0.35 + 0.65 * (1 - ny));
          const pull = (cxm - p.x) * 0.0016 * (1 - ny + 0.15);
          const a = -Math.PI / 2 + sway + pull * 6;
          const k = 1 - ny;
          brush(cx, p.x, p.y, a, sp * dt * 6 + 6, p.w * (S / 400), ramp(stops, k * 1.05));
          p.x += Math.cos(a) * sp * dt; p.y += Math.sin(a) * sp * dt; p.life++;
          if (p.y < S * 0.08 || p.life > 420) spawn(p);
        }
      },
      over(cx, t) {
        const r = S * (0.13 + Math.sin(t * 1.1) * 0.012);
        halo(cx, cxm, S * 0.1, r, 0.95);
        sparkle(cx, cxm, S * 0.1, S * 0.05 + Math.sin(t * 1.1) * S * 0.004, "#fffbe6", 1);
        // a steady row of marks at the base: the days that keep coming
        for (let k = 0; k < 9; k++) {
          const h = S * (0.018 + 0.006 * Math.sin(t * 1.3 - k * 0.7));
          cx.fillStyle = "rgba(246,232,200,.5)";
          cx.fillRect(S * 0.2 + k * S * 0.075, S * 0.965 - h, S * 0.03, h);
        }
      },
    };
  }

  // deterministic randomness, so a redrawn picture keeps the same strokes every frame
  function seeded(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function polyBrush(cx, pts, w, col) {
    for (let k = 0; k < pts.length - 1; k++) {
      const a = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]);
      brush(cx, pts[k][0], pts[k][1], a, Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) + 1.5, w, col);
    }
  }

  // ---- 2A. the iris that opens and closes ----
  function makeIris(S) {
    const rand = seeded(7), seedsFor = (n) => Array.from({ length: n }, () => ({ u: rand() * 0.93, v: rand() * 2 - 1, k: rand() }));
    const sets = { st: [seedsFor(150), seedsFor(170), seedsFor(150)], fa: [seedsFor(150), seedsFor(120), seedsFor(150)], lf: [seedsFor(110), seedsFor(110)], stem: seedsFor(90) };
    const base = [S / 2, S * 0.5];
    const STAND = [[250, 214, 96], [138, 150, 238], [78, 84, 214], [36, 44, 156]];
    const FALL = [[250, 196, 70], [255, 240, 190], [124, 104, 226], [46, 46, 160]];
    const GREEN = [[16, 80, 84], [40, 130, 104], [90, 176, 120]];
    function petal(cx, ang, L, Wd, bend, seeds, stops, sw) {
      const a = (ang * Math.PI) / 180, dx = Math.sin(a), dy = -Math.cos(a), px = -dy, py = dx;
      const wid = (u) => Wd * (Math.sin(Math.PI * Math.pow(Math.min(u, 1), 0.72)) * 0.92 + 0.08 * (1 - u));
      const at = (u, v) => [base[0] + dx * L * u + px * bend * L * u * u + px * v * wid(u), base[1] + dy * L * u + py * bend * L * u * u + py * v * wid(u)];
      for (const s of seeds) {
        const p0 = at(s.u, s.v), p1 = at(Math.min(1, s.u + 0.1), s.v);
        const a2 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const col = ramp(stops, s.u * 0.95 + (s.k - 0.5) * 0.12);
        brush(cx, p0[0], p0[1], a2, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 1, sw * (0.8 + s.k * 0.6), col);
      }
    }
    return {
      clear: true,
      step(cx, t) {
        const o = 0.5 + 0.5 * Math.sin(t * 0.85), sc = S / 400, sway = Math.sin(t * 0.5) * 4 * sc;
        halo(cx, base[0], base[1] - S * 0.05, S * (0.4 + o * 0.05), 0.28);
        // stem and leaves
        for (const s of sets.stem) { const y = base[1] + s.u * (S * 0.5 / 0.93), x = base[0] + Math.sin(y * 0.02 + t * 0.5) * 3 * sc + s.v * 5 * sc; brush(cx, x, y, Math.PI / 2, S * 0.05, 4.5 * sc, ramp(GREEN, s.k)); }
        petal(cx, -38, S * 0.5, S * 0.06, -0.3, sets.lf[0], GREEN, 4 * sc);
        petal(cx, 38, S * 0.5, S * 0.06, 0.3, sets.lf[1], GREEN, 4 * sc);
        // falls (the drooping petals), then standards (the upright ones)
        petal(cx, -(104 + 26 * o), S * 0.34, S * 0.095, -0.35 - 0.1 * o, sets.fa[0], FALL, 4.4 * sc);
        petal(cx, 104 + 26 * o, S * 0.34, S * 0.095, 0.35 + 0.1 * o, sets.fa[2], FALL, 4.4 * sc);
        petal(cx, 180 + sway * 0.2, S * 0.26, S * 0.085, 0.1, sets.fa[1], FALL, 4.2 * sc);
        petal(cx, -(8 + 24 * o), S * 0.4, S * 0.075, -0.18 - 0.1 * o, sets.st[0], STAND, 4.4 * sc);
        petal(cx, 6 * Math.sin(t * 0.6), S * 0.44, S * 0.08, 0.04, sets.st[1], STAND, 4.6 * sc);
        petal(cx, 8 + 24 * o, S * 0.4, S * 0.075, 0.18 + 0.1 * o, sets.st[2], STAND, 4.4 * sc);
        // the yellow heart
        for (let k = 0; k < 26; k++) brush(cx, base[0] + (k % 7 - 3) * 3 * sc, base[1] - 4 * sc + (k % 5) * 2 * sc, -Math.PI / 2 + (k % 7 - 3) * 0.22, 14 * sc, 4 * sc, ramp([[255, 236, 150], [250, 196, 70]], (k % 4) / 3));
      },
      over() {},
    };
  }

  // ---- 2B. music turning into colour ----
  function makeMusic(S) {
    const lines = 5, stops = [[255, 244, 205], [150, 192, 250], [48, 104, 214], [70, 196, 196], [246, 214, 96], [255, 150, 120]];
    return {
      clear: true,
      step(cx, t) {
        const sc = S / 400;
        for (let l = 0; l < lines; l++) {
          const yb = S * (0.34 + l * 0.08);
          let prev = null;
          for (let x = S * 0.04; x <= S * 0.96; x += 4 * sc) {
            const s = (x - S * 0.04) / (S * 0.92), amp = (0.004 + 0.1 * Math.pow(s, 1.5)) * S;
            const y = yb + amp * Math.sin(x * 0.035 - t * 2.2 + l * 0.9) + amp * 0.5 * Math.sin(x * 0.07 - t * 1.4 + l * 2);
            if (prev) {
              const w = (1.2 + 7.5 * Math.pow(s, 1.2)) * sc, col = ramp(stops, Math.min(0.999, s * 0.98 + l * 0.015));
              brush(cx, prev[0], prev[1], Math.atan2(y - prev[1], x - prev[0]), Math.hypot(x - prev[0], y - prev[1]) + 1, w, col);
            }
            prev = [x, y];
          }
        }
        // notes drifting along the staff and dissolving into colour
        for (let n = 0; n < 4; n++) {
          const u = ((t * 0.07 + n * 0.25) % 1), x = S * (0.06 + u * 0.5), l = (n * 2) % lines, y = S * (0.34 + l * 0.08) - S * 0.012 + Math.sin(u * 6 + n) * S * 0.02;
          cx.globalAlpha = Math.max(0, 1 - u * 1.9);
          cx.fillStyle = "#fff4cf";
          cx.beginPath(); cx.ellipse(x, y, S * 0.017, S * 0.012, -0.4, 0, 6.2832); cx.fill();
          cx.strokeStyle = "#fff4cf"; cx.lineWidth = 1.6 * sc; cx.beginPath(); cx.moveTo(x + S * 0.015, y - S * 0.004); cx.lineTo(x + S * 0.015, y - S * 0.07); cx.stroke();
          cx.globalAlpha = 1;
        }
      },
      over() {},
    };
  }

  // ---- 2C. the drop and its rings ----
  function makeDrop(S) {
    const rand = seeded(11), RN = 5, strokes = Array.from({ length: 5 }, () => Array.from({ length: 70 }, () => ({ w: 0.7 + rand() * 0.8, j: rand() - 0.5 })));
    const cols = [[250, 222, 120], [112, 214, 204], [76, 132, 232], [150, 120, 232], [255, 170, 130]];
    const CY = S * 0.64, CX = S / 2, CYC = 5.2;
    return {
      clear: true,
      step(cx, t) {
        const sc = S / 400, ph = (t % CYC), fall = 0.9;
        // the water: a few faint horizontal strokes
        for (let k = 0; k < 28; k++) { const y = CY - S * 0.14 + k * S * 0.012; brush(cx, S * 0.04 + ((k * 53) % 17) * 2, y, 0.02 * Math.sin(t + k), S * 0.9, 3 * sc, [10 + k % 3 * 3, 30 + k % 4 * 4, 90 + k % 5 * 6]); }
        if (ph < fall) {
          const y = S * 0.06 + (CY - S * 0.06) * Math.pow(ph / fall, 2);
          halo(cx, CX, y, S * 0.07, 0.9);
          brush(cx, CX, y - S * 0.05, Math.PI / 2, S * 0.05, 5 * sc, [255, 244, 190]);
        } else {
          const e = ph - fall;
          for (let r = 0; r < RN; r++) {
            const age = e - r * 0.42; if (age < 0) continue;
            const R = (age * 62 + 6) * sc * (S / 400 > 0 ? 1 : 1), fade = Math.max(0, 1 - age / 3.4);
            if (fade <= 0) continue;
            cx.globalAlpha = Math.min(1, fade * 1.3);
            const col = cols[r % cols.length], st = strokes[r], n = st.length;
            for (let k = 0; k < n; k++) {
              const a = (k / n) * 6.2832, a2 = a + 0.1, x0 = CX + Math.cos(a) * R, y0 = CY + Math.sin(a) * R * 0.42, x1 = CX + Math.cos(a2) * R, y1 = CY + Math.sin(a2) * R * 0.42;
              brush(cx, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) + 2, (7 - r) * 0.8 * sc * st[k].w, col);
            }
            cx.globalAlpha = 1;
          }
          if (e < 0.7) for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.28, d = e * S * 0.28; halo(cx, CX + Math.sin(a + Math.PI / 2) * d * 0.7 * (k - 4) * 0.25, CY - Math.sin(e * 4.4) * S * 0.12 * (1 - Math.abs(k - 4) / 5), S * 0.012, 0.8 * (1 - e / 0.7)); }
        }
      },
      over() {},
    };
  }

  // ---- technology and art: real code falls from the sky, melts into soft colour and is drawn into a swirl around a star ----
  function makeCode(S) {
    const sc = S / 400, V = [S / 2, S * 0.68], Y0 = S * 0.13, Y1 = S * 0.56;
    const CODE = ["const", "return", "if (x)", "i++", "null", "SELECT", "def f():", "<div>", "git add", "=> {}", "for (;;)", "print()", "int n;", "true", "else", "while", "import", "class A", "async", "await", "x = 1", "len(a)", "fn main", "push()"];
    const colsX = [0.2, 0.4, 0.6, 0.8];
    const parts = [];
    const spawn = (p, fresh) => { p.x = S * colsX[(Math.random() * colsX.length) | 0] + rnd(-4, 4); p.y = fresh ? rnd(-S * 0.1, S * 0.45) : -rnd(S * 0.02, S * 0.3); p.v = rnd(42, 62) * sc; p.ph = 0; p.ly = p.y - S * 0.08; p.px = p.x; p.py = p.y; p.warm = Math.random() > 0.5; p.w = rnd(3, 6); };
    const orbit = (p, fresh) => { p.ph = 1; p.r = fresh ? rnd(S * 0.06, S * 0.44) : rnd(S * 0.36, S * 0.46); p.th = rnd(0, 6.2832); p.dir = Math.random() > 0.5 ? 1 : -1; p.om = rnd(0.55, 0.95) * p.dir; p.w = rnd(3, 6); };
    for (let n = 0; n < 64; n++) { const p = { code: true }; spawn(p, true); parts.push(p); }
    for (let n = 0; n < 170; n++) { const p = { code: false }; orbit(p, true); parts.push(p); }
    const stops = [BLUE[0], BLUE[2], BLUE[3], TUR[1], YEL[1], YEL[3]];
    const sm = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    return {
      step(cx, t, dt) {
        cx.font = Math.round(S * 0.04) + "px monospace"; cx.textAlign = "center"; cx.textBaseline = "middle";
        for (const p of parts) {
          if (p.ph === 0) {
            const b = sm((p.y - Y0) / (Y1 - Y0));
            const dx = p.x - V[0], dy = p.y - V[1], r = Math.hypot(dx, dy) || 1, dir = dx < 0 ? -1 : 1;
            // blend from "straight down" to "round and in" so the path bends smoothly into the swirl
            const sx = dir * (-dy / r) * 1.0 + (-dx / r) * 0.8, sy = dir * (dx / r) * 1.0 + (-dy / r) * 0.8;
            const vx = b * sx * p.v * 1.15, vy = (1 - b) * p.v + b * sy * p.v * 1.15;
            p.px = p.x; p.py = p.y; p.x += vx * dt; p.y += vy * dt;
            // a line of real code, fading as it melts
            if (b < 0.98 && p.y > S * 0.03 && p.y - p.ly >= S * 0.085) {
              p.ly = p.y; p.txt = CODE[(Math.random() * CODE.length) | 0];
              cx.save(); cx.globalAlpha = 1 - b; cx.fillStyle = "rgb(246,232,200)"; cx.shadowColor = "rgba(246,232,200,.9)"; cx.shadowBlur = 6 * sc;
              cx.fillText(p.txt, p.x, p.y); cx.restore();
            }
            // the soft colour that replaces it: a wide, blurred smear with a bright thin core
            if (b > 0.02) {
              const col = mix(YEL[3], p.warm ? YEL[1] : TUR[2], b);
              cx.save(); cx.globalAlpha = Math.min(0.55, b * 0.7); cx.lineCap = "round";
              cx.strokeStyle = rgb(col, 0); cx.shadowColor = rgb(col, 0); cx.shadowBlur = 12 * sc; cx.lineWidth = (4 + 8 * b) * sc;
              cx.beginPath(); cx.moveTo(p.px, p.py); cx.lineTo(p.x, p.y); cx.stroke();
              cx.globalAlpha = Math.min(0.9, b); cx.shadowBlur = 0; cx.lineWidth = 2 * sc; cx.strokeStyle = rgb(mix(col, YEL[3], 0.4), 0);
              cx.beginPath(); cx.moveTo(p.px, p.py); cx.lineTo(p.x, p.y); cx.stroke(); cx.restore();
            }
            if (p.y >= Y1) { p.r = Math.hypot(p.x - V[0], p.y - V[1]); p.th = Math.atan2(p.y - V[1], p.x - V[0]); p.ph = 1; p.dir = dir; p.om = rnd(0.55, 0.95) * dir; }
          } else {
            const x0 = V[0] + Math.cos(p.th) * p.r, y0 = V[1] + Math.sin(p.th) * p.r * 0.92;
            p.th += (p.om * S * 0.2) / (p.r + S * 0.06) * dt * 3; p.r -= S * 0.07 * dt * (0.7 + p.w * 0.08);
            const x1 = V[0] + Math.cos(p.th) * p.r, y1 = V[1] + Math.sin(p.th) * p.r * 0.92;
            brush(cx, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0) * 4 + S * 0.02, p.w * sc, ramp(stops, 1 - Math.min(1, p.r / (S * 0.42))));
            if (p.r < S * 0.035) { if (p.code) spawn(p, false); else orbit(p, false); }
          }
        }
      },
      over(cx, t) {
        halo(cx, V[0], V[1], S * (0.14 + Math.sin(t * 1.3) * 0.012), 0.9);
        sparkle(cx, V[0], V[1], S * 0.05, "#fffbe6", 1);
      },
    };
  }

  const makers = { logic: makeLogic, feel: makeFeel, drive: makeDrive, iris: makeIris, music: makeMusic, drop: makeDrop, code: makeCode };
  const items = cvs.map((cv) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const box = cv.parentElement.getBoundingClientRect();
    const S = Math.max(240, Math.round(box.width || 360));
    cv.width = cv.height = Math.round(S * dpr);
    const cx = cv.getContext("2d");
    cx.scale(dpr, dpr);
    return { cv, cx, S, art: makers[cv.dataset.art](S), vis: false };
  });

  // fade the previous marks a little, then draw new ones: strokes leave a painted trail that dissolves
  function frame(it, t, dt) {
    const cx = it.cx;
    cx.globalCompositeOperation = "destination-out";
    cx.fillStyle = it.art.clear ? "#000" : "rgba(0,0,0,.075)";
    cx.fillRect(0, 0, it.S, it.S);
    cx.globalCompositeOperation = "source-over";
    it.art.step(cx, t, dt);
    it.art.over(cx, t);
  }

  if (reduce) {
    items.forEach((it) => { for (let k = 0; k < 90; k++) frame(it, k * 0.05, 0.05); });
    return;
  }

  const io = new IntersectionObserver((es) => es.forEach((e) => { const it = items.find((x) => x.cv === e.target); if (it) it.vis = e.isIntersecting; }), { threshold: 0.05 });
  items.forEach((it) => { io.observe(it.cv); for (let k = 0; k < 60; k++) frame(it, k * 0.04, 0.04); });
  let last = performance.now(), t = 3;
  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    if (dt < 0.026) return; // about 38 frames per second is plenty for brush strokes
    last = now; t += dt;
    if (document.hidden) return;
    items.forEach((it) => { if (it.vis) frame(it, t, dt); });
  })(last);
})();
