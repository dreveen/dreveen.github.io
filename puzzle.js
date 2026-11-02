// Van Gogh Puzzle - piece by piece. Drag (or tap) two tiles to swap them until the painting is whole.
(function () {
  const root = document.getElementById("puzzle");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const boardEl = $("pzBoard"), wrap = $("pzWrap"), timeEl = $("pzTime"), movesEl = $("pzMoves"), bestEl = $("pzBest");
  const prevImg = $("pzPreviewImg"), winEl = $("pzWin"), topEl = $("pzTop"), topTitle = $("pzTopTitle");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pick = (en, it) => (window.I18N ? I18N.pick(en, it) : en);

  const PAINTINGS = [
    { src: "starry-night.jpg", en: "The Starry Night", it: "Notte stellata", year: 1889 },
    { src: "puzzle/sunflowers.jpg", en: "Sunflowers", it: "I girasoli", year: 1888 },
    { src: "puzzle/cafe.jpg", en: "Café Terrace at Night", it: "Terrazza del caffè di notte", year: 1888 },
    { src: "puzzle/irises.jpg", en: "Irises", it: "Gli iris", year: 1889 },
    { src: "puzzle/almond.jpg", en: "Almond Blossom", it: "Mandorlo in fiore", year: 1890 },
    { src: "puzzle/bedroom.jpg", en: "The Bedroom", it: "La camera da letto", year: 1888 },
  ];
  const LEVELS = [{ n: 3, en: "Easy", it: "Facile" }, { n: 5, en: "Medium", it: "Media" }, { n: 7, en: "Hard", it: "Difficile" }];

  const FACTS = window.VG_FACTS; // 26 curiosities, see facts.js

  const S = { paint: 0, level: 0, slots: [], n: 3, moves: 0, started: false, done: false, elapsed: 0, t0: 0, running: false, ratio: 1.26, tw: 0, th: 0, pieces: [], selected: -1, ready: false };
  const SKEY = "dreveen-puzzle-scores";
  let scores = [];
  try { scores = JSON.parse(localStorage.getItem(SKEY)) || []; } catch (e) { scores = []; }
  const saveScores = () => { try { localStorage.setItem(SKEY, JSON.stringify(scores)); } catch (e) {} };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  // ---------- timer ----------
  let tick = null;
  function now() { return S.elapsed + (S.running ? performance.now() - S.t0 : 0); }
  function startTimer() { if (S.running || S.done) return; S.running = true; S.t0 = performance.now(); tick = setInterval(() => { timeEl.textContent = fmt(now()); }, 250); }
  function pauseTimer() { if (!S.running) return; S.elapsed += performance.now() - S.t0; S.running = false; clearInterval(tick); }
  document.addEventListener("gamehide", pauseTimer);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseTimer(); });

  // ---------- geometry ----------
  function size() {
    const maxW = Math.max(220, wrap.clientWidth || 320);
    const maxH = Math.max(280, window.innerHeight * 0.72);
    const w = Math.min(maxW, maxH * S.ratio);
    return { w: Math.floor(w), h: Math.floor(w / S.ratio) };
  }
  function layout(animate) {
    if (!S.ready) return;
    const { w, h } = size(), n = S.n;
    boardEl.style.width = w + "px"; boardEl.style.height = h + "px";
    S.tw = w / n; S.th = h / n;
    const src = PAINTINGS[S.paint].src;
    S.pieces.forEach((el, id) => {
      const col = id % n, row = Math.floor(id / n);
      el.style.width = S.tw + "px"; el.style.height = S.th + "px";
      el.style.backgroundImage = 'url("' + src + '")';
      el.style.backgroundSize = w + "px " + h + "px";
      el.style.backgroundPosition = -col * S.tw + "px " + -row * S.th + "px";
      if (!animate) el.style.transition = "none";
      place(el, S.slots.indexOf(id));
      el.classList.toggle("ok", !S.done && S.slots.indexOf(id) === id);
      if (!animate) { void el.offsetWidth; el.style.transition = ""; }
    });
    prevImg.style.width = w + "px"; prevImg.style.height = h + "px";
  }
  function place(el, slot) {
    const n = S.n;
    el.style.transform = "translate(" + (slot % n) * S.tw + "px," + Math.floor(slot / n) * S.th + "px)";
  }

  // ---------- building a game ----------
  function build() {
    const n = LEVELS[S.level].n;
    S.n = n; S.moves = 0; S.started = false; S.done = false; S.elapsed = 0; S.running = false; S.selected = -1;
    clearInterval(tick);
    timeEl.textContent = "0:00"; movesEl.textContent = "0";
    winEl.hidden = true; boardEl.classList.remove("solved");
    boardEl.innerHTML = ""; S.pieces = [];
    for (let id = 0; id < n * n; id++) {
      const el = document.createElement("div");
      el.className = "pz-piece"; el.dataset.id = id; el.setAttribute("role", "button"); el.tabIndex = -1;
      boardEl.appendChild(el); S.pieces.push(el);
    }
    // shuffle (never already solved)
    S.slots = Array.from({ length: n * n }, (_, i) => i);
    do { for (let i = S.slots.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [S.slots[i], S.slots[j]] = [S.slots[j], S.slots[i]]; } }
    while (S.slots.every((v, i) => v === i));
    layout(false);
    renderBest();
  }
  function load(index) {
    S.paint = index; S.ready = false;
    const im = new Image();
    im.onload = () => { S.ratio = im.naturalWidth / im.naturalHeight; prevImg.src = PAINTINGS[index].src; S.ready = true; build(); };
    im.src = PAINTINGS[index].src;
    document.querySelectorAll("#pzPaintings button").forEach((b, i) => { b.classList.toggle("on", i === index); b.setAttribute("aria-pressed", i === index); });
  }

  // ---------- moves: drag a tile onto another one, or tap two tiles ----------
  function swap(a, b) {
    const t = S.slots[a]; S.slots[a] = S.slots[b]; S.slots[b] = t;
    S.moves++; movesEl.textContent = S.moves;
    startTimer(); S.started = true;
    layout(true);
    if (S.slots.every((v, i) => v === i)) solved();
  }
  let drag = null;
  boardEl.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".pz-piece");
    if (!el || S.done) return;
    e.preventDefault();
    const id = Number(el.dataset.id), slot = S.slots.indexOf(id), r = boardEl.getBoundingClientRect();
    drag = { el: el, id: id, slot: slot, x0: e.clientX, y0: e.clientY, moved: false, bx: (slot % S.n) * S.tw, by: Math.floor(slot / S.n) * S.th, r: r };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });
  boardEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; drag.el.classList.add("dragging"); }
    if (drag.moved) drag.el.style.transform = "translate(" + (drag.bx + dx) + "px," + (drag.by + dy) + "px) scale(1.04)";
  });
  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    d.el.classList.remove("dragging");
    if (!d.moved) {
      // a tap: pick the tile, then tap another to swap
      if (S.selected < 0) { S.selected = d.slot; d.el.classList.add("sel"); }
      else if (S.selected === d.slot) { S.selected = -1; d.el.classList.remove("sel"); }
      else { const from = S.selected; S.selected = -1; S.pieces.forEach((p) => p.classList.remove("sel")); swap(from, d.slot); }
      return;
    }
    S.selected = -1; S.pieces.forEach((p) => p.classList.remove("sel"));
    const cx = e.clientX - d.r.left, cy = e.clientY - d.r.top;
    const col = Math.min(S.n - 1, Math.max(0, Math.floor(cx / S.tw))), row = Math.min(S.n - 1, Math.max(0, Math.floor(cy / S.th)));
    const to = row * S.n + col;
    if (cx < 0 || cy < 0 || cx > d.r.width || cy > d.r.height || to === d.slot) { layout(true); return; }
    swap(d.slot, to);
  }
  boardEl.addEventListener("pointerup", endDrag);
  boardEl.addEventListener("pointercancel", () => { if (drag) { drag.el.classList.remove("dragging"); drag = null; layout(true); } });

  // ---------- the painting is whole ----------
  function solved() {
    S.done = true; pauseTimer();
    const t = Math.round(S.elapsed);
    timeEl.textContent = fmt(t);
    boardEl.classList.add("solved");
    S.pieces.forEach((p) => p.classList.remove("ok", "sel"));
    const prev = bestFor(S.paint, S.level), record = !prev || t < prev.t;
    scores.push({ p: S.paint, l: S.level, t: t, m: S.moves, d: Date.now() });
    scores.sort((a, b) => a.t - b.t);
    scores = scores.slice(0, 60);
    saveScores();
    winEl.hidden = false;
    renderWin(record);
    renderBest();
    if (browse) setBrowse(false);
    showFact(factForPainting()); autoFacts();
    if (!reduce) winEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function renderWin(record) {
    const p = PAINTINGS[S.paint];
    winEl.innerHTML = "";
    const h = document.createElement("p"); h.className = "pz-win-t"; h.textContent = pick("The painting is whole!", "Il quadro è completo!");
    const s = document.createElement("p"); s.className = "pz-win-s";
    s.textContent = pick(p.en, p.it) + " · " + p.year + "  —  " + fmt(S.elapsed) + "  ·  " + S.moves + " " + pick("moves", "mosse") + (record ? "  ·  " + pick("new best time!", "nuovo record!") : "");
    winEl.append(h, s);
    winEl.dataset.rec = record ? "1" : "";
  }

  // ---------- best times (kept in this browser) ----------
  function bestFor(p, l) { return scores.filter((s) => s.p === p && s.l === l).sort((a, b) => a.t - b.t)[0]; }
  function renderBest() {
    const b = bestFor(S.paint, S.level);
    bestEl.textContent = b ? fmt(b.t) : "-";
    const list = scores.filter((s) => s.p === S.paint && s.l === S.level).sort((a, b) => a.t - b.t).slice(0, 5);
    const p = PAINTINGS[S.paint];
    topTitle.textContent = pick("Best times", "Migliori tempi") + " · " + pick(p.en, p.it) + " · " + pick(LEVELS[S.level].en, LEVELS[S.level].it);
    topEl.innerHTML = "";
    if (!list.length) { const li = document.createElement("li"); li.className = "none"; li.textContent = pick("No times yet. Be the first!", "Ancora nessun tempo. Sii la prima!"); topEl.appendChild(li); return; }
    list.forEach((s) => {
      const li = document.createElement("li");
      const t = document.createElement("b"); t.textContent = fmt(s.t);
      const m = document.createElement("span"); m.textContent = s.m + " " + pick("moves", "mosse");
      li.append(t, m); topEl.appendChild(li);
    });
  }

  // ---------- facts about Van Gogh: always visible at the bottom ----------
  let fi = (Math.random() * FACTS.length) | 0, factTimer = null;
  // random, never the same one twice in a row
  const nextFact = () => { let j; do { j = (Math.random() * FACTS.length) | 0; } while (FACTS.length > 1 && j === fi); return (fi = j); };
  // finishing a painting opens the story of that very painting
  const factForPainting = () => { const i = FACTS.findIndex((f) => f.p === S.paint); return i >= 0 ? i : nextFact(); };
  let browse = false;
  function setBrowse(on) {
    browse = on;
    if (on) showFact(0); // always start from the first one
    $("pzFactNav").hidden = !on;
    $("pzFactMore").textContent = on ? pick("Close", "Chiudi") : pick("See more curiosities", "Vedi altre curiosità");
    $("pzFact").classList.toggle("browsing", on);
    if (on) clearTimeout(factTimer); else autoFacts();
  }
  function showFact(i) {
    fi = i;
    const f = FACTS[i], box = $("pzFact");
    $("pzFactNum").textContent = i + 1 + " / " + FACTS.length;
    $("pzFactTitle").textContent = pick(f.te, f.ti);
    $("pzFactText").textContent = pick(f.en, f.it);
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
  }
  // a new random curiosity every 60 to 75 seconds, so each one stays long enough to be read
  function autoFacts() {
    clearTimeout(factTimer);
    factTimer = setTimeout(function again() {
      if (browse) return;
      if (!root.hidden && !document.hidden) { showFact(nextFact()); autoFacts(); } else factTimer = setTimeout(again, 5000);
    }, 60000 + Math.random() * 15000);
  }
  $("pzFactNext").addEventListener("click", () => showFact((fi + 1) % FACTS.length));
  $("pzFactPrev").addEventListener("click", () => showFact((fi + FACTS.length - 1) % FACTS.length));
  $("pzFactMore").addEventListener("click", () => setBrowse(!browse));

  // ---------- controls ----------
  function setup() {
    const box = $("pzPaintings");
    PAINTINGS.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.style.backgroundImage = 'url("' + p.src + '")';
      b.setAttribute("aria-label", p.en); b.title = p.en;
      b.addEventListener("click", () => { if (i !== S.paint) { pauseTimer(); load(i); } });
      box.appendChild(b);
    });
    document.querySelectorAll("#pzLevels button").forEach((b, i) => b.addEventListener("click", () => {
      S.level = i; document.querySelectorAll("#pzLevels button").forEach((x, j) => x.classList.toggle("on", j === i));
      pauseTimer(); build();
    }));
    $("pzNew").addEventListener("click", () => { pauseTimer(); build(); });
    $("pzPreview").addEventListener("click", () => {
      const on = wrap.classList.toggle("peek");
      $("pzPreview").textContent = on ? pick("Hide original", "Nascondi originale") : pick("Show original", "Mostra originale");
      $("pzPreview").setAttribute("aria-pressed", on);
    });
    load(0);
    showFact(fi); setBrowse(false);
  }

  let inited = false;
  function init() { if (inited) return; inited = true; setup(); }
  function relabel() {
    if (inited) $("pzFactMore").textContent = browse ? pick("Close", "Chiudi") : pick("See more curiosities", "Vedi altre curiosità");
    $("pzPreview").textContent = wrap.classList.contains("peek") ? pick("Hide original", "Nascondi originale") : pick("Show original", "Mostra originale");
    if (!inited) return;
    renderBest(); showFact(fi);
    if (S.done) renderWin(winEl.dataset.rec === "1");
    PAINTINGS.forEach((p, i) => { const b = $("pzPaintings").children[i]; if (b) { b.title = pick(p.en, p.it); } });
  }
  window.addEventListener("langchange", () => setTimeout(relabel, 0));
  window.addEventListener("resize", () => { if (root.hidden) return; init(); layout(false); });
  document.addEventListener("gamehide", () => {});
  if (!root.hidden) init();
  relabel();
})();
