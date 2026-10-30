(function () {
  const root = document.getElementById("hangman");
  if (!root) return;

  // Placeholder words: we'll pick the real ones together later. Lowercase letters a-z only.
  const WORDS = [
    "algorithm", "compiler", "recursion", "database", "network",
    "variable", "function", "binary", "pointer", "framework",
  ];
  const MAX_WRONG = 6;

  const wordEl = document.getElementById("hm-word");
  const statusEl = document.getElementById("hm-status");
  const keysEl = document.getElementById("hm-keys");
  const wrongEl = document.getElementById("hm-wrong");
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

  function pick() {
    let next;
    do {
      next = WORDS[Math.floor(Math.random() * WORDS.length)];
    } while (WORDS.length > 1 && next === word);
    return next;
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
      statusEl.textContent = "You got it.";
    } else if (wrong >= MAX_WRONG) {
      over = true;
      statusEl.textContent = "The word was " + word.toUpperCase() + ".";
    }
    render();
  }

  function newGame() {
    word = pick();
    guessed = new Set();
    wrong = 0;
    over = false;
    statusEl.textContent = word.length + " letters";
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
