// Metallic colour set shared by the planner and the habit tracker: every colour is a three-tone sheen, like the gold.
window.METAL = (function () {
  const list = [
    { en: "Gold", it: "Oro", lo: "#7d6140", mid: "#c9a87a", hi: "#f1deb8" },
    { en: "Rose gold", it: "Oro rosa", lo: "#8a4b4b", mid: "#d99a8f", hi: "#fde0d6" },
    { en: "Silver", it: "Argento", lo: "#6f7480", mid: "#b9bfc9", hi: "#f4f6fa" },
    { en: "Ruby", it: "Rubino", lo: "#5c0a1c", mid: "#c41446", hi: "#ff8fa8" },
    { en: "Emerald", it: "Smeraldo", lo: "#0f4d3a", mid: "#2fb88a", hi: "#b5ffe3" },
    { en: "Sapphire", it: "Zaffiro", lo: "#17306b", mid: "#4a7fe0", hi: "#b9d3ff" },
    { en: "Amethyst", it: "Ametista", lo: "#45236b", mid: "#9b6bd6", hi: "#e2ccff" },
    { en: "Copper", it: "Rame", lo: "#6b3a18", mid: "#c8763f", hi: "#ffd0a8" },
    { en: "Titanium", it: "Titanio", lo: "#4c5260", mid: "#8a93a6", hi: "#dfe4ee" },
    { en: "Bronze", it: "Bronzo", lo: "#5a3a1a", mid: "#a8743c", hi: "#e9c08f" },
    { en: "Champagne", it: "Champagne", lo: "#8c7a55", mid: "#e6d3a3", hi: "#fff8e1" },
    { en: "Pearl", it: "Perla", lo: "#8f8580", mid: "#e6dcd8", hi: "#fffaf7" },
    { en: "Blush", it: "Cipria", lo: "#9a6370", mid: "#e8aab8", hi: "#ffe3ea" },
    { en: "Fuchsia", it: "Fucsia", lo: "#6b1048", mid: "#d6307f", hi: "#ff9ccb" },
    { en: "Burgundy", it: "Bordeaux", lo: "#3d0716", mid: "#8a1c36", hi: "#e0788c" },
    { en: "Turquoise", it: "Turchese", lo: "#0e4f55", mid: "#27b5bd", hi: "#aef6f7" },
    { en: "Mint", it: "Menta", lo: "#1d6b57", mid: "#6fe0b8", hi: "#d3ffee" },
    { en: "Olive", it: "Oliva", lo: "#4a4a14", mid: "#a4a63a", hi: "#f0f1a0" },
    { en: "Sky", it: "Cielo", lo: "#2a5f86", mid: "#6cbcf0", hi: "#d6f1ff" },
    { en: "Lilac", it: "Lilla", lo: "#5c4a86", mid: "#b9a2ee", hi: "#efe6ff" },
    { en: "Orchid", it: "Orchidea", lo: "#5e1f6a", mid: "#c25bd1", hi: "#f6c6ff" },
    { en: "Coral", it: "Corallo", lo: "#8a2f22", mid: "#ee6f5a", hi: "#ffc2b4" },
    { en: "Amber", it: "Ambra", lo: "#7a4a08", mid: "#e8a21c", hi: "#ffe19a" },
    { en: "Orange", it: "Arancio", lo: "#8a3a0a", mid: "#f07f2a", hi: "#ffd1a3" },
    { en: "Graphite", it: "Grafite", lo: "#2b2b30", mid: "#6e6e78", hi: "#c8c8d2" },
    { en: "White", it: "Bianco", lo: "#c3c8d1", mid: "#f6f7fa", hi: "#ffffff" },
  ];
  const order = [25, 11, 10, 0, 22, 23, 7, 9, 21, 1, 12, 13, 3, 14, 20, 6, 19, 5, 18, 15, 16, 4, 17, 2, 8, 24];
  const at = (i) => list[(i || 0) % list.length];
  function grad(i) {
    const c = at(i);
    return "linear-gradient(105deg," + c.lo + " 0%," + c.mid + " 18%," + c.hi + " 32%," + c.mid + " 46%," + c.lo + " 62%," + c.mid + " 78%," + c.hi + " 92%," + c.mid + " 100%)";
  }
  // fills `box` with one round swatch per colour; returns { set(i) } to change the highlighted one (undefined = none)
  function picker(box, current, onPick) {
    const btns = order.map((i) => {
      const c = list[i];
      const b = document.createElement("button");
      b.type = "button"; b.style.background = grad(i); b.title = c.en; b.setAttribute("aria-label", c.en);
      b.addEventListener("click", () => { set(i); onPick(i); });
      box.appendChild(b);
      return b;
    });
    function set(i) { btns.forEach((b, j) => b.classList.toggle("on", order[j] === i)); }
    window.addEventListener("langchange", () => btns.forEach((b, j) => { b.title = I18N.pick(list[order[j]].en, list[order[j]].it); }));
    set(current);
    return { set: set };
  }
  return { list: list, grad: grad, mid: (i) => at(i).mid, picker: picker };
})();
