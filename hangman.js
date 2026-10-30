(function () {
  const root = document.getElementById("hangman");
  if (!root) return;

  // Curious words from the computing world, each with a short, funny definition in English and Italian.
  // Lowercase letters a-z only (no spaces, hyphens or accents). The definition appears when the word is revealed.
  const ENTRIES = [
    {
      word: "procrastinate",
      en: "Putting off until tomorrow the bug you should fix today.",
      it: "Rimandare a domani il bug che dovresti correggere oggi.",
    },
    {
      word: "gremlin",
      en: "The imaginary creature we blame when the code breaks for no reason.",
      it: "La creatura immaginaria a cui diamo la colpa quando il codice si rompe senza motivo.",
    },
    {
      word: "bugfix",
      en: "The fix that creates two more bugs.",
      it: "La correzione che crea altri due bug.",
    },
    {
      word: "coffee",
      en: "The fuel that turns developers' ideas into code.",
      it: "Il carburante che trasforma le idee degli sviluppatori in codice.",
    },
    {
      word: "rubberduck",
      en: "The little duck you explain your code to, until the error shows up on its own.",
      it: "La paperella a cui spieghi il codice, finché l'errore non salta fuori da solo.",
    },
    {
      word: "nightowl",
      en: "The developer who writes their best code after midnight.",
      it: "Lo sviluppatore che scrive il suo codice migliore dopo mezzanotte.",
    },
    {
      word: "cloud",
      en: "Someone else's computer, with a more poetic name.",
      it: "Il computer di qualcun altro, con un nome più poetico.",
    },
    {
      word: "cookie",
      en: "The little digital biscuit websites leave behind to remember you. Zero calories.",
      it: "Il biscottino digitale che i siti ti lasciano per ricordarsi di te. Zero calorie.",
    },
    {
      word: "password",
      en: "The secret word you forget exactly when you need it.",
      it: "La parola segreta che dimentichi proprio quando ti serve.",
    },
    {
      word: "wifi",
      en: "The invisible magic that makes you feel at home anywhere.",
      it: "La magia invisibile che ti fa sentire a casa in qualsiasi posto.",
    },
  ];
  const MAX_WRONG = 6;

  const wordEl = document.getElementById("hm-word");
  const statusEl = document.getElementById("hm-status");
  let statusFn = null;
  function setStatus(fn) { statusFn = fn; statusEl.textContent = fn(); }
  window.addEventListener("langchange", () => { if (statusFn) statusEl.textContent = statusFn(); });
  const keysEl = document.getElementById("hm-keys");
  const wrongEl = document.getElementById("hm-wrong");
  const streakEl = document.getElementById("hm-streak");
  const bestEl = document.getElementById("hm-best");
  const BEST_KEY = "dreveen-hangman-best";
  let streak = 0;
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) {}
  bestEl.textContent = best;
  const newBtn = document.getElementById("hm-new");
  const parts = root.querySelectorAll(".part");

  let word = "";
  let guessed = new Set();
  let wrong = 0;
  let over = false;

  const buttons = {};
  "abcdefghijklmnopqrstuvwxyz".split("").forEach((l) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = l.toUpperCase();
    b.addEventListener("click", () => guess(l));
    keysEl.appendChild(b);
    buttons[l] = b;
  });

  let entry = null;
  const meaningEl = document.getElementById("hm-meaning");
  const meaningEn = document.getElementById("hm-meaning-en");
  const meaningIt = document.getElementById("hm-meaning-it");

  function showMeaning(show) {
    if (!meaningEl) return;
    if (show && entry) {
      meaningEn.textContent = entry.en;
      meaningIt.textContent = entry.it;
    }
    meaningEl.hidden = !show;
  }

  function pick() {
    let next;
    do {
      next = ENTRIES[Math.floor(Math.random() * ENTRIES.length)];
    } while (ENTRIES.length > 1 && entry && next.word === entry.word);
    entry = next;
    return next.word;
  }

  function render() {
    wordEl.textContent = word
      .split("")
      .map((c) => (guessed.has(c) || over ? c.toUpperCase() : "_"))
      .join(" ");
    wrongEl.textContent = wrong;
    parts.forEach((p, i) => (p.style.display = i < wrong ? "block" : "none"));
  }

  function guess(letter) {
    if (over || guessed.has(letter)) return;
    guessed.add(letter);
    const hit = word.includes(letter);
    buttons[letter].disabled = true;
    if (hit) buttons[letter].classList.add("hit");
    else wrong++;

    const won = word.split("").every((c) => guessed.has(c));
    if (won) {
      over = true;
      streak++;
      if (streak > best) {
        best = streak;
        bestEl.textContent = best;
        try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
      }
      streakEl.textContent = streak;
      setStatus(() => I18N.pick("You got it.", "Ci sei!"));
      showMeaning(true);
    } else if (wrong >= MAX_WRONG) {
      over = true;
      streak = 0;
      streakEl.textContent = streak;
      setStatus(() => I18N.pick("The word was ", "La parola era ") + word.toUpperCase() + ".");
      showMeaning(true);
    }
    render();
  }

  function newGame() {
    // skipping a word that is still in progress breaks the streak
    if (!over && guessed.size > 0) { streak = 0; streakEl.textContent = streak; }
    word = pick();
    showMeaning(false);
    guessed = new Set();
    wrong = 0;
    over = false;
    setStatus(() => word.length + " " + I18N.pick("letters", "lettere"));
    Object.values(buttons).forEach((b) => {
      b.disabled = false;
      b.classList.remove("hit");
    });
    render();
  }

  newBtn.addEventListener("click", newGame);

  root.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase());
  });

  newGame();
})();
