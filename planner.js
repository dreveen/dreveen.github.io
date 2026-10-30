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
  let prio = 1;

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
      const cls = (k === keyOf(today) ? " today" : "") + (k === sel ? " sel" : "") + (items.length ? " has" : "") + (items.length && !open ? " all" : "");
      html += '<button type="button" class="d' + cls + '" data-k="' + k + '">' + d + "</button>";
    }
    grid.innerHTML = html;
  }

  function renderDay() {
    const [y, m, d] = sel.split("-").map(Number);
    $("plDate").textContent = new Date(y, m - 1, d).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
    const items = (tasks[sel] || []).slice().sort((a, b) => (a.done - b.done) || (a.time || "99").localeCompare(b.time || "99") || (b.p - a.p));
    list.innerHTML = "";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.className = "p" + t.p + (t.done ? " done" : "");
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
    $("plEmpty").hidden = n > 0;
    $("plClear").hidden = !done;
    text.placeholder = I18N.pick("What do you want to do?", "Cosa vuoi fare?");
  }

  function renderAll() { renderWeek(); renderCal(); renderDay(); }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    sel = b.dataset.k; renderCal(); renderDay();
  });
  $("plPrev").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  $("plNext").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
  $("plToday").addEventListener("click", () => { view = new Date(today.getFullYear(), today.getMonth(), 1); sel = keyOf(today); renderAll(); });
  $("plPrio").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]");
    if (!b) return;
    prio = Number(b.dataset.p);
    $("plPrio").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  });
  $("plClear").addEventListener("click", () => {
    tasks[sel] = (tasks[sel] || []).filter((t) => !t.done);
    if (!tasks[sel].length) delete tasks[sel];
    save(); renderAll();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = text.value.trim();
    if (!v) return;
    (tasks[sel] = tasks[sel] || []).push({ text: v, time: time.value, p: prio, done: false });
    text.value = ""; time.value = "";
    save(); renderAll(); text.focus();
  });
  window.addEventListener("langchange", renderAll);
  renderAll();
})();
