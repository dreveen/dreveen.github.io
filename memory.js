(function () {
  const board = document.getElementById("mem-board");
  if (!board) return;

  const movesEl = document.getElementById("mem-moves");
  const bestEl = document.getElementById("mem-best");
  const statusEl = document.getElementById("mem-status");
  let statusFn = null;
  function setStatus(fn) { statusFn = fn; statusEl.textContent = fn(); }
  const newBtn = document.getElementById("mem-new");
  const BEST_KEY = "dreveen-memory-best";
  // eight elegant line icons (24x24, drawn with a fine gold stroke)
  const ICONS = {
    Rose: '<path d="M12 3.5c-3.2 0-6 2.1-6 5.2s2.6 5 6 5 6-1.9 6-5-2.8-5.2-6-5.2z"/><path d="M12 6.5c-1.7 0-3.2 1-3.2 2.4s1.4 2.4 3.2 2.4 3.2-1 3.2-2.4-1.5-2.4-3.2-2.4z"/><path d="M12 13.7V22"/><path d="M12 18c2.2-.8 4-.6 5.2-2.6-2.4-.2-4.3.6-5.2 2.6z"/>',
    Moon: '<path d="M17 3.5A9 9 0 1 0 20.5 16 7.5 7.5 0 0 1 17 3.5z"/>',
    Sparkle: '<path d="M12 2c.7 6 4 9.3 10 10-6 .7-9.3 4-10 10-.7-6-4-9.3-10-10 6-.7 9.3-4 10-10z"/>',
    Gem: '<path d="M6.5 4h11L22 9.5 12 21 2 9.5z"/><path d="M2 9.5h20M9.5 4 7.5 9.5 12 21l4.5-11.5L14.5 4"/>',
    Crown: '<path d="M3 18.5h18"/><path d="M3.5 18.5 2.5 7.5l5 4 4.5-7 4.5 7 5-4-1 11z"/>',
    Key: '<circle cx="7.5" cy="12" r="4"/><path d="M11.5 12H21M17.5 12v3.2M20.5 12v2.2"/>',
    Hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3c0 4.5 3 6 4.500 9-1.500 3-4.500 4.500-4.500 9M16.500 3c0 4.500-3 6-4.500 9 1.500 3 4.500 4.500 4.500 9"/>',
    Ring: '<circle cx="12" cy="15" r="6"/><path d="M9.200 5.500 12 2.500l2.800 3L12 8.500z"/>',
  };
  const SYMBOLS = Object.keys(ICONS);


  let first = null;
  let busy = false;
  let moves = 0;
  let pairs = 0;
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) {}
  bestEl.textContent = best || "-";

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function label(card, i) {
    const open = card.classList.contains("flipped");
    card.setAttribute("aria-label", I18N.pick("Card ", "Carta ") + (i + 1) + (open ? ": " + I18N.t(card.dataset.s) : I18N.pick(", face down", ", coperta")));
  }

  function newGame() {
    first = null;
    busy = false;
    moves = 0;
    pairs = 0;
    movesEl.textContent = "0";
    setStatus(() => I18N.pick("Find the 8 matching pairs.", "Trova le 8 coppie."));
    board.innerHTML = "";
    shuffle(SYMBOLS.concat(SYMBOLS)).forEach((s, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mem-card";
      card.dataset.s = s;
      card.innerHTML =
        '<span class="mem-inner"><span class="mem-face mem-back" aria-hidden="true"></span>' +
        '<span class="mem-face mem-front" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONS[s] + "</svg></span></span>";
      label(card, i);
      card.addEventListener("click", () => flip(card, i));
      board.appendChild(card);
    });
  }

  function flip(card, i) {
    if (busy || card.classList.contains("flipped")) return;
    card.classList.add("flipped");
    label(card, i);
    if (!first) { first = { card: card, i: i }; return; }

    moves++;
    movesEl.textContent = moves;
    const a = first;
    first = null;

    if (a.card.dataset.s === card.dataset.s) {
      a.card.classList.add("matched");
      card.classList.add("matched");
      pairs++;
      if (pairs === SYMBOLS.length) win();
      return;
    }
    busy = true;
    setTimeout(() => {
      a.card.classList.remove("flipped");
      card.classList.remove("flipped");
      label(a.card, a.i);
      label(card, i);
      busy = false;
    }, 850);
  }

  function win() {
    let newBest = false;
    if (!best || moves < best) {
      best = moves;
      bestEl.textContent = best;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
      newBest = true;
    }
    const n = moves;
    setStatus(() => I18N.pick(
      "Well played: all pairs found in " + n + " moves." + (newBest ? " New best!" : ""),
      "Ben giocato: tutte le coppie in " + n + " mosse." + (newBest ? " Nuovo record!" : "")
    ));
  }

  window.addEventListener("langchange", () => {
    if (statusFn) statusEl.textContent = statusFn();
    Array.from(board.children).forEach((c, i) => label(c, i));
  });

  newBtn.addEventListener("click", newGame);
  newGame();
})();
