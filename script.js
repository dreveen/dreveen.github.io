const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- nav ----------
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".links");
const nav = document.querySelector(".site-nav");

if (toggle && links) {
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    I18N.set(toggle, open ? "Close" : "Menu");
    document.body.style.overflow = open ? "hidden" : "";
    root.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  // closes by itself on Escape, and when the window grows past the phone layout (rotation, resize)
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && links.classList.contains("open")) setMenu(false); });
  window.matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches && links.classList.contains("open")) setMenu(false); });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// ---------- 3D rose (fixed background layer, driven by scroll) ----------
let rose = null;
const roseCanvas = document.getElementById("bgRose");
const isHome = root.dataset.page === "home";
const introOn = root.classList.contains("intro-on");
if (roseCanvas && window.THREE && typeof mountRose === "function") {
  const lowPower = !fine || (navigator.hardwareConcurrency || 8) <= 4;
  rose = mountRose(roseCanvas, {
    ambient: !isHome,
    startBloomed: !isHome,
    dpr: lowPower ? 1.5 : 2,
  });
}

// ---------- scroll: nav state, rose, metal sheen, statement words ----------
let metals = Array.from(document.querySelectorAll(".metal, .statement .hi"));
const statement = document.getElementById("statement");
let words = [];
const STATEMENT_IT = 'Dove la <span class="hi">logica</span> incontra la <span class="hi">creatività</span>.';
const STATEMENT_EN = statement ? statement.innerHTML : "";
function buildStatement(html) {
  if (!statement) return;
  statement.innerHTML = html;
  const nodes = Array.from(statement.childNodes);
  statement.textContent = "";
  words = [];
  nodes.forEach((n) => {
    const hi = n.nodeType === 1 && n.classList.contains("hi");
    n.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { statement.append(part); return; }
      const s = document.createElement("span");
      s.className = "w" + (hi ? " hi" : "");
      s.textContent = part;
      statement.append(s);
      words.push(s);
    });
  });
  metals = Array.from(document.querySelectorAll(".metal, .statement .hi"));
}
buildStatement(STATEMENT_EN);
window.addEventListener("langchange", () => {
  if (!statement) return;
  buildStatement(I18N.lang === "it" ? STATEMENT_IT : STATEMENT_EN);
  onScroll();
});

let pointerX = 0.5;
let ticking = false;
function paintMetal() {
  const sy = window.scrollY || 0;
  const sx = Math.min(Math.max(pointerX * 0.7 + (sy / 2400) * 0.3, 0), 1);
  metals.forEach((el) => { if (!el.closest("[data-hot]")) el.style.setProperty("--sx", sx.toFixed(3)); });
}
function onScroll() {
  ticking = false;
  const sy = window.scrollY || 0;
  nav && nav.classList.toggle("scrolled", sy > 40);
  if (rose) rose.setScroll(sy / window.innerHeight);
  paintMetal();
  if (words.length) {
    const r = statement.getBoundingClientRect();
    const p = Math.min(Math.max((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.25), 0), 1);
    const n = reduce ? words.length : Math.ceil(p * words.length * 1.15);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  }
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

// ---------- reveal on scroll ----------
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// ---------- light that follows the cursor on glass, rows and buttons ----------
if (fine) {
  document.addEventListener("pointermove", (e) => {
    pointerX = e.clientX / window.innerWidth;
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    const el = e.target.closest && e.target.closest(".glass, .row, .contact-list li > a, .phone-item");
    if (el) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    }
  }, { passive: true });
}

// ---------- intro curtain (home, once per session) ----------
const intro = document.getElementById("intro");
if (intro && introOn) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem("dreveen-intro", "1"); } catch (e) {}
    intro.classList.add("leaving");
    root.classList.remove("intro-on");
    if (rose) rose.replay();
    setTimeout(() => intro.remove(), 1400);
  };
  document.getElementById("skip").addEventListener("click", finish);
  intro.addEventListener("click", finish);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });
  setTimeout(finish, 2600);
} else if (intro) {
  intro.remove();
}

