const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- nav ----------
const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".links");
const nav = document.querySelector(".site-nav");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
  });
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
const metals = Array.from(document.querySelectorAll(".metal, .statement .hi"));
const statement = document.getElementById("statement");
let words = [];
if (statement) {
  const nodes = Array.from(statement.childNodes);
  statement.textContent = "";
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
}

let pointerX = 0.5;
let ticking = false;
function paintMetal() {
  const sy = window.scrollY || 0;
  const sx = Math.min(Math.max(pointerX * 0.7 + (sy / 2400) * 0.3, 0), 1);
  metals.forEach((el) => el.style.setProperty("--sx", sx.toFixed(3)));
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
  moon.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M28 5 A16 16 0 1 0 28 35 A15 15 0 0 1 28 5 Z"/></svg>';
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
    moon.style.transform = "translate(" + (x - 9) + "px," + (y - 12) + "px)";
    light.style.transform = "translate(" + lx + "px," + ly + "px)";
    requestAnimationFrame(loop);
  })();
})();
