(function () {
  const canvas = document.getElementById("snake");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("snake-score");
  const bestEl = document.getElementById("snake-best");
  const startBtn = document.getElementById("snake-start");

  const CELLS = 20;
  const CELL = canvas.width / CELLS;
  const BEST_KEY = "dreveen-snake-best";

  let snake, dir, queue, apple, score, timer;
  let state = "idle";
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) {}
  bestEl.textContent = best;

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    apple = placeApple();
    scoreEl.textContent = 0;
  }

  function placeApple() {
    const free = [];
    for (let x = 0; x < CELLS; x++) {
      for (let y = 0; y < CELLS; y++) {
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x: x, y: y });
      }
    }
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  function turn(nx, ny) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (nx === -last.x && ny === -last.y) return;
    if (nx === last.x && ny === last.y) return;
    if (queue.length < 2) queue.push({ x: nx, y: ny });
  }

  function schedule() {
    timer = setTimeout(tick, Math.max(65, 140 - score * 3));
  }

  function tick() {
    if (queue.length) dir = queue.shift();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eats = apple && head.x === apple.x && head.y === apple.y;
    const body = eats ? snake : snake.slice(0, -1);

    if (
      head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS ||
      body.some((s) => s.x === head.x && s.y === head.y)
    ) {
      return end("over");
    }

    snake.unshift(head);
    if (eats) {
      score++;
      scoreEl.textContent = score;
      apple = placeApple();
      if (!apple) return end("won");
    } else {
      snake.pop();
    }
    draw();
    schedule();
  }

  function end(result) {
    state = result;
    clearTimeout(timer);
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    startBtn.textContent = "Play again";
    draw();
  }

  function start() {
    clearTimeout(timer);
    reset();
    state = "running";
    startBtn.textContent = "Restart";
    draw();
    schedule();
  }

  function mix(a, b, t) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * t));
  }

  function drawApple(a) {
    const cx = a.x * CELL + CELL / 2;
    const cy = a.y * CELL + CELL / 2 + 1;
    const r = CELL * 0.4;

    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#ff6b6b");
    g.addColorStop(1, "#b3122e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy, r * 0.82, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.28, cy, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#5b3a1e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.55);
    ctx.quadraticCurveTo(cx + 1, cy - r * 1.1, cx + 3, cy - r * 1.25);
    ctx.stroke();

    ctx.fillStyle = "#3fbf6b";
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - r * 1.05, 4.5, 2.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSnake() {
    const tail = [20, 120, 70];
    const headC = [110, 231, 160];
    const n = snake.length;

    for (let i = n - 1; i >= 0; i--) {
      const s = snake[i];
      const c = mix(headC, tail, n > 1 ? i / (n - 1) : 0);
      ctx.fillStyle = "rgb(" + c.join(",") + ")";
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6)
        : ctx.rect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
      ctx.fill();
    }

    const h = snake[0];
    const cx = h.x * CELL + CELL / 2;
    const cy = h.y * CELL + CELL / 2;
    const px = -dir.y * 4.5;
    const py = dir.x * 4.5;
    ctx.fillStyle = "#06150c";
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.arc(cx + dir.x * 3 + px * side, cy + dir.y * 3 + py * side, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function overlay(title, sub) {
    ctx.fillStyle = "rgba(5, 12, 8, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3e9e2";
    ctx.textAlign = "center";
    ctx.font = "italic 34px 'Playfair Display', Georgia, serif";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 6);
    ctx.fillStyle = "#c9a87a";
    ctx.font = "14px Inter, Arial, sans-serif";
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 26);
  }

  function draw() {
    for (let x = 0; x < CELLS; x++) {
      for (let y = 0; y < CELLS; y++) {
        ctx.fillStyle = (x + y) % 2 ? "#0e2015" : "#0b1a11";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    if (apple) drawApple(apple);
    drawSnake();

    if (state === "idle") overlay("Ready?", "Press Start");
    if (state === "over") overlay("Game over", "Score " + score);
    if (state === "won") overlay("You win", "Perfect board");
  }

  startBtn.addEventListener("click", start);

  document.addEventListener("keydown", (e) => {
    const map = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    if (state !== "running" || !map[e.key]) return;
    e.preventDefault();
    turn(map[e.key][0], map[e.key][1]);
  });

  document.querySelectorAll(".dpad button").forEach((b) => {
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    b.addEventListener("click", () => {
      if (state === "running") turn(map[b.dataset.dir][0], map[b.dataset.dir][1]);
    });
  });

  let touch = null;
  canvas.addEventListener("touchstart", (e) => {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    if (!touch || state !== "running") return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") {
      clearTimeout(timer);
      state = "paused";
      startBtn.textContent = "Resume";
    }
  });

  reset();
  draw();
})();
