// Shy phone: dodges exactly twice, accepts the third click/tap, then shows a note.
(function () {
  const btn = document.getElementById("phoneBtn");
  const arena = document.getElementById("phoneArena");
  const note = document.getElementById("phoneNote");
  if (!btn || !arena || !note) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX = 3;
  let attempts = 0;
  let x = 0, y = 0, lastY = 0.5;
  let lastPointer = null;

  function size() { return { w: arena.clientWidth, h: arena.clientHeight, s: btn.offsetWidth }; }
  function place(nx, ny) {
    const d = size();
    x = Math.min(Math.max(nx, 0), d.w - d.s);
    y = Math.min(Math.max(ny, 0), d.h - d.s);
    btn.style.setProperty("--tf", "translate3d(" + x + "px," + y + "px,0)");
    btn.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }
  // start at the far right, vertically centred
  function home() { const d = size(); btn.style.transition = "none"; place(d.w - d.s, (d.h - d.s) / 2); void btn.offsetWidth; btn.style.transition = ""; }
  home();
  window.addEventListener("resize", () => { const d = size(); place(x, y); });

  const rnd = (a, b) => a + Math.random() * (b - a);
  const oops = document.getElementById("phoneOops");
  let oopsTimer;
  function showOops() {
    if (!oops) return;
    clearTimeout(oopsTimer);
    const d = size();
    oops.style.top = y + d.s / 2 + "px";
    if (x > d.w / 2) { oops.style.left = "auto"; oops.style.right = d.w - x + 12 + "px"; }
    else { oops.style.right = "auto"; oops.style.left = x + d.s + 12 + "px"; }
    oops.classList.add("show");
    oopsTimer = setTimeout(() => oops.classList.remove("show"), reduce ? 2000 : 2200);
  }
  const hint = document.getElementById("phoneHint");
  const HINTS = [
    ["Want to call? Try to catch the phone.", "Vuoi chiamare? Prova a prendere la cornetta."],
    ["Too slow! Try again (1/3)", "Troppo lenta! Riprova (1/3)"],
    ["Almost… once more (2/3)", "Quasi… ancora una volta (2/3)"],
  ];
  function say(i) {
    if (!hint) return;
    if (i >= HINTS.length) { hint.style.display = "none"; return; }
    hint.classList.add("swap");
    setTimeout(() => {
      hint.innerHTML = HINTS[i][0] + "<small>" + HINTS[i][1] + "</small>";
      hint.classList.remove("swap");
    }, reduce ? 0 : 300);
  }
  say(0);

  function flee(px, py) {
    const d = size();
    const rangeX = d.w - d.s, rangeY = d.h - d.s;
    let tx, ty;
    if (attempts === 1) {
      // first dodge: sweep across to the opposite side, mostly horizontal
      tx = (x > rangeX / 2 ? rnd(0.08, 0.3) : rnd(0.7, 0.92)) * rangeX;
      ty = rnd(0.1, 0.9) * rangeY;
      lastY = ty / rangeY;
    } else {
      // second dodge: a different direction, toward the middle and the opposite edge vertically
      tx = rnd(0.42, 0.68) * rangeX;
      ty = (lastY > 0.5 ? rnd(0, 0.2) : rnd(0.8, 1)) * rangeY;
    }
    // keep clear of the pointer
    if (px != null && Math.hypot(tx + d.s / 2 - px, ty + d.s / 2 - py) < 110) {
      tx = rangeX - tx;
    }
    btn.classList.add("moving");
    place(tx, ty);
    showOops();
    setTimeout(() => btn.classList.remove("moving"), reduce ? 0 : 900);
  }

  btn.addEventListener("click", (e) => {
    if (attempts >= MAX) {
      // fourth click: close the note and start over
      attempts = 0;
      note.classList.remove("show");
      note.textContent = "";
      btn.classList.remove("done");
      btn.setAttribute("aria-label", "Call Denise");
      const d = size();
      place(d.w - d.s, (d.h - d.s) / 2);
      return;
    }
    attempts++;
    if (attempts < MAX) {
      const r = arena.getBoundingClientRect();
      const hasPoint = e.clientX || e.clientY;
      say(attempts);
      flee(hasPoint ? e.clientX - r.left : null, hasPoint ? e.clientY - r.top : null);
      return;
    }
    say(3);
    if (oops) oops.classList.remove("show");
    // third attempt: accepted
    btn.classList.add("done");
    btn.setAttribute("aria-label", "Phone (not available, please use email)");
    const mail = document.getElementById("emailLink");
    const href = mail ? mail.getAttribute("href") : "#";
    note.innerHTML = 'Nice try! 😉 I’d much rather hear from you by email — <a href="' + href + '">write to me there</a> and I’ll happily reply.' +
      '<span class="it" lang="it">Bel tentativo! 😉 Preferisco essere contattata via email. <a href="' + href + '">Scrivimi lì</a>, ti risponderò con piacere.</span>';
    note.classList.add("show");
  });
})();
