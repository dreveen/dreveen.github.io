// Monte Carlo night, built with the compile_art method (the same one as the jellyfish):
// every object is a 3D mesh that is born as particles -> wireframe -> point cloud -> shaded surface.
// A street circuit runs right past the camera: sports cars compile while they approach, pass in the
// foreground (behind the page text) and drive away. Top right: a roulette wheel with orbiting chips.
// three.js r128. Used only by portfolio-risk.html (<canvas id="bgMonteCarlo">).
(function () {
  const canvas = document.getElementById("bgMonteCarlo");
  if (!canvas || !window.THREE) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    return;
  }
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 1);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

  // ================================================================ shaders
  const SM = "float sm(float x){ x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }\n";

  const SURF_VS = `
    attribute vec3 aCol; attribute float aOrder; attribute float aEmit; attribute float aGloss;
    varying vec3 vN; varying vec3 vCol; varying float vOrder; varying float vEmit; varying float vGloss;
    varying vec3 vView; varying vec2 vUv; varying vec3 vLocal; varying vec3 vLocalN;
    void main() {
      vLocal = position; vLocalN = normal;
      vN = normalize(normalMatrix * normal);
      vCol = aCol; vOrder = aOrder; vEmit = aEmit; vGloss = aGloss; vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }`;
  // phase 4: faces materialise (dithered dissolve) and get a glossy studio look
  const SURF_FS = `
    uniform float uP; uniform sampler2D uMap; uniform float uUseMap;
    varying vec3 vN; varying vec3 vCol; varying float vOrder; varying float vEmit; varying float vGloss;
    varying vec3 vView; varying vec2 vUv; varying vec3 vLocal; varying vec3 vLocalN;
    //PAINT_FN
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      float f = clamp(((uP - 0.35) / 0.65 * 1.2 - vOrder) / 0.18, 0.0, 1.0);
      f = f * f * (3.0 - 2.0 * f);
      if (f < 0.002 || f < hash(gl_FragCoord.xy)) discard;
      vec3 base = vCol; float emitV = vEmit, glossV = vGloss;
      if (uUseMap > 0.5) base *= texture2D(uMap, vUv).rgb;
      #ifdef PAINT
      paint(vLocal, normalize(vLocalN), base, emitV, glossV);
      #endif
      vec3 N = normalize(vN);
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(vView);
      vec3 L = normalize(vec3(-0.35, 0.85, 0.45));
      float lam = max(dot(N, L), 0.0);
      float spec = pow(max(dot(N, normalize(L + V)), 0.0), 90.0);
      float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      vec3 R = reflect(-V, N);
      float sky = smoothstep(-0.2, 0.45, R.y);
      vec3 env = mix(vec3(0.01, 0.008, 0.01), vec3(0.40, 0.33, 0.30), sky);
      env += vec3(1.0, 0.94, 0.85) * (1.0 - smoothstep(0.0, 0.07, abs(R.y - 0.42))) * 1.1;
      env += vec3(1.0, 0.85, 0.6) * (1.0 - smoothstep(0.0, 0.05, abs(R.x - 0.55))) * 0.35 * sky;
      vec3 col = base * (0.08 + 0.9 * lam) + glossV * (spec * 1.3 + env * (0.16 + 0.84 * fres));
      col = mix(col, base * 1.8, emitV);
      float fog = smoothstep(45.0, 120.0, length(vView));
      gl_FragColor = vec4(mix(col, vec3(0.0), fog), 1.0);
    }`;
  // phase 2: wireframe traced in build order, fading as the faces come in
  const WIRE_VS = `
    attribute float aOrder; uniform float uP; varying float vA; varying float vD;
    ${SM}
    void main() {
      float on = sm((uP / 0.55 * 1.15 - aOrder) / 0.12);
      float fill = sm(((uP - 0.35) / 0.65 * 1.2 - aOrder) / 0.18);
      vA = on * (1.0 - fill);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vD = length(mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`;
  const WIRE_FS = `
    uniform vec3 uCol; uniform float uAlpha; varying float vA; varying float vD;
    void main() {
      float fog = 1.0 - smoothstep(45.0, 120.0, vD);
      gl_FragColor = vec4(uCol * vA * uAlpha * fog, 1.0);
    }`;
  // phase 3: the vertices light up as a point cloud
  const PT_VS = `
    attribute float aOrder; uniform float uP; uniform float uSize; uniform float uScale; varying float vA;
    ${SM}
    void main() {
      float a = sm((uP / 0.35 * 1.15 - aOrder) / 0.15) * (1.0 - sm((uP - 0.45) / 0.35));
      vA = a;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = a > 0.001 ? max(uSize * uScale / -mv.z, 1.0) : 0.0;
      gl_Position = projectionMatrix * mv;
    }`;
  const PT_FS = `
    uniform vec3 uCol; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(uCol * smoothstep(0.5, 0.0, d) * vA, 1.0);
    }`;
  // soft light sprites (headlights, lamps, city lights, dust)
  const GLOW_VS = `
    attribute float aPh; uniform float uSize; uniform float uScale; uniform float uTime; uniform float uTw;
    varying float vT;
    void main() {
      vT = mix(1.0, pow(0.5 + 0.5 * sin(6.2831 * (uTime * (0.3 + aPh) + aPh * 7.0)), 3.0), uTw);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(uSize * uScale / -mv.z, 1.0);
      gl_Position = projectionMatrix * mv;
    }`;
  const GLOW_FS = `
    uniform vec3 uCol; uniform float uI; varying float vT;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float g = exp(-d * d * 5.0) * (1.0 - smoothstep(0.8, 1.0, d));
      gl_FragColor = vec4(uCol * g * uI * vT, 1.0);
    }`;

  const SCALE = { value: 600 };
  const TIME = { value: 0 };
  const WHITE = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  WHITE.needsUpdate = true;

  // ================================================================ the compile_art engine
  // build(nu, nv, pos, opt): pos(u, v) -> [x, y, z] on a (nu x nv) grid.
  // opt.color(u, v, p) -> [r, g, b, emit, gloss] per face; opt.order(u, v) -> build order 0..1
  function build(nu, nv, pos, opt) {
    opt = opt || {};
    const n = nu * nv;
    const P = new Float32Array(n * 3), VO = new Float32Array(n);
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const u = i / (nu - 1), v = j / (nv - 1), k = i * nv + j;
        const p = pos(u, v);
        P[k * 3] = p[0]; P[k * 3 + 1] = p[1]; P[k * 3 + 2] = p[2];
        VO[k] = (opt.order ? opt.order(u, v) : u) * 0.85 + rnd() * 0.15;
      }
    }
    const idx = [];
    for (let i = 0; i < nu - 1; i++) {
      for (let j = 0; j < nv - 1; j++) {
        const a = i * nv + j, b = a + nv;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g0 = new THREE.BufferGeometry();
    g0.setAttribute("position", new THREE.BufferAttribute(P, 3));
    g0.setIndex(idx);
    g0.computeVertexNormals();
    const NN = g0.attributes.normal.array;
    g0.dispose();

    const m = (nu - 1) * (nv - 1) * 6;
    const pos3 = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3);
    const uv = new Float32Array(m * 2), ord = new Float32Array(m), emit = new Float32Array(m), gloss = new Float32Array(m);
    const us = opt.uv || [1, 1];
    const avg = [0, 0, 0];
    let VC = null;
    if (opt.smooth && opt.color) {
      VC = [];
      for (let k = 0; k < n; k++) VC.push(opt.color(Math.floor(k / nv) / (nu - 1), (k % nv) / (nv - 1), [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]]));
    }
    let w = 0;
    for (let i = 0; i < nu - 1; i++) {
      for (let j = 0; j < nv - 1; j++) {
        const uc = (i + 0.5) / (nu - 1), vc = (j + 0.5) / (nv - 1);
        const c = opt.color ? opt.color(uc, vc, pos(uc, vc)) : opt.base || [0.8, 0.8, 0.8];
        const o = (opt.order ? opt.order(uc, vc) : uc) * 0.85 + rnd() * 0.15;
        avg[0] += c[0]; avg[1] += c[1]; avg[2] += c[2];
        const q = [i * nv + j, (i + 1) * nv + j, i * nv + j + 1, (i + 1) * nv + j, (i + 1) * nv + j + 1, i * nv + j + 1];
        for (const k of q) {
          const cc = VC ? VC[k] : c;
          pos3[w * 3] = P[k * 3]; pos3[w * 3 + 1] = P[k * 3 + 1]; pos3[w * 3 + 2] = P[k * 3 + 2];
          nor[w * 3] = NN[k * 3]; nor[w * 3 + 1] = NN[k * 3 + 1]; nor[w * 3 + 2] = NN[k * 3 + 2];
          col[w * 3] = cc[0]; col[w * 3 + 1] = cc[1]; col[w * 3 + 2] = cc[2];
          emit[w] = cc[3] || 0;
          gloss[w] = cc[4] !== undefined ? cc[4] : opt.gloss !== undefined ? opt.gloss : 0.3;
          ord[w] = o;
          const U = Math.floor(k / nv) / (nu - 1), V = (k % nv) / (nv - 1);
          if (opt.swapUV) { uv[w * 2] = V * us[0]; uv[w * 2 + 1] = U * us[1]; }
          else { uv[w * 2] = U * us[0]; uv[w * 2 + 1] = V * us[1]; }
          w++;
        }
      }
    }
    const nq = (nu - 1) * (nv - 1);
    const tint = new THREE.Color(0.62 * 0.9 + 0.38 * avg[0] / nq, 0.62 * 0.95 + 0.38 * avg[1] / nq, 0.62 + 0.38 * avg[2] / nq);
    if (opt.wire) tint.set(opt.wire);
    const U = { value: 0 };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos3, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aOrder", new THREE.BufferAttribute(ord, 1));
    geo.setAttribute("aEmit", new THREE.BufferAttribute(emit, 1));
    geo.setAttribute("aGloss", new THREE.BufferAttribute(gloss, 1));
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { uP: U, uMap: { value: opt.map || WHITE }, uUseMap: { value: opt.map ? 1 : 0 } },
      vertexShader: SURF_VS, side: THREE.DoubleSide,
      fragmentShader: opt.paint ? SURF_FS.replace("//PAINT_FN", opt.paint) : SURF_FS,
      defines: opt.paint ? { PAINT: 1 } : {},
    }));

    const LP = [], LO = [];
    const seg = (a, b) => {
      LP.push(P[a * 3], P[a * 3 + 1], P[a * 3 + 2], P[b * 3], P[b * 3 + 1], P[b * 3 + 2]);
      LO.push(VO[a], VO[b]);
    };
    const su = opt.wu || 1, sv = opt.wv || 1;
    for (let i = 0; i < nu; i += su) for (let j = 0; j < nv - 1; j++) seg(i * nv + j, i * nv + j + 1);
    for (let j = 0; j < nv; j += sv) for (let i = 0; i < nu - 1; i++) seg(i * nv + j, (i + 1) * nv + j);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LP), 3));
    lg.setAttribute("aOrder", new THREE.BufferAttribute(new Float32Array(LO), 1));
    const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
      uniforms: { uP: U, uCol: { value: tint }, uAlpha: { value: opt.wireAlpha || 0.85 } },
      vertexShader: WIRE_VS, fragmentShader: WIRE_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));

    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(P, 3));
    pg.setAttribute("aOrder", new THREE.BufferAttribute(VO, 1));
    const points = new THREE.Points(pg, new THREE.ShaderMaterial({
      uniforms: { uP: U, uCol: { value: tint.clone().multiplyScalar(1.15) }, uSize: { value: opt.pt || 0.06 }, uScale: SCALE },
      vertexShader: PT_VS, fragmentShader: PT_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));

    const group = new THREE.Group();
    group.add(mesh, lines, points);
    group.setP = (p) => { U.value = p; group.visible = p > 0; };
    group.setP(0);
    return group;
  }

  function glow(pts, col, size, opt) {
    opt = opt || {};
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts.flat()), 3));
    g.setAttribute("aPh", new THREE.BufferAttribute(new Float32Array(pts.map(() => rnd())), 1));
    const I = { value: opt.i === undefined ? 1 : opt.i };
    const o = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(col) }, uSize: { value: size }, uScale: SCALE, uTime: TIME,
        uTw: { value: opt.twinkle || 0 }, uI: I },
      vertexShader: GLOW_VS, fragmentShader: GLOW_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    o.I = I;
    return o;
  }

  // smooth profile through control points [[u, value], ...]
  function curve(pts) {
    const n = pts.length;
    return (u) => {
      u = clamp(u, 0, 1);
      let i = 1;
      while (i < n - 1 && u > pts[i][0]) i++;
      const a = pts[i - 1], b = pts[i];
      const t = (u - a[0]) / (b[0] - a[0] || 1);
      const p0 = (pts[i - 2] || a)[1], p1 = a[1], p2 = b[1], p3 = (pts[i + 1] || b)[1];
      const t2 = t * t, t3 = t2 * t;
      return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };
  }

  // revolve a polyline profile [[r, y], ...] around the y axis
  function revolve(profile, nu, nv, opt) {
    const segL = [];
    let tot = 0;
    for (let i = 1; i < profile.length; i++) {
      tot += Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]);
      segL.push(tot);
    }
    const at = (u) => {
      const d = u * tot;
      let i = 0;
      while (i < segL.length - 1 && segL[i] < d) i++;
      const d0 = i ? segL[i - 1] : 0;
      const f = (d - d0) / (segL[i] - d0 || 1);
      return [lerp(profile[i][0], profile[i + 1][0], f), lerp(profile[i][1], profile[i + 1][1], f)];
    };
    return build(nu, nv, (u, v) => {
      const p = at(u), th = v * TAU;
      return [p[0] * Math.cos(th), p[1], p[0] * Math.sin(th)];
    }, opt);
  }

  // tube along a polyline of 3D points
  function tube(pts, radius, nu, nv, opt) {
    const path = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const frames = path.computeFrenetFrames(nu - 1, false);
    return build(nu, nv, (u, v) => {
      const i = Math.round(u * (nu - 1));
      const c = path.getPointAt(u), N = frames.normals[i], B = frames.binormals[i];
      const r = typeof radius === "function" ? radius(u) : radius, th = v * TAU;
      return [c.x + r * (Math.cos(th) * N.x + Math.sin(th) * B.x), c.y + r * (Math.cos(th) * N.y + Math.sin(th) * B.y),
        c.z + r * (Math.cos(th) * N.z + Math.sin(th) * B.z)];
    }, opt);
  }

  function canvasTex(w, h, draw) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // ================================================================ scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const look = new THREE.Vector3();
  const camBase = new THREE.Vector3();
  const timeline = [];        // [object, start, duration] driven by the page clock
  const at = (obj, start, dur) => { timeline.push([obj, start, dur]); return obj; };

  // ---------------------------------------------------------------- circuit
  const path = new THREE.CatmullRomCurve3([
    [-5, -70], [-8, -42], [-10.5, -22], [-9.5, -9], [-5.5, -0.5], [0, 2.4], [5.5, 0.2], [9.5, -8], [10.5, -21], [8.5, -40], [6, -70],
  ].map((a) => new THREE.Vector3(a[0], 0, a[1])), false, "centripetal");
  const PL = path.getLength();
  const HW = 3.6;
  const NS = 900;
  const SP = path.getSpacedPoints(NS), ST = [];
  for (let i = 0; i <= NS; i++) ST.push(path.getTangentAt(i / NS));
  function onTrack(u, lat, y) {
    const f = clamp(u, 0, 1) * NS, i = Math.min(Math.floor(f), NS - 1), k = f - i;
    const px = lerp(SP[i].x, SP[i + 1].x, k), pz = lerp(SP[i].z, SP[i + 1].z, k);
    const tx = lerp(ST[i].x, ST[i + 1].x, k), tz = lerp(ST[i].z, ST[i + 1].z, k);
    const l = Math.hypot(tx, tz);
    return [px - (tz / l) * lat, y || 0, pz + (tx / l) * lat];
  }

  const asphalt = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = "#1a1a1e"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) {
      const v = 20 + Math.floor(rnd() * 26);
      g.fillStyle = `rgb(${v},${v},${v + 3})`;
      g.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    for (let k = 0; k < 8; k++) {           // red and white kerbs on both edges
      g.fillStyle = k % 2 ? "#f2f2f2" : "#c8101e";
      g.fillRect((k * w) / 8, 0, w / 8 + 1, 16);
      g.fillRect((k * w) / 8, h - 16, w / 8 + 1, 16);
    }
    g.fillStyle = "#e8e8e8";
    g.fillRect(0, 22, w, 4); g.fillRect(0, h - 26, w, 4);
    g.fillRect(0, h / 2 - 2, w * 0.45, 4); g.fillRect(w * 0.55 + 0, h / 2 - 2, w * 0.4, 4);
  });
  asphalt.wrapS = THREE.RepeatWrapping;
  const track = at(build(320, 6, (u, v) => onTrack(u, (v - 0.5) * 2 * HW), {
    map: asphalt, uv: [PL / 14, 1], base: [1, 1, 1, 0, 0.25], wu: 2, pt: 0.05,
  }), 0, 4);
  scene.add(track);

  // barriers along both sides, silver rails with a red and white band
  for (const side of [1, -1]) {
    const b = build(320, 4, (u, v) => onTrack(u, side * (HW + 0.6), v * 0.55), {
      color: (u, v) => (v > 0.66 ? (Math.floor(u * PL / 2) % 2 ? [0.9, 0.9, 0.9] : [0.75, 0.05, 0.08]) : v > 0.33 ? [0.62, 0.64, 0.68] : [0.2, 0.2, 0.22]),
      gloss: 0.7, wu: 4, pt: 0.04,
    });
    scene.add(at(b, 0.6, 4));
  }

  // street lamps: thin posts with a warm head
  const lampHeads = [];
  for (let k = 0; k < 14; k++) {
    const u = 0.04 + (k / 13) * 0.92, side = k % 2 ? 1 : -1;
    const base = onTrack(u, side * (HW + 1.6));
    const top = [base[0], 6.2, base[2]];
    const arm = onTrack(u, side * (HW + 0.2), 6.0);
    const post = tube([base, [base[0], 3, base[2]], top, arm], 0.07, 12, 6, { base: [0.25, 0.25, 0.28, 0, 0.6], pt: 0.04 });
    scene.add(at(post, 0.8 + k * 0.12, 2.2));
    lampHeads.push(arm);
  }
  const lamps = glow(lampHeads.map((p) => [p[0], p[1] - 0.15, p[2]]), "#ffd9a0", 2.2);
  lamps.I.value = 0;
  scene.add(lamps);

  // the hillside lights of the principality, far away
  const city = [];
  for (let i = 0; i < 700; i++) {
    const x = (rnd() - 0.5) * 220;
    const hill = 26 * Math.exp(-Math.pow(x / 70, 2)) + 4;
    city.push([x, rnd() * hill, -95 - rnd() * 25]);
  }
  const cityLights = glow(city, "#ffcf8a", 0.9, { twinkle: 0.6, i: 0 });
  scene.add(cityLights);

  // dust in the air
  const dustPts = [];
  for (let i = 0; i < 380; i++) dustPts.push([(rnd() - 0.5) * 40, rnd() * 14, -rnd() * 40 + 6]);
  const dust = glow(dustPts, "#f1deb8", 0.09, { twinkle: 1, i: 0 });
  scene.add(dust);

  // ---------------------------------------------------------------- cars
  // body = lofted superellipse sections; u: tail (0) -> nose (1), v: around the section
  function carBody(S) {
    const top = curve(S.top), mid = curve(S.mid), wid = curve(S.w), topW = curve(S.topW);
    const dip = S.dip || (() => 0);
    const bot = (u) => {
      let y = S.clear;
      for (const wu of S.wheels) {
        const d = (u - wu) / S.archU;
        if (Math.abs(d) < 1) y = Math.max(y, S.clear + S.archH * Math.sqrt(1 - d * d));
      }
      return Math.min(y, mid(u) - 0.13);
    };
    const cap = (u) => (u < S.capT ? Math.sqrt(Math.sin((Math.PI / 2) * u / S.capT))
      : u > 1 - S.capN ? Math.sqrt(Math.sin((Math.PI / 2) * (1 - u) / S.capN)) : 1);
    S.width = wid;
    S.mid = mid;
    return (u, v) => {
      const th = v * TAU, c = Math.cos(th), s = Math.sin(th), n = S.n;
      const pc = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ps = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      const ym = mid(u), e = cap(u);
      let z = wid(u) * pc, y;
      if (s >= 0) {
        z *= lerp(1, topW(u), Math.pow(s, 1.3));
        y = ym + (top(u) - ym) * ps - dip(u) * s * s * (1 - Math.pow(Math.abs(pc), 6));
      } else {
        y = ym + (ym - bot(u)) * ps;
      }
      return [(u - 0.5) * S.len, ym + (y - ym) * Math.sqrt(e), z * e];
    };
  }

  function wheel(R, rim, caliper, spokes) {
    const g = new THREE.Group();
    const tire = build(40, 14, (u, v) => {
      const ph = v * TAU, th = u * TAU, r = R - 0.055 + 0.055 * Math.cos(ph);
      return [r * Math.cos(th), r * Math.sin(th), 0.13 * Math.sin(ph)];
    }, { base: [0.03, 0.03, 0.035, 0, 0.12], pt: 0.025 });
    const face = build(12, 72, (u, v) => {
      const r = u * (R - 0.075), th = v * TAU;
      return [r * Math.cos(th), r * Math.sin(th), 0.11 - 0.06 * u * u];
    }, {
      color: (u, v) => {
        const th = v * TAU;
        if (u < 0.16 || u > 0.9 || (Math.cos(spokes * th) > 0.25 && Math.abs(Math.sin(spokes * th)) > 0.09)) return [...rim, 0, 1];
        if (u > 0.5 && u < 0.86 && th > 0.5 && th < 1.4) return [...caliper, 0, 0.7];
        return [0.02, 0.02, 0.025, 0, 0.1];
      }, pt: 0.025,
    });
    g.add(tire, face);
    g.setP = (p) => { tire.setP(p); face.setP(p); };
    return g;
  }

  function makeCar(S, paint, rim, caliper, spokes) {
    const car = new THREE.Group();
    const body = build(170, 72, carBody(S), { base: [...S.paintRGB, 0, 0.95], paint: paint, pt: 0.03, wu: 2 });
    car.add(body);
    const wheels = [];
    for (const wu of S.wheels) {
      for (const side of [1, -1]) {
        const piv = new THREE.Group(), spin = new THREE.Group(), w = wheel(S.Rw, rim, caliper, spokes);
        spin.add(w); piv.add(spin);
        piv.position.set((wu - 0.5) * S.len, S.Rw, side * (S.width(wu) - 0.17));
        if (side < 0) piv.rotation.y = Math.PI;
        car.add(piv);
        wheels.push({ spin: spin, side: side, w: w });
      }
    }
    const parts = [];
    if (S.mirror) {
      for (const side of [1, -1]) {
        const mx = S.mirror[0], my = S.mirror[1], mz = side * S.mirror[2];
        const m = build(10, 16, (u, v) => {
          const a = u * Math.PI, b = v * TAU;
          return [mx + 0.13 * Math.cos(a), my + 0.06 * Math.sin(a) * Math.sin(b), mz + side * 0.09 * Math.sin(a) * (0.6 + 0.4 * Math.cos(b))];
        }, { color: () => [...S.paintRGB, 0, 0.95], pt: 0.02 });
        car.add(m);
        parts.push(m);
      }
    }
    const L2 = S.len / 2;
    const heads = glow(S.headGlow.flatMap((p) => [[L2 - p[2], p[0], p[1]], [L2 - p[2], p[0], -p[1]]]), "#fff3dc", 0.28);
    const tails = glow(S.tailGlow.flatMap((p) => [[-L2 + p[2], p[0], p[1]], [-L2 + p[2], p[0], -p[1]]]), "#ff2020", 0.22);
    car.add(heads, tails);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(S.len * 1.25, 2.6), new THREE.MeshBasicMaterial({
      map: canvasTex(128, 64, (g, w, h) => {
        const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        r.addColorStop(0, "rgba(0,0,0,.9)"); r.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = r; g.save(); g.scale(1, h / w); g.fillRect(0, 0, w, w); g.restore();
      }), transparent: true, depthWrite: false,
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    shadow.renderOrder = -1;
    car.add(shadow);
    car.setP = (p) => {
      body.setP(smooth(p / 0.9));
      parts.forEach((m) => m.setP(smooth((p - 0.3) / 0.7)));
      wheels.forEach((w) => w.w.setP(smooth((p - 0.12) / 0.88)));
      const lit = smooth((p - 0.8) / 0.2);
      heads.I.value = lit; tails.I.value = lit;
      shadow.material.opacity = smooth(p / 0.6);
      car.visible = p > 0;
    };
    car.roll = (d) => wheels.forEach((w) => { w.spin.rotation.z -= (w.side * d) / S.Rw; });
    car.setP(0);
    return car;
  }

  // red mid-engine berlinetta, proportions of a Ferrari 296 GTB (no badges)
  const FER = {
    len: 4.57, n: 3.6, clear: 0.1, Rw: 0.35, wheels: [0.22, 0.79], archU: 0.094, archH: 0.62, capT: 0.02, capN: 0.045,
    top: [[0, 0.6], [0.015, 0.9], [0.035, 0.99], [0.08, 0.96], [0.2, 1.0], [0.3, 1.07], [0.4, 1.17], [0.48, 1.19],
      [0.55, 1.14], [0.62, 1.0], [0.68, 0.86], [0.74, 0.79], [0.85, 0.72], [0.93, 0.6], [0.98, 0.48], [1, 0.4]],
    mid: [[0, 0.66], [0.2, 0.78], [0.4, 0.7], [0.6, 0.65], [0.8, 0.64], [0.95, 0.5], [1, 0.36]],
    w: [[0, 0.88], [0.05, 0.98], [0.2, 1.02], [0.33, 0.96], [0.5, 0.91], [0.65, 0.92], [0.8, 0.96], [0.93, 0.92], [1, 0.7]],
    topW: [[0, 0.88], [0.25, 0.82], [0.36, 0.62], [0.47, 0.58], [0.58, 0.62], [0.66, 0.8], [0.75, 0.9], [1, 0.9]],
    dip: (u) => 0.035 * smooth((u - 0.7) / 0.06) * (1 - smooth((u - 0.98) / 0.02)),
    mirror: [0.32, 0.94, 0.9], paintRGB: C("#c8001c"),
    headGlow: [[0.57, 0.66, 0.3]], tailGlow: [[0.87, 0.64, 0.02]],
  };
  const ferrari = makeCar(FER, `
    void paint(vec3 p, vec3 n, inout vec3 c, inout float e, inout float g) {
      float x = p.x, y = p.y, az = abs(p.z), L2 = 2.285;
      vec3 CF = vec3(0.035, 0.035, 0.04), GL = vec3(0.012, 0.016, 0.025);
      c = vec3(0.78, 0.0, 0.07); g = 0.95; e = 0.0;
      if (y < 0.27) { c = CF; g = 0.3; }
      float sc = (x + 1.02) / 0.62;                                       // high side intake behind the door
      if (sc > 0.0 && sc < 1.0 && y > 0.7 + 0.16 * sc && y < 0.96 - 0.02 * sc && abs(n.z) > 0.3 && y < 0.88 + (1.0 - sc) * 0.2) { c = CF; g = 0.3; }
      if (sc > 0.0 && sc < 1.2 && abs(y - (0.66 + 0.2 * clamp(sc, 0.0, 1.0))) < 0.012 && abs(n.z) > 0.5) { c *= 0.45; }  // scallop crease
      if (y > 0.84 && x > 0.16 && x < 0.9 && n.y > 0.2) { c = GL; g = 1.0; }                      // visor windscreen
      if (y > 0.88 && y < 1.15 && x > -0.58 + (1.15 - y) * 1.3 && x < 0.32 && abs(n.z) > 0.3) { c = GL; g = 1.0; } // side glass
      if (y > 0.98 && x < -1.05 && x > -1.9 && az < 0.42 && n.y > 0.7 && fract(x * 5.0) < 0.5) { c = CF; g = 0.5; } // louvres
      if (x > L2 - 0.62 && az > 0.42 && az < 0.86) {                      // slim slanted headlights on the nose corners
        float yl = 0.52 + (az - 0.42) * 0.16 + (x - (L2 - 0.62)) * -0.05;
        if (abs(y - yl) < 0.024 && n.x > 0.05) { c = vec3(0.96, 0.97, 1.0); e = 1.0; g = 1.0; }
      }
      if (x > L2 - 0.32 && az > 0.42 && az < 0.72 && y > 0.28 && y < 0.56) { c = CF; g = 0.4; }  // tear-drop vents
      if (x > L2 - 0.2 && y < 0.4 && az < 0.78) { c = CF; g = 0.3; }                           // front grille
      if (x < -L2 + 0.12) {                                                // tail
        if (y < 0.55) { c = CF; g = 0.3; }
        if (y > 0.5 && y < 0.62 && az < 0.16) { c = vec3(0.45, 0.45, 0.47); g = 1.0; }
        if (y > 0.84 && y < 0.9 && az > 0.42 && az < 0.86) { c = vec3(1.0, 0.06, 0.04); e = 1.0; g = 0.6; }
      }
    }`, C("#b9bdc3"), C("#f2c200"), 5);

  // silver rear-engine German sports coupe
  const POR = {
    len: 4.52, n: 3.0, clear: 0.12, Rw: 0.345, wheels: [0.2, 0.82], archU: 0.09, archH: 0.62, capT: 0.03, capN: 0.05,
    top: [[0, 0.62], [0.02, 0.86], [0.05, 0.94], [0.08, 0.92], [0.18, 1.0], [0.3, 1.13], [0.42, 1.25], [0.5, 1.29],
      [0.57, 1.27], [0.63, 1.14], [0.69, 0.94], [0.74, 0.84], [0.86, 0.78], [0.95, 0.68], [1, 0.5]],
    mid: [[0, 0.66], [0.2, 0.74], [0.5, 0.68], [0.8, 0.7], [0.94, 0.62], [1, 0.45]],
    w: [[0, 0.88], [0.07, 0.99], [0.18, 1.02], [0.32, 0.9], [0.55, 0.86], [0.75, 0.91], [0.9, 0.9], [1, 0.72]],
    topW: [[0, 0.84], [0.12, 0.76], [0.3, 0.64], [0.45, 0.6], [0.58, 0.63], [0.68, 0.8], [0.8, 0.94], [1, 0.95]],
    dip: (u) => 0.1 * smooth((u - 0.68) / 0.06) * (1 - smooth((u - 0.97) / 0.03)),
    mirror: [0.5, 0.96, 0.86], paintRGB: C("#9ea3aa"),
    headGlow: [[0.74, 0.6, 0.36]], tailGlow: [[0.83, 0.55, 0.02], [0.83, 0.2, 0.02]],
  };
  const porsche = makeCar(POR, `
    void paint(vec3 p, vec3 n, inout vec3 c, inout float e, inout float g) {
      float x = p.x, y = p.y, az = abs(p.z), L2 = 2.26;
      vec3 CF = vec3(0.035, 0.035, 0.04), GL = vec3(0.012, 0.016, 0.025), SV = vec3(0.56, 0.58, 0.61);
      c = SV; g = 0.85; e = 0.0;
      if (y < 0.27) { c = CF; g = 0.3; }
      if (y > 0.88 && x > 0.5 && x < 1.02 && n.y > 0.2) { c = GL; g = 1.0; }                     // raked windscreen
      float belt = 0.93 + max(0.0, -x - 0.2) * 0.12;                       // long teardrop side window
      if (y > belt && x < 0.52 - (y - 0.93) * 0.9 && x > -1.12 + pow(max(y - belt, 0.0), 0.6) * 0.9 && abs(n.z) > 0.28) { c = GL; g = 1.0; }
      if (y > 0.98 && x > -1.6 && x < -0.85 && az < 0.5 && n.y > 0.45) { c = GL; g = 1.0; }       // fastback rear screen
      if (y > 0.88 && x > -2.0 && x < -1.62 && az < 0.42 && n.y > 0.6 && fract(x * 9.0) < 0.5) { c = CF; g = 0.4; } // engine lid louvres
      if (x < -2.04 && y > 0.88 && n.y > 0.3) { c = CF; g = 0.5; }        // spoiler lip
      float hd = length(vec2(x - (L2 - 0.36), az - 0.6));                  // round headlights on the wings
      if (y > 0.58 && hd < 0.19) {
        c = CF; g = 1.0;                                                   // black bezel
        if (hd < 0.155) { c = vec3(0.8, 0.82, 0.86); e = 0.35; }
        float a = atan(az - 0.6, x - (L2 - 0.36));
        if (hd < 0.13 && hd > 0.1 && fract(a / 1.5708 + 0.125) < 0.22) { c = vec3(1.0); e = 1.0; } // 4-point light signature
        if (hd < 0.05) { c = vec3(1.0); e = 1.0; }
      }
      if (x > L2 - 0.16 && y < 0.44 && y > 0.18) {                        // three front intakes
        if (az < 0.32 || (az > 0.46 && az < 0.84)) { c = CF; g = 0.3; }
        if (az > 0.52 && az < 0.8 && abs(y - 0.4) < 0.012) { c = vec3(1.0); e = 1.0; }
      }
      if (x < -L2 + 0.1 && y > 0.8 && y < 0.86) { c = vec3(1.0, 0.04, 0.04); e = 1.0; g = 0.6; } // full-width light bar
      if (x < -L2 + 0.12 && y < 0.5) { c = CF; g = 0.3; }
      if (abs(y - 0.74) < 0.006 && x > -1.3 && x < 1.6 && abs(n.z) > 0.6) { c *= 0.7; }  // shoulder line
    }`, C("#c9ccd1"), C("#c3001a"), 5);
  scene.add(ferrari, porsche);

  // ---------------------------------------------------------------- roulette
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16,
    33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const STEP = TAU / 37;
  const pocketCol = (n) => (n === 0 ? "#0c7a3c" : REDS.has(n) ? "#b5122e" : "#121214");
  const ringTex = (numbers) => canvasTex(2048, 256, (g, w, h) => {
    const cw = w / 37;
    for (let i = 0; i < 37; i++) {
      g.fillStyle = pocketCol(ORDER[i]);
      g.fillRect(i * cw, 0, cw + 1, h);
      if (numbers) {
        g.save();
        g.translate(i * cw + cw / 2, h * 0.7);
        g.rotate(Math.PI);
        g.fillStyle = "#f6efe2";
        g.font = "600 40px Inter, Arial, sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(ORDER[i]), 0, 0);
        g.restore();
      } else {
        g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(i * cw, 0, cw + 1, h);
      }
      g.fillStyle = "#d9bd86";
      g.fillRect(i * cw - 2, 0, 4, h);
    }
  });

  const roulette = new THREE.Group();
  const wheelSpin = new THREE.Group();
  roulette.add(wheelSpin);
  scene.add(roulette);
  const WOOD = C("#4a1f0c"), GOLD = C("#d9bd86");
  const bowl = revolve([[1.85, -0.42], [2.3, -0.32], [2.44, -0.05], [2.44, 0.26], [2.3, 0.34], [2.15, 0.3], [1.95, 0.14], [1.82, 0.06]], 40, 96, {
    color: (u) => (u < 0.5 ? [...WOOD, 0, 0.7] : u < 0.62 ? [...GOLD, 0, 1] : [0.07, 0.045, 0.035, 0, 0.9]), pt: 0.03,
  });
  const numbers = build(6, 148, (u, v) => {
    const r = lerp(1.82, 1.36, u), th = v * TAU;
    return [r * Math.cos(th), 0.06 - 0.06 * u, r * Math.sin(th)];
  }, { map: ringTex(true), swapUV: true, base: [1, 1, 1, 0, 0.5], wv: 4, pt: 0.03 });
  const pockets = build(6, 148, (u, v) => {
    const r = lerp(1.36, 0.98, u), th = v * TAU;
    return [r * Math.cos(th), -0.1 * Math.sin(Math.PI * u) - 0.02, r * Math.sin(th)];
  }, { map: ringTex(false), swapUV: true, base: [1, 1, 1, 0, 0.6], wv: 4, pt: 0.03 });
  const cone = revolve([[0.98, -0.02], [0.7, 0.12], [0.42, 0.28], [0.2, 0.36]], 16, 72, {
    color: (u, v) => (Math.abs(Math.cos(4 * v * TAU)) > 0.995 ? [...GOLD, 0, 1] : [0.33 - 0.1 * u, 0.16 - 0.05 * u, 0.07, 0, 0.8]), pt: 0.03,
  });
  const turret = revolve([[0.2, 0.36], [0.16, 0.48], [0.09, 0.54], [0.05, 0.74], [0.1, 0.8], [0.0, 0.88]], 20, 40, {
    base: [...GOLD, 0, 1], pt: 0.02,
  });
  const arms = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4, d = [Math.cos(a), Math.sin(a)];
    arms.push(tube([[d[0] * 0.08, 0.66, d[1] * 0.08], [d[0] * 0.3, 0.64, d[1] * 0.3], [d[0] * 0.5, 0.62, d[1] * 0.5]],
      (u) => 0.025 + 0.03 * Math.pow(u, 8), 14, 8, { base: [...GOLD, 0, 1], pt: 0.02 }));
  }
  wheelSpin.add(numbers, pockets, cone, turret, ...arms);
  roulette.add(bowl);
  const ballMesh = revolve([[0, -0.075], [0.053, -0.053], [0.075, 0], [0.053, 0.053], [0, 0.075]], 10, 16, { base: [0.95, 0.95, 0.97, 0, 1], pt: 0.02 });
  roulette.add(ballMesh);
  const rouletteParts = [[bowl, 0, 0.55], [numbers, 0.15, 0.75], [pockets, 0.22, 0.8], [cone, 0.3, 0.85], [turret, 0.45, 1], ...arms.map((a, i) => [a, 0.5 + i * 0.05, 1])];
  roulette.setP = (p) => rouletteParts.forEach(([o, a, b]) => o.setP(clamp((p - a) / (b - a), 0, 1)));
  at(roulette, 0.6, 4.4);

  // result board under the wheel
  const boardCv = document.createElement("canvas");
  boardCv.width = 1024; boardCv.height = 160;
  const boardTex = new THREE.CanvasTexture(boardCv);
  const board = new THREE.Sprite(new THREE.SpriteMaterial({ map: boardTex, transparent: true, depthWrite: false, opacity: 0 }));
  board.scale.set(6, 0.94, 1);
  board.position.set(0, -1.6, 0);
  roulette.add(board);
  let boardKey = "";
  function drawBoard(count, list) {
    const it = document.documentElement.lang === "it";
    const key = count + list.join(",") + it;
    if (key === boardKey) return;
    boardKey = key;
    const g = boardCv.getContext("2d");
    g.clearRect(0, 0, 1024, 160);
    if (!list.length) { boardTex.needsUpdate = true; return; }
    const last = list[list.length - 1];
    const name = last === 0 ? (it ? "verde" : "green") : REDS.has(last) ? (it ? "rosso" : "red") : (it ? "nero" : "black");
    g.textAlign = "center";
    g.font = "400 46px ui-monospace, Menlo, Consolas, monospace";
    g.fillStyle = "rgba(201,168,122,.95)";
    g.fillText(`${it ? "giro" : "spin"} ${count}  ·  ${last} ${name}`, 512, 60);
    g.font = "400 38px ui-monospace, Menlo, Consolas, monospace";
    g.fillStyle = "rgba(201,168,122,.5)";
    g.fillText(list.join("   "), 512, 128);
    boardTex.needsUpdate = true;
  }

  // poker chips orbiting the wheel
  function chip(hex) {
    const R = 0.26, T = 0.055, base = C(hex);
    return build(26, 48, (u, v) => {
      const th = v * TAU;
      let r, y;
      if (u < 0.4) { r = R * (u / 0.4); y = T / 2; }
      else if (u < 0.6) { const a = ((u - 0.4) / 0.2) * Math.PI; r = R + 0.012 * Math.sin(a); y = (T / 2) * Math.cos(a); }
      else { r = R * (1 - (u - 0.6) / 0.4); y = -T / 2; }
      return [r * Math.cos(th), y, r * Math.sin(th)];
    }, {
      color: (u, v) => {
        const stripe = Math.cos(8 * v * TAU) > 0.45;
        if (u > 0.4 && u < 0.6) return stripe ? [0.95, 0.94, 0.9, 0, 0.6] : [...base, 0, 0.6];
        const rr = u < 0.4 ? u / 0.4 : 1 - (u - 0.6) / 0.4;
        if (rr > 0.72 && rr < 0.88 && stripe) return [0.95, 0.94, 0.9, 0, 0.6];
        if (rr > 0.5 && rr < 0.56) return [...GOLD, 0, 1];
        return [...base, 0, 0.6];
      }, order: (u) => Math.abs(u - 0.5) * 2, pt: 0.02,
    });
  }
  // a few poker chips scattered all over the scene, floating and tumbling slowly
  // [screen x, screen y (-1..1), distance from the camera]
  const CHIP_SPOTS = [[-0.86, 0.62, 13], [-0.32, 0.86, 26], [0.12, 0.5, 34], [0.92, -0.18, 11],
    [-0.62, -0.3, 9], [0.42, -0.62, 8.5], [-0.08, 0.12, 40], [0.3, 0.9, 18]];
  const chips = ["#b5122e", "#121214", "#0c7a3c", "#1d3fa8", "#c9a87a", "#f2f2f2", "#6b2fa0", "#b5122e"].map((hex, i) => {
    const c = chip(hex);
    c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    c.scale.setScalar(1.4);
    scene.add(c);
    at(c, 1.6 + i * 0.35, 2.4);
    return { c: c, spot: CHIP_SPOTS[i], base: new THREE.Vector3(), ph: rnd() * TAU, sx: 0.3 + rnd() * 0.6, sz: 0.2 + rnd() * 0.5 };
  });

  // ================================================================ layout
  let rouletteAt = [0.6, 0.36, 22];
  function resize() {
    const W = canvas.clientWidth || window.innerWidth, H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    if (camera.aspect >= 1) {
      camera.fov = 36;
      camBase.set(0, 3.1, 16); look.set(0, 0.8, -4);
      rouletteAt = [0.6, 0.36, 22];
    } else {
      camera.fov = 56;
      camBase.set(0, 3.4, 17); look.set(0, 1.4, -4);
      rouletteAt = [0.36, 0.5, 27];
    }
    // pin the wheel to a spot on screen (normalised device coords + distance), whatever the window size
    camera.position.copy(camBase);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const dir = new THREE.Vector3(rouletteAt[0], rouletteAt[1], 0.5).unproject(camera).sub(camera.position).normalize();
    roulette.position.copy(camera.position).addScaledVector(dir, rouletteAt[2]);
    roulette.rotation.set(0.62, 0, -0.12);
    for (const c of chips) {
      const d = new THREE.Vector3(c.spot[0], c.spot[1], 0.5).unproject(camera).sub(camera.position).normalize();
      c.base.copy(camera.position).addScaledVector(d, c.spot[2]);
      c.c.position.copy(c.base);
    }
    camera.updateProjectionMatrix();
    SCALE.value = (H * DPR) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  }
  resize();
  window.addEventListener("resize", () => { resize(); if (still) render(30, 0); });

  // ================================================================ choreography
  // cars compile while they approach, are solid when they reach the foreground, then drive away
  let sNear = 0, best = 1e9;
  for (let i = 0; i <= NS; i++) {
    const d = Math.hypot(SP[i].x, SP[i].z - 16);
    if (d < best) { best = d; sNear = (i / NS) * PL; }
  }
  const runs = [
    { car: ferrari, lane: 1.6, offset: 0, s: -1 },
    { car: porsche, lane: -1.4, offset: 5, s: -1 },
  ];
  const PERIOD = 10, FIRST = 3.2;
  const spins = [];
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function placeCar(r, s) {
    const u = s / PL;
    const p = onTrack(u, r.lane), q = onTrack(Math.min(u + 0.003, 1), r.lane);
    r.car.position.set(p[0], 0, p[2]);
    r.car.rotation.y = Math.atan2(-(q[2] - p[2]), q[0] - p[0]);
  }

  function render(t, dt) {
    TIME.value = t;
    for (const [o, a, d] of timeline) o.setP(clamp((t - a) / d, 0, 1));
    lamps.I.value = smooth((t - 2.5) / 1.5);
    cityLights.I.value = smooth((t - 0.3) / 3);
    dust.I.value = smooth(t / 1.5);

    // cars
    for (const r of runs) {
      if (still) { r.car.setP(r === runs[0] ? 1 : 0); if (r === runs[0]) placeCar(r, sNear); continue; }
      const k = Math.floor((t - FIRST - r.offset) / PERIOD);
      if (t > FIRST + r.offset && k !== r.k) { r.k = k; r.s = 0; }
      if (r.s < 0 || r.s >= PL) { r.car.setP(0); continue; }
      const pos = r.car.position;
      const dist = Math.hypot(pos.x - camera.position.x, pos.z - camera.position.z);
      const v = lerp(5.5, 44, smooth((dist - 12.5) / 26));
      r.s += v * dt;
      r.car.roll(v * dt);
      placeCar(r, Math.min(r.s, PL));
      r.car.setP(smooth(r.s / (sNear * 0.82)));
    }

    // roulette: wheel turns, the ball runs the other way, slows and drops into a pocket
    const wa = still ? 0.5 : t * 0.45;
    wheelSpin.rotation.y = wa;
    const T0 = 5.2, SPIN = 9, TL = 6.5;
    if (t > T0 && !still) {
      const tau = (t - T0) % SPIN, cyc = Math.floor((t - T0) / SPIN);
      while (spins.length <= cyc) spins.push(Math.floor(rnd() * 37));
      const pe = (spins[cyc] + 0.5) * STEP;
      const prog = Math.min(tau / TL, 1);
      const ang = -wa + pe - 9 * Math.pow(1 - prog, 3);
      let r = 2.03, y = 0.2;
      if (tau > 4.6) {
        const d = smooth((tau - 4.6) / 1.9);
        r = lerp(2.03, 1.17, d);
        y = lerp(0.2, 0.0, d) + 0.08 * Math.abs(Math.sin(tau * 9)) * (1 - d);
      }
      ballMesh.position.set(r * Math.cos(ang), y, r * Math.sin(ang));
      ballMesh.setP(1);
      const count = tau >= TL ? cyc + 1 : cyc;
      drawBoard(count, spins.slice(0, count).slice(-6).map((s) => ORDER[s]));
      board.material.opacity = smooth((t - T0 - TL) / 1);
    } else {
      ballMesh.setP(0);
    }
    for (const c of chips) {
      c.c.position.set(c.base.x + Math.sin(t * 0.3 + c.ph) * 0.25, c.base.y + Math.sin(t * 0.5 + c.ph) * 0.3, c.base.z);
      c.c.rotation.x += dt * c.sx;
      c.c.rotation.z += dt * c.sz;
    }

    // camera: slow drift + pointer parallax
    px += (tx - px) * Math.min(dt * 2, 1);
    py += (ty - py) * Math.min(dt * 2, 1);
    camera.position.set(camBase.x + px * 0.5 + Math.sin(t * 0.15) * 0.3, camBase.y - py * 0.25, camBase.z);
    camera.lookAt(look);
    renderer.render(scene, camera);
  }

  let start = performance.now(), last = start;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    render((now - start) / 1000, dt);
  }
  if (still) render(30, 0);
  else requestAnimationFrame(frame);
})();
