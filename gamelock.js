// While a game is running, freeze page scrolling (wheel, touch swipes, arrow/space/page keys).
window.GameLock = (function () {
  let on = false;
  const KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "PageUp", "PageDown", "Home", "End"];
  const stop = (e) => { if (on) e.preventDefault(); };
  function key(e) {
    if (!on || e.ctrlKey || e.metaKey || e.altKey) return;
    if (KEYS.indexOf(e.key) === -1) return;
    // let Space/Enter still activate buttons
    if (e.key === " " && e.target && e.target.tagName === "BUTTON") return;
    e.preventDefault();
  }
  window.addEventListener("wheel", stop, { passive: false });
  document.addEventListener("touchmove", stop, { passive: false });
  window.addEventListener("keydown", key);
  return {
    set: function (v) {
      on = !!v;
      document.documentElement.classList.toggle("game-lock", on);
    },
  };
})();