// ---------- crescent-moon cursor that lights up the page around it (mouse only) ----------
(function () {
  if (!fine || reduce) return;

  const light = document.createElement("div");
  light.className = "moon-light idle";
  const moon = document.createElement("div");
  moon.className = "moon";
  // inside "The real me" the moon turns into a sunflower (Van Gogh's flower)
  const sun = document.body.classList.contains("me");
  if (sun) {
    // the cursor is the sunflower picture she chose: its white background is removed once, in the browser
    moon.classList.add("sunflower");
    const pic = new Image();
    pic.onload = () => {
      const c = document.createElement("canvas");
      const S = 168;
      c.width = c.height = S;
      const cx = c.getContext("2d");
      const k = Math.min(S / pic.width, S / pic.height);
      cx.drawImage(pic, (S - pic.width * k) / 2, (S - pic.height * k) / 2, pic.width * k, pic.height * k);
      const im = cx.getImageData(0, 0, S, S), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        const m = Math.min(d[i], d[i + 1], d[i + 2]);
        if (m > 205) d[i + 3] = Math.max(0, Math.round(((255 - m) / 50) * 255));
      }
      cx.putImageData(im, 0, 0);
      moon.innerHTML = '<img alt="" draggable="false" src="' + c.toDataURL("image/png") + '">';
    };
    pic.src = "sunflower.webp";
  } else {
    moon.innerHTML =
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M28 5 A16 16 0 1 0 28 35 A15 15 0 0 1 28 5 Z"/></svg>';
  }
  const offX = sun ? 21 : 9, offY = sun ? 21 : 12;
  document.body.append(light, moon);
  root.classList.add("has-moon");

  let x = -100, y = -100, lx = x, ly = y;
  moon.style.opacity = "0";

  window.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    moon.style.opacity = "1";
    light.classList.remove("idle");
  });
  document.addEventListener("pointerleave", () => {
    moon.style.opacity = "0";
    light.classList.add("idle");
  });
  document.addEventListener("pointerover", (e) => {
    const on = !!e.target.closest("a, button, [tabindex]");
    moon.classList.toggle("hover", on);
  });

  (function loop() {
    lx += (x - lx) * 0.2;
    ly += (y - ly) * 0.2;
    moon.style.transform = "translate(" + (x - offX) + "px," + (y - offY) + "px)";
    light.style.transform = "translate(" + lx + "px," + ly + "px)";
    requestAnimationFrame(loop);
  })();
})();

