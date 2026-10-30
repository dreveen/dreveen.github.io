// Habit tracker: a row of squares per habit (last 14 days), streaks and a consistency chart.
(function () {
  const list = document.getElementById("hbList");
  if (!list) return;
  const KEY = "dreveen-habits";
  const DAYS = 14;
  const $ = (id) => document.getElementById(id);
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { habits = []; }
  let focus = null; // null = chart closed, "all" = every habit, or one habit object
  let newColor = 0;
  METAL.picker($("hbPal"), 0, (i) => { newColor = i; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(habits)); } catch (e) {} }

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const locale = () => (I18N.lang === "it" ? "it-IT" : "en-GB");
  function lastDays(n) {
    const out = [], t = new Date();
    for (let i = n - 1; i >= 0; i--) out.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() - i));
    return out;
  }
  function streak(h) {
    let s = 0;
    const d = new Date();
    if (!h.days[keyOf(d)]) d.setDate(d.getDate() - 1); // today may still be open
    while (h.days[keyOf(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }

  function render() {
    const days = lastDays(DAYS);
    list.innerHTML = "";
    habits.forEach((h) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "hb-name"; name.textContent = h.name;
      const st = document.createElement("small");
      st.className = "hb-streak"; st.textContent = streak(h) + " " + I18N.pick("day streak", "giorni di fila");
      const sq = document.createElement("div");
      sq.className = "hb-sq";
      sq.style.setProperty("--hc", METAL.mid(h.c));
      sq.style.setProperty("--hg", METAL.grad(h.c));
      let run = 0;
      days.forEach((d) => {
        const k = keyOf(d), b = document.createElement("button");
        run = h.days[k] ? run + 1 : 0;
        b.type = "button"; b.className = h.days[k] ? "on" + (run >= 3 ? " hot" : "") : "";
        b.title = d.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" });
        b.setAttribute("aria-label", b.title); b.setAttribute("aria-pressed", !!h.days[k]);
        b.addEventListener("click", () => { if (h.days[k]) delete h.days[k]; else h.days[k] = 1; save(); render(); });
        sq.appendChild(b);
      });
      const del = document.createElement("button");
      del.type = "button"; del.className = "del"; del.innerHTML = "&times;";
      del.setAttribute("aria-label", I18N.pick("Delete", "Elimina"));
      del.addEventListener("click", () => { habits = habits.filter((x) => x !== h); save(); render(); });
      const head = document.createElement("div");
      const dot = document.createElement("button");
      dot.type = "button"; dot.className = "hb-dot"; dot.style.background = METAL.grad(h.c);
      dot.title = I18N.pick("Change colour", "Cambia colore"); dot.setAttribute("aria-label", dot.title);
      name.classList.toggle("on", focus === h);
      name.title = I18N.pick("Tap to see the chart", "Tocca per vedere il grafico");
      name.addEventListener("click", () => { focus = focus === h ? null : h; render(); if (focus) $("hbChart").scrollIntoView({ behavior: "smooth", block: "nearest" }); });
      dot.addEventListener("click", (e) => { e.stopPropagation(); h.c = ((h.c || 0) + 1) % METAL.list.length; save(); render(); });
      name.prepend(dot);
      head.className = "hb-meta"; head.append(name, st);
      li.append(head, sq, del);
      list.appendChild(li);
    });
    $("hbEmpty").hidden = habits.length > 0;
    if (focus && focus !== "all" && habits.indexOf(focus) < 0) focus = null;
    $("hbChart").hidden = !focus || habits.length === 0;
    $("hbOpen").hidden = habits.length === 0;
    $("hbOpen").setAttribute("aria-expanded", !!focus);
    $("hbOpen").textContent = focus ? I18N.pick("Hide the chart", "Nascondi il grafico") : I18N.pick("See how consistent I am", "Vedi quanto sono costante");
    $("hbText").placeholder = I18N.pick("New habit (e.g. Study 1 hour)", "Nuova abitudine (es. Studiare 1 ora)");
    chart(days);
  }

  function chart(days) {
    if (!focus) return;
    const set = focus === "all" ? habits : [focus];
    const n = set.length || 1;
    const c = focus === "all" ? { hi: "#f1deb8", mid: "#d23a58", lo: "#a3142f" } : METAL.list[(focus.c || 0) % METAL.list.length];
    $("hbWho").textContent = focus === "all" ? I18N.pick("All habits", "Tutte le abitudini") : focus.name;
    const vals = days.map((d) => set.filter((h) => h.days[keyOf(d)]).length / n);
    const avg = vals.reduce((a, b) => a + b, 0) / DAYS;
    const pct = Math.round(avg * 100);
    const total = set.reduce((a, h) => a + days.filter((d) => h.days[keyOf(d)]).length, 0);
    const best = set.reduce((a, h) => Math.max(a, streak(h)), 0);

    // ring with the consistency percentage
    const R = 50, C = 2 * Math.PI * R;
    $("hbPct").textContent = pct + "%";
    $("hbRing").innerHTML =
      '<defs><linearGradient id="hbr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.hi + '"/><stop offset="1" stop-color="' + c.mid + '"/></linearGradient></defs>' +
      '<circle cx="60" cy="60" r="' + R + '" class="rt"/>' +
      '<circle cx="60" cy="60" r="' + R + '" class="rv" style="--d:' + (C * avg).toFixed(1) + ';--c:' + C.toFixed(1) + '" transform="rotate(-90 60 60)"/>';

    // motivating line, depending on how the last 14 days went
    const tiers = [
      [0, "Every rose begins as a bud. Start today.", "Ogni rosa inizia da un bocciolo. Parti da oggi."],
      [30, "A small start beats a big postponement.", "Un piccolo inizio vale più di un grande rinvio."],
      [60, "You are finding your rhythm. Keep going.", "Stai trovando il tuo ritmo. Continua così."],
      [85, "Such consistency! You are on the right path.", "Che costanza! Sei sulla strada giusta."],
      [101, "Unstoppable. Your rose is in full bloom.", "Inarrestabile. La tua rosa è in piena fioritura."],
    ];
    const tier = pct === 0 ? tiers[0] : tiers.find((t, i) => i > 0 && pct < t[0]) || tiers[4];
    $("hbMsg").textContent = I18N.pick(tier[1], tier[2]);
    $("hbStats").textContent = total + " " + I18N.pick("check-ins", "spunte") + "  ·  " + I18N.pick("best streak", "serie migliore") + " " + best + " " + I18N.pick("days", "giorni");
    const goal = [3, 7, 14, 30, 60, 100].find((g) => g > best) || best + 10;
    $("hbGoalTxt").textContent = I18N.pick((goal - best) + " more days to a " + goal + "-day streak", "Ancora " + (goal - best) + " giorni al traguardo dei " + goal + " di fila");
    $("hbGoal").style.width = Math.min(100, (best / goal) * 100) + "%";

    // smooth area chart of the last 14 days
    const W = 560, base = 138, top = 16, step = W / DAYS;
    const xs = vals.map((_, i) => step * (i + 0.5)), ys = vals.map((v) => base - v * (base - top));
    let line = "M" + xs[0].toFixed(1) + "," + ys[0].toFixed(1);
    for (let i = 1; i < vals.length; i++) {
      const mx = (xs[i - 1] + xs[i]) / 2;
      line += " C" + mx.toFixed(1) + "," + ys[i - 1].toFixed(1) + " " + mx.toFixed(1) + "," + ys[i].toFixed(1) + " " + xs[i].toFixed(1) + "," + ys[i].toFixed(1);
    }
    const area = line + " L" + xs[xs.length - 1].toFixed(1) + "," + base + " L" + xs[0].toFixed(1) + "," + base + " Z";
    let s = '<defs><linearGradient id="hbf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.mid + '" stop-opacity=".5"/><stop offset="1" stop-color="' + c.lo + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hbl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c.mid + '"/><stop offset=".5" stop-color="' + c.hi + '"/><stop offset="1" stop-color="' + c.mid + '"/></linearGradient></defs>';
    [0.5, 1].forEach((f) => { const y = base - (base - top) * f; s += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="gl"/>'; });
    s += '<path d="' + area + '" fill="url(#hbf)"/><path d="' + line + '" class="ln"/>';
    vals.forEach((v, i) => {
      const last = i === vals.length - 1;
      if (v > 0) s += '<circle cx="' + xs[i].toFixed(1) + '" cy="' + ys[i].toFixed(1) + '" r="' + (last ? 6 : 4) + '" class="dt' + (last ? " now" : "") + '"/>';
      else s += '<circle cx="' + xs[i].toFixed(1) + '" cy="' + ys[i].toFixed(1) + '" r="2.5" class="dz"/>';
      s += '<text x="' + xs[i].toFixed(1) + '" y="158" text-anchor="middle"' + (last ? ' class="today"' : "") + ">" + days[i].getDate() + "</text>";
    });
    $("hbSvg").style.setProperty("--hc", c.mid);
    $("hbSvg").innerHTML = s;
  }

  // the chart stays closed until she taps the tracker's title or the button (all habits) or one habit's name
  function toggleAll() { focus = focus ? null : "all"; render(); if (focus) $("hbChart").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  $("hbOpen").addEventListener("click", toggleAll);
  $("hbTitle").addEventListener("click", toggleAll);
  $("hbTitle").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleAll(); } });
  $("hbForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("hbText").value.trim();
    if (!v) return;
    habits.push({ name: v, days: {}, c: newColor });
    $("hbText").value = ""; save(); render();
  });
  window.addEventListener("langchange", render);
  render();
})();
