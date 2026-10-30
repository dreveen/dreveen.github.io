// Habit tracker: a row of squares per habit (last 14 days), streaks and a consistency chart.
(function () {
  const list = document.getElementById("hbList");
  if (!list) return;
  const KEY = "dreveen-habits";
  const DAYS = 14;
  const $ = (id) => document.getElementById(id);
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { habits = []; }
  const COLORS = ["#d23a58", "#c9a87a", "#66f0c2", "#b48cff", "#6cc4ff"];
  let newColor = 0;
  const pal = $("hbPal");
  COLORS.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.style.background = c; b.setAttribute("aria-label", c);
    if (i === 0) b.className = "on";
    b.addEventListener("click", () => { newColor = i; pal.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); });
    pal.appendChild(b);
  });
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
      sq.style.setProperty("--hc", COLORS[h.c || 0]);
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
      dot.type = "button"; dot.className = "hb-dot"; dot.style.background = COLORS[h.c || 0];
      dot.title = I18N.pick("Change colour", "Cambia colore"); dot.setAttribute("aria-label", dot.title);
      dot.addEventListener("click", () => { h.c = ((h.c || 0) + 1) % COLORS.length; save(); render(); });
      name.prepend(dot);
      head.className = "hb-meta"; head.append(name, st);
      li.append(head, sq, del);
      list.appendChild(li);
    });
    $("hbEmpty").hidden = habits.length > 0;
    $("hbChart").hidden = habits.length === 0;
    $("hbText").placeholder = I18N.pick("New habit (e.g. Study 1 hour)", "Nuova abitudine (es. Studiare 1 ora)");
    chart(days);
  }

  function chart(days) {
    const W = 560, base = 128, top = 14, step = W / DAYS, bw = step * 0.56;
    const n = habits.length || 1;
    const vals = days.map((d) => habits.filter((h) => h.days[keyOf(d)]).length / n);
    const avg = vals.reduce((a, b) => a + b, 0) / DAYS;
    $("hbPct").textContent = Math.round(avg * 100) + "%";
    let s = '<defs><linearGradient id="hbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1deb8"/><stop offset="1" stop-color="#a3142f"/></linearGradient></defs>';
    [0.5, 1].forEach((f) => { const y = base - (base - top) * f; s += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="gl"/>'; });
    const pts = [];
    vals.forEach((v, i) => {
      const h = Math.max(v * (base - top), 2), x = i * step + (step - bw) / 2;
      s += '<rect x="' + x.toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + (v ? "url(#hbg)" : "rgba(201,168,122,.15)") + '"/>';
      pts.push((x + bw / 2).toFixed(1) + "," + (base - v * (base - top)).toFixed(1));
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="146" text-anchor="middle">' + days[i].getDate() + "</text>";
    });
    s += '<polyline points="' + pts.join(" ") + '" class="ln"/>';
    $("hbSvg").innerHTML = s;
  }

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