// ---------- titles: the metal sheen follows the pointer, with a slight 3D tilt ----------
(function () {
  const titles = Array.from(document.querySelectorAll(".display, .hero h1.name, .section-title, .game-card h3, .codecard"));
  if (!titles.length) return;
  const tiltOk = fine && !reduce;
  let px = -1, py = -1, queued = false, touchMode = false;

  titles.forEach((el) => {
    el.classList.add("tilt");
    el._metals = Array.from(el.querySelectorAll(".metal"));
    if (el.classList.contains("metal")) el._metals.push(el);
  });

  function update() {
    queued = false;
    titles.forEach((el) => {
      const r = el.getBoundingClientRect();
      const x = (px - r.left) / r.width;
      const y = (py - r.top) / r.height;
      const inside = px >= 0 && x > -0.04 && x < 1.04 && y > -0.25 && y < 1.25 && r.width > 0;
      if (inside) {
        el.dataset.hot = "1";
        el._metals.forEach((m) => m.style.setProperty("--sx", Math.min(Math.max(x, 0), 1).toFixed(3)));
        if (tiltOk && !touchMode) {
          el.classList.add("live");
          el.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
          el.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
        }
      } else if (el.dataset.hot) {
        delete el.dataset.hot;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }
    });
  }
  function point(x, y, touch) {
    px = x; py = y; touchMode = touch;
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  document.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") point(e.clientX, e.clientY, false); }, { passive: true });
  document.addEventListener("pointerleave", () => point(-1, -1, false));
  // touch: following the finger (also while scrolling) lights the titles up
  const t = (e) => { const f = e.touches[0]; if (f) point(f.clientX, f.clientY, true); };
  document.addEventListener("touchstart", t, { passive: true });
  document.addEventListener("touchmove", t, { passive: true });
  document.addEventListener("touchend", () => setTimeout(() => point(-1, -1, true), 500), { passive: true });
})();

// ---------- home: a motivational line that changes at random ----------
(function () {
  const el = document.getElementById("quote");
  if (!el) return;
  const LINES = [
    "Make it work, then make it beautiful.",
    "Small steps, every single day.",
    "Curiosity compiles everything.",
    "Debug your doubts.",
    "Elegant code, fearless mind.",
    "Dream in logic, build in colour.",
    "Every expert once wrote hello world.",
    "Progress is a loop with no exit condition.",
    "Fail fast, learn faster.",
    "Bloom where you compile.",
    "Stay curious, stay unstoppable.",
    "Compile courage, run confidence.",
  ];
  let i = Math.floor(Math.random() * LINES.length);
  el.textContent = I18N.t(LINES[i]);
  window.addEventListener("langchange", () => { el.textContent = I18N.t(LINES[i]); });
  el.classList.add("show");
  if (reduce) return;
  setInterval(() => {
    if (document.hidden) return;
    el.classList.remove("show");
    setTimeout(() => {
      let n;
      do { n = Math.floor(Math.random() * LINES.length); } while (n === i);
      i = n;
      el.textContent = I18N.t(LINES[i]);
      el.classList.add("show");
    }, 1000);
  }, 9000);
})();


// ---------- whoever opens the code gets a quiet message that stays while the inspector is open ----------
(function () {
  if (!fine) return; // phones and tablets have no inspector
  let el = null, timer = 0, held = false, shownAt = 0;
  const MIN = 20000; // it stays at least this long, whatever happens
  function hide() {
    if (!el) return;
    clearTimeout(timer);
    const e = el; el = null;
    e.classList.remove("on");
    setTimeout(() => e.remove(), 600);
  }
  // keepFor: milliseconds before it goes away by itself (0 = stays as long as the inspector is detected)
  function show(keepFor) {
    clearTimeout(timer);
    if (!el) {
      el = document.createElement("div");
      el.className = "peek-code";
      el.setAttribute("role", "status");
      el.innerHTML = '<p class="pc-t"></p><span class="pc-l" aria-hidden="true"></span>';
      document.body.appendChild(el);
      void el.offsetWidth;
      el.classList.add("on");
      shownAt = Date.now();
    }
    el.querySelector(".pc-t").textContent = I18N.pick("Your curiosity fascinates me.", "La tua curiosità mi affascina.");
    if (keepFor) timer = setTimeout(() => { if (!held) hide(); }, keepFor);
  }
  window.addEventListener("langchange", () => { if (el) el.querySelector(".pc-t").textContent = I18N.pick("Your curiosity fascinates me.", "La tua curiosità mi affascina."); });

  // detection while the inspector is open: it reads the properties of whatever is printed to its console
  const probe = new Image();
  let hit = false;
  Object.defineProperty(probe, "id", { get() { hit = true; return ""; } });
  function poll() {
    hit = false;
    console.log("%c", "font-size:0", probe);
    setTimeout(() => {
      if (hit && !held) { held = true; show(0); }
      else if (!hit && held) { held = false; const left = MIN - (Date.now() - shownAt); if (left > 0) timer = setTimeout(() => { if (!held) hide(); }, left); else hide(); }
    }, 60);
  }
  setInterval(poll, 1200);

  // keys that open the inspector or the source: show it for a few seconds even when it cannot be detected (new tab, detached window)
  window.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    const opens = k === "f12" || (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) || (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "u" || k === "c")) || (mod && !e.shiftKey && k === "u");
    if (opens) show(20000);
    else if (k === "escape" && !held && Date.now() - shownAt >= MIN) hide();
  }, true);
  document.addEventListener("click", (e) => { if (el && !held && Date.now() - shownAt >= MIN && e.target.closest(".peek-code")) hide(); });
})();
