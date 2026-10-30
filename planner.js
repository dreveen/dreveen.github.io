// Rose planner: month calendar + tasks for the selected day, saved in localStorage.
(function () {
  const root = document.getElementById("planner");
  if (!root) return;
  const KEY = "dreveen-planner";
  const $ = (id) => document.getElementById(id);
  const grid = $("plGrid"), list = $("plList"), form = $("plForm"), text = $("plText"), time = $("plTime");

  let tasks = {};
  try { tasks = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { tasks = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} }

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const locale = () => (I18N.lang === "it" ? "it-IT" : "en-GB");
  const today = new Date();
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let sel = keyOf(today);
  let tcol = 0;
  // one colour per task; a day takes the colour of its first open task
  const taskPick = METAL.picker($("plPrio"), 0, (i) => { tcol = i; });

  function renderWeek() {
    // Monday first
    const base = new Date(2024, 0, 1);
    $("plWeek").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return "<span>" + d.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "") + "</span>";
    }).join("");
  }

  function renderCal() {
    const y = view.getFullYear(), m = view.getMonth();
    $("plMonth").textContent = view.toLocaleDateString(locale(), { month: "long", year: "numeric" });
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < lead; i++) html += "<i></i>";
    for (let d = 1; d <= days; d++) {
      const k = y + "-" + pad(m + 1) + "-" + pad(d);
      const items = tasks[k] || [];
      const open = items.filter((t) => !t.done).length;
      const ci = items.length ? (items.find((t) => !t.done) || items[0]).c || 0 : -1;
      const cls = (k === keyOf(today) ? " today" : "") + (k === sel ? " sel" : "") + (items.length ? " has" : "") + (items.length && !open ? " all" : "") + (ci >= 0 ? " col" : "");
      html += '<button type="button" class="d' + cls + '" data-k="' + k + '"' + (ci >= 0 ? ' style="--dm:' + METAL.grad(ci) + '"' : "") + ">" + d + "</button>";
    }
    grid.innerHTML = html;
  }

  function renderDay() {
    const [y, m, d] = sel.split("-").map(Number);
    $("plDate").textContent = new Date(y, m - 1, d).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
    const items = (tasks[sel] || []).slice().sort((a, b) => (a.done - b.done) || (a.time || "99").localeCompare(b.time || "99"));
    list.innerHTML = "";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.className = t.done ? "done" : "";
      li.style.setProperty("--tm", METAL.grad(t.c));
      const chk = document.createElement("button");
      chk.type = "button"; chk.className = "chk"; chk.setAttribute("aria-pressed", t.done);
      chk.setAttribute("aria-label", I18N.pick("Done", "Fatto"));
      chk.addEventListener("click", () => { t.done = !t.done; save(); renderAll(); });
      const label = document.createElement("span");
      label.className = "tx"; label.textContent = (t.time ? t.time + "  " : "") + t.text;
      const del = document.createElement("button");
      del.type = "button"; del.className = "del"; del.innerHTML = "&times;";
      del.setAttribute("aria-label", I18N.pick("Delete", "Elimina"));
      del.addEventListener("click", () => { tasks[sel] = tasks[sel].filter((x) => x !== t); if (!tasks[sel].length) delete tasks[sel]; save(); renderAll(); });
      li.append(chk, label, del);
      list.appendChild(li);
    });
    const n = items.length, done = items.filter((t) => t.done).length;
    $("plBar").style.width = (n ? (done / n) * 100 : 0) + "%";
    $("plCount").textContent = n ? done + " / " + n + " " + I18N.pick("completed", "completati") : "";
    const cheer = $("plCheer");
    cheer.hidden = !(n > 0 && done === n);
    cheer.textContent = I18N.pick("Perfect day. Your rose is in full bloom.", "Giornata perfetta. La tua rosa è sbocciata.");
    $("plEmpty").hidden = n > 0;
    $("plClear").hidden = !done;
    $("plDay").value = sel;
    text.placeholder = I18N.pick("What do you want to do?", "Cosa vuoi fare?");
  }

  function renderAgenda() {
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const open = (tasks[keyOf(t0)] || []).filter((t) => !t.done).length;
    $("plToday2").textContent = open
      ? open + " " + (open === 1 ? I18N.pick("thing to do today", "impegno per oggi") : I18N.pick("things to do today", "impegni per oggi"))
      : I18N.pick("Nothing left for today", "Oggi non hai impegni");
    const ul = $("plUp");
    ul.innerHTML = "";
    let any = false;
    for (let i = 0; i < 14; i++) {
      const d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i), k = keyOf(d);
      const items = (tasks[k] || []).filter((t) => !t.done);
      if (!items.length) continue;
      any = true;
      const li = document.createElement("li"), b = document.createElement("button"), when = document.createElement("b"), what = document.createElement("span");
      b.type = "button";
      when.textContent = i === 0 ? I18N.pick("Today", "Oggi") : i === 1 ? I18N.pick("Tomorrow", "Domani") : d.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" });
      items.forEach((t) => { const r = document.createElement("div"); r.textContent = (t.time ? t.time + " " : "") + t.text; what.appendChild(r); });
      b.append(when, what);
      if (i === 0) li.className = "now";
      b.addEventListener("click", () => { sel = k; view = new Date(d.getFullYear(), d.getMonth(), 1); renderAll(); $("planner").scrollIntoView({ behavior: "smooth" }); });
      li.appendChild(b);
      ul.appendChild(li);
    }
    $("plUpEmpty").hidden = any;
  }

  function renderAll() { renderWeek(); renderCal(); renderDay(); renderAgenda(); }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    sel = b.dataset.k; renderCal(); renderDay();
  });
  $("plPrev").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  $("plNext").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
  $("plToday").addEventListener("click", () => { view = new Date(today.getFullYear(), today.getMonth(), 1); sel = keyOf(today); renderAll(); });
  $("plClear").addEventListener("click", () => {
    tasks[sel] = (tasks[sel] || []).filter((t) => !t.done);
    if (!tasks[sel].length) delete tasks[sel];
    save(); renderAll();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = text.value.trim();
    if (!v) return;
    const day = $("plDay").value || sel;
    sel = day; const p = day.split("-").map(Number); view = new Date(p[0], p[1] - 1, 1);
    (tasks[sel] = tasks[sel] || []).push({ text: v, time: time.value, c: tcol, done: false });
    text.value = ""; time.value = "";
    save(); renderAll(); text.focus();
  });
  $("plDay").addEventListener("change", (e) => { if (!e.target.value) return; sel = e.target.value; const p = sel.split("-").map(Number); view = new Date(p[0], p[1] - 1, 1); renderAll(); });
  window.addEventListener("langchange", renderAll);
  renderAll();
})();
