// 3D rose built from petals laid out on a golden-angle spiral (needs three.js r128)
function mountRose(canvas, opts) {
  opts = opts || {};
  if (!window.THREE) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  scene.add(new THREE.AmbientLight(0x6a3344, 1.0));
  const key = new THREE.DirectionalLight(0xffe6d5, 0.9);
  key.position.set(2.5, 5, 3);
  scene.add(key);
  const rim = new THREE.PointLight(0xc01535, 0.9, 12);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(rim);

  const rose = new THREE.Group();
  scene.add(rose);

  const PETALS = 40;
  const GOLDEN = 2.39996;
  const inner = new THREE.Color(0x9e0f2e);
  const outer = new THREE.Color(0x4f0617);
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
    for (let v = 0; v < pos.count; v++) {
      const yn = Math.min(pos.getY(v) / hMax, 1);
      const u = pos.getX(v) / xMax;
      // arch the top edge and roll the lip outward, like a real petal
      pos.setY(v, pos.getY(v) * (1 - 0.42 * u * u * yn));
      pos.setZ(v, pos.getZ(v) + 0.22 * yn * yn * (0.4 + t));
      const k = 0.65 + 0.5 * yn;
      colors[v * 3] = Math.min(base.r * k, 1);
      colors[v * 3 + 1] = Math.min(base.g * k, 1);
      colors[v * 3 + 2] = Math.min(base.b * k, 1);
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.08,
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

  rose.position.y = -0.35;

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = Math.max(opts.minDist || 6.2, 4.6 / camera.aspect);
    camera.position.set(0, dist * 0.52, dist * 0.85);
    camera.lookAt(0, opts.lookY !== undefined ? opts.lookY : 0.1, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  let last = start;
  let alive = true;

  function frame(now) {
    if (!alive) return;
    const elapsed = (now - start) / 1000;
    const dt = (now - last) / 1000;
    last = now;

    for (const p of petals) {
      let k = opts.startBloomed || still ? 1 : Math.min(Math.max((elapsed - p.delay) / 1.5, 0), 1);
      k = 1 - Math.pow(1 - k, 3);
      p.pivot.scale.setScalar(0.001 + 0.999 * k);
      p.pivot.rotation.x = p.tilt * k;
    }

    if (!still) {
      rose.rotation.y += dt * 0.3;
      rose.position.y = -0.35 + Math.sin(elapsed * 0.8) * 0.03;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    dispose: function () {
      alive = false;
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
