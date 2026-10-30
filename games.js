// Games page: pick a game from the icons and it opens large below.
(function () {
  const picks = Array.from(document.querySelectorAll(".pick"));
  const panels = Array.from(document.querySelectorAll(".panel"));
  const stage = document.getElementById("stage");
  const hint = document.getElementById("stageHint");
  if (!picks.length || !stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = "";

  function open(name, scroll) {
    if (name === current) return;
    // let the running game pause before it disappears
    document.dispatchEvent(new Event("gamehide"));
    current = name;
    picks.forEach((p) => {
      const on = p.dataset.game === name;
      p.classList.toggle("active", on);
      p.setAttribute("aria-pressed", String(on));
    });
    panels.forEach((p) => { p.hidden = p.dataset.game !== name; });
    if (hint) hint.hidden = true;
    // canvases need a re-fit now that they are visible
    window.dispatchEvent(new Event("resize"));
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    const panel = panels.find((p) => p.dataset.game === name);
    if (panel && panel.id === "hangman") panel.focus({ preventScroll: true });
    if (scroll) stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  picks.forEach((p) => p.addEventListener("click", () => open(p.dataset.game, true)));

  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (picks.some((p) => p.dataset.game === h)) open(h, true);
  });

  const fromHash = location.hash.replace("#", "");
  if (picks.some((p) => p.dataset.game === fromHash)) open(fromHash, false);
})();
