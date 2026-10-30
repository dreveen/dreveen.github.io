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
  ];
  const at = (i) => list[(i || 0) % list.length];
  function grad(i) {
    const c = at(i);
    return "linear-gradient(105deg," + c.lo + " 0%," + c.mid + " 18%," + c.hi + " 32%," + c.mid + " 46%," + c.lo + " 62%," + c.mid + " 78%," + c.hi + " 92%," + c.mid + " 100%)";
  }
  // fills `box` with one round swatch per colour; returns { set(i) } to change the highlighted one (undefined = none)
  function picker(box, current, onPick) {
    const btns = list.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.style.background = grad(i); b.title = c.en; b.setAttribute("aria-label", c.en);
      b.addEventListener("click", () => { set(i); onPick(i); });
      box.appendChild(b);
      return b;
    });
    function set(i) { btns.forEach((b, j) => b.classList.toggle("on", j === i)); }
    window.addEventListener("langchange", () => btns.forEach((b, j) => { b.title = I18N.pick(list[j].en, list[j].it); }));
    set(current);
    return { set: set };
  }
  return { list: list, grad: grad, mid: (i) => at(i).mid, picker: picker };
})();
