// Metallic bordeaux rose on a golden-angle spiral, ringed by gold orbits (needs three.js r128).
// mountRose(canvas, { ambient, startBloomed, dpr }) -> { dispose, setScroll, replay }
function mountRose(canvas, opts) {
  opts = opts || {};
  if (!window.THREE) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.dpr || 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // procedural studio: dark wine room, champagne softboxes, a crimson glow (used for reflections)
  function makeEnv() {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, "#3a0f1c");
    bg.addColorStop(0.5, "#14070b");
    bg.addColorStop(1, "#070304");
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 512);
    function glow(x, y, rx, ry, col, a) {
      g.save();
      g.translate(x, y);
      g.scale(rx, ry);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      r.addColorStop(0, col);
      r.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = a;
      g.fillStyle = r;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    glow(780, 230, 260, 130, "#a3142f", 0.9);
    glow(300, 300, 300, 120, "#c9a87a", 0.45);
    function box(x, y, w, h, col, a) {
      g.globalAlpha = a;
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    }
    box(150, 110, 190, 90, "#fff1d6", 0.95);
    box(580, 70, 130, 110, "#f1deb8", 0.9);
    box(850, 40, 26, 230, "#ffffff", 0.9);
    box(420, 190, 50, 150, "#c9a87a", 0.7);
    box(0, 0, 1024, 26, "#f1deb8", 0.55);
    g.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromEquirectangular(tex);
    tex.dispose();
    pm.dispose();
    return rt.texture;
  }

  const scene = new THREE.Scene();
  scene.environment = makeEnv();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  scene.add(new THREE.AmbientLight(0x6a3344, 0.5));
  const key = new THREE.DirectionalLight(0xffe6d5, 0.8);
  key.position.set(2.5, 5, 3);
  scene.add(key);
  const rim = new THREE.PointLight(0xc01535, 1.1, 14);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);
  const rose = new THREE.Group();
  root.add(rose);

  const PETALS = 40;
  const GOLDEN = 2.39996;
  const inner = new THREE.Color(0xc4203f);
  const outer = new THREE.Color(0x8c1329);
  const gold = new THREE.Color(0xe0c48f);
  const petals = [];

  for (let i = 0; i < PETALS; i++) {
    const t = i / (PETALS - 1);
    const span = 1.5 + 0.55 * t;
    const th = 1.45;
    const geo = new THREE.SphereGeometry(1, 28, 18, Math.PI / 2 - span / 2, span, Math.PI / 2 - th / 2, th);
    geo.translate(0, Math.sin(th / 2), -1);
    geo.scale(0.4 + 0.55 * t, 0.62 + 0.42 * t, 0.85);

    const base = inner.clone().lerp(outer, Math.pow(t, 0.8));
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const hMax = (0.62 + 0.42 * t) * 2 * Math.sin(th / 2);
    let xMax = 0;
    for (let v = 0; v < pos.count; v++) xMax = Math.max(xMax, Math.abs(pos.getX(v)));
    const c = new THREE.Color();
    for (let v = 0; v < pos.count; v++) {
      const yn = Math.min(pos.getY(v) / hMax, 1);
      const u = pos.getX(v) / xMax;
      // arch the top edge and roll the lip outward, like a real petal
      pos.setY(v, pos.getY(v) * (1 - 0.42 * u * u * yn));
      pos.setZ(v, pos.getZ(v) + 0.22 * yn * yn * (0.4 + t));
      const k = 0.65 + 0.5 * yn;
      c.setRGB(Math.min(base.r * k, 1), Math.min(base.g * k, 1), Math.min(base.b * k, 1));
      // champagne-gold lip along the top edge of each petal
      const rimMix = Math.min(Math.max((yn - 0.9) / 0.1, 0), 1);
      c.lerp(gold, rimMix * rimMix * 0.9);
      colors[v * 3] = c.r;
      colors[v * 3 + 1] = c.g;
      colors[v * 3 + 2] = c.b;
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      metalness: 0.62,
      roughness: 0.3 + 0.18 * t,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.15,
    });

    const pivot = new THREE.Group();
    pivot.rotation.order = "YXZ";
    const a = i * GOLDEN;
    const r = 0.02 + 0.82 * Math.pow(t, 0.9);
    pivot.position.set(Math.sin(a) * r, 0.32 * (1 - t), Math.cos(a) * r);
    pivot.rotation.y = a;
    pivot.add(new THREE.Mesh(geo, mat));
    rose.add(pivot);

    petals.push({ pivot: pivot, tilt: -0.04 + 0.62 * Math.pow(t, 1.35), delay: t * 1.6 });
  }

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0.04, -0.9, 0.03),
    new THREE.Vector3(-0.07, -2.0, -0.04),
    new THREE.Vector3(0.05, -3.3, 0.03),
    new THREE.Vector3(0, -6.5, 0),
  ]);
  rose.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, 80, 0.055, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x214d34, roughness: 0.42, metalness: 0.35, envMapIntensity: 0.9 })
    )
  );
  // leaves along the stem
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.25, 0.26, 0.75, 0.3, 1.0, 0);
  leafShape.bezierCurveTo(0.75, -0.3, 0.25, -0.26, 0, 0);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d5a36, roughness: 0.5, metalness: 0.12, side: THREE.DoubleSide, envMapIntensity: 0.9 });
  [
    { y: -1.3, a: 0.5, s: 1.0 },
    { y: -2.15, a: Math.PI + 0.35, s: 1.15 },
    { y: -3.0, a: -0.6, s: 1.25 },
    { y: -3.9, a: Math.PI - 0.5, s: 1.3 },
  ].forEach(function (d) {
    const g = new THREE.ShapeGeometry(leafShape, 14);
    g.rotateX(-Math.PI / 2);
    const lp = g.attributes.position;
    for (let v = 0; v < lp.count; v++) {
      const x = lp.getX(v), z = lp.getZ(v);
      lp.setY(v, 0.18 * Math.abs(z) - 0.22 * x * x);
    }
    g.computeVertexNormals();
    const leaf = new THREE.Group();
    leaf.position.set(0, d.y, 0);
    leaf.rotation.y = d.a;
    leaf.rotation.z = 0.55;
    leaf.scale.setScalar(d.s);
    leaf.add(new THREE.Mesh(g, leafMat));
    rose.add(leaf);
  });
  rose.position.y = -0.35;

  // gold orbits: thin polished rings, each carrying a small bead
  const orbit = new THREE.Group();
  orbit.position.y = -0.2;
  root.add(orbit);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a87a, metalness: 1, roughness: 0.2, envMapIntensity: 1.4 });
  const rings = [
    { r: 1.95, tube: 0.007, rx: 1.15, rz: 0.2, speed: 0.22 },
    { r: 2.35, tube: 0.005, rx: 0.45, rz: 0.9, speed: -0.16 },
    { r: 2.8, tube: 0.004, rx: 1.35, rz: -0.5, speed: 0.1 },
  ].map(function (d) {
    const pivot = new THREE.Group();
    pivot.rotation.x = d.rx;
    pivot.rotation.z = d.rz;
    const spin = new THREE.Group();
    pivot.add(spin);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 8, 160), goldMat);
    ring.rotation.x = Math.PI / 2;
    spin.add(ring);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), goldMat);
    bead.position.set(d.r, 0, 0);
    spin.add(bead);
    orbit.add(pivot);
    return { spin: spin, speed: d.speed };
  });

  const ambient = !!opts.ambient;
  let baseX = 0;
  let baseScale = 1;

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    // head ~55% of the viewport height on desktop, ~58% of the width on tall phones
    let dist = Math.max(8.4, 7.8 / camera.aspect);
    if (ambient) dist *= 1.18;
    const visH = 2 * dist * tanH * 0.88;
    const headScreenY = camera.aspect > 1 ? 0.42 : 0.3;
    camera.position.set(0, dist * 0.52, dist * 0.85);
    camera.lookAt(0, -0.2 - (0.5 - headScreenY) * visH, 0);
    camera.updateProjectionMatrix();
    const visW = visH * camera.aspect;
    baseX = camera.aspect > 1.15 ? visW * (ambient ? 0.3 : 0.2) : 0;
    baseScale = ambient ? 0.9 : 1;
  }
  resize();
  window.addEventListener("resize", resize);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let start = performance.now();
  let last = start;
  let alive = true;
  let scrollT = 0;
  let scrollS = 0;
  let px = 0, py = 0, tx = 0, ty = 0;

  function onPointer(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener("pointermove", onPointer, { passive: true });
  // touch: pointer events stop once the browser takes over for scrolling, so follow the finger
  // with passive touch listeners (they never block the scroll)
  function onTouch(e) {
    const t = e.touches[0];
    if (!t) return;
    tx = (t.clientX / window.innerWidth - 0.5) * 2;
    ty = (t.clientY / window.innerHeight - 0.5) * 2;
  }
  function onTouchEnd() { tx = 0; ty = 0; }
  window.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });

  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const elapsed = (now - start) / 1000;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    scrollS += (scrollT - scrollS) * Math.min(dt * 5, 1);
    px += (tx - px) * Math.min(dt * 3, 1);
    py += (ty - py) * Math.min(dt * 3, 1);
    const sp = Math.min(scrollS, 1.6);
    const open = ambient ? 0 : Math.min(sp, 1);

    for (const p of petals) {
      let k = opts.startBloomed || still ? 1 : Math.min(Math.max((elapsed - p.delay) / 1.5, 0), 1);
      k = 1 - Math.pow(1 - k, 3);
      p.pivot.scale.setScalar(0.001 + 0.999 * k);
      p.pivot.rotation.x = p.tilt * k * (1 + 0.28 * open);
    }

    if (!still) {
      rose.rotation.y += dt * 0.28;
      rose.position.y = -0.35 + Math.sin(elapsed * 0.8) * 0.03;
      for (const r of rings) r.spin.rotation.y += dt * r.speed;
    }
    // scroll: the whole composition drifts, turns and recedes
    rose.rotation.y += (sp * 1.2 - (rose.userData.sp || 0) * 1.2);
    rose.userData.sp = sp;
    root.position.x = baseX * (1 - 1.7 * Math.min(sp, 1));
    root.position.y = sp * (ambient ? 0.5 : 1.0);
    root.scale.setScalar(baseScale * (1 - 0.22 * Math.min(sp, 1.2)));
    root.rotation.x = py * 0.1;
    root.rotation.z = -px * 0.06;
    orbit.rotation.y = px * 0.35;
    orbit.rotation.x = py * 0.2;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    setScroll: function (p) { scrollT = p; },
    replay: function () { start = performance.now(); },
    dispose: function () {
      alive = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      renderer.dispose();
    },
  };
}
