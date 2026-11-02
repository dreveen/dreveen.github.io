// The "Do not press" button on About: a harmless fake break-in that ends with a joke and closes itself.
(function () {
  const btn = document.getElementById("nopress");
  if (!btn) return;
  const pick = (en, it) => (window.I18N ? I18N.pick(en, it) : en);
  // the break-in screen is always in English; only the final joke follows the site language
  const T = (en) => en;

  const ov = document.createElement("div");
  ov.className = "hk";
  ov.setAttribute("role", "alertdialog");
  ov.setAttribute("aria-label", "Joke");
  ov.hidden = true;
  ov.innerHTML =
    '<canvas class="hk-rain" aria-hidden="true"></canvas>' +
    '<div class="hk-term" aria-hidden="true"><div class="hk-log"></div><div class="hk-bar"><i></i></div><div class="hk-pct"></div></div>' +
    '<div class="hk-wins" aria-hidden="true"></div>' +
    '<pre class="hk-skull" aria-hidden="true"></pre><div class="hk-alert" aria-hidden="true"></div><div class="hk-sub" aria-hidden="true"></div><div class="hk-count" aria-hidden="true"></div>' +
    '<div class="hk-joke"><p class="hk-j1"></p><p class="hk-j2"></p></div>';
  document.body.appendChild(ov);
  const rain = ov.querySelector(".hk-rain"), log = ov.querySelector(".hk-log"), bar = ov.querySelector(".hk-bar i"),
    pct = ov.querySelector(".hk-pct"), skull = ov.querySelector(".hk-skull"), wins = ov.querySelector(".hk-wins"), sub = ov.querySelector(".hk-sub"), count = ov.querySelector(".hk-count"), alertEl = ov.querySelector(".hk-alert"), joke = ov.querySelector(".hk-joke");

  // everything on screen is invented: no real data about the visitor is read or shown
  const LINES = [
    ["> UNAUTHORIZED CONNECTION DETECTED", "> CONNESSIONE NON AUTORIZZATA RILEVATA"],
    ["> scanning ports 21 22 80 443 8080... [OPEN]", "> scansione porte 21 22 80 443 8080... [APERTE]"],
    ["> bypassing firewall ........ [BREACHED]", "> aggiro il firewall ........ [VIOLATO]"],
    ["> injecting payload 0x4F2A9C ........ [OK]", "> inietto payload 0x4F2A9C ........ [OK]"],
    ["> escalating privileges: root ........ [OK]", "> escalation dei privilegi: root ........ [OK]"],
    ["> disabling antivirus ........ [DONE]", "> disattivo l'antivirus ........ [FATTO]"],
    ["> decrypting password hashes...", "> decifro gli hash delle password..."],
    ["> copying /home/user/* ........", "> copio /home/user/* ........"],
  ];
  const SKULL = [
    "      _______________      ",
    "     /               \\     ",
    "    /   _   ___   _   \\    ",
    "   |   (_) |   | (_)   |   ",
    "   |      \\_____/      |   ",
    "    \\      |_|_|      /    ",
    "     \\_______________/     ",
    "      |_|_|_|_|_|_|_|      ",
  ].join("\n");
  const SUB = [
    ["YOUR FILES ARE BEING ENCRYPTED", "I TUOI FILE SONO STATI CIFRATI"],
    ["THANK YOU FOR YOUR PERSONAL DATA", "GRAZIE PER I TUOI DATI PERSONALI"],
  ];
  // fake system dialogs that pile up on their own: error icon, title, message, a button that does nothing (203.0.113.x is a reserved documentation range)
  const WINS = [
    ["Critical error", "Errore critico", "Access violation at address 0x7FFE2A40. The program will be closed.", "Violazione di accesso all'indirizzo 0x7FFE2A40. Il programma verrà chiuso."],
    ["Security alert", "Avviso di sicurezza", "Unauthorized remote session detected from 203.0.113.42.", "Rilevata una sessione remota non autorizzata da 203.0.113.42."],
    ["Firewall", "Firewall", "Firewall protection has been disabled.", "La protezione del firewall è stata disattivata."],
    ["Antivirus", "Antivirus", "Real-time protection was turned off by an unknown process.", "La protezione in tempo reale è stata disattivata da un processo sconosciuto."],
    ["System error", "Errore di sistema", "Error 0x80070005: Access denied.", "Errore 0x80070005: Accesso negato."],
    ["Remote access", "Accesso remoto", "A remote user has taken control of this device.", "Un utente remoto ha preso il controllo di questo dispositivo."],
    ["keylogger.exe", "keylogger.exe", "keylogger.exe has started and is recording keystrokes.", "keylogger.exe è stato avviato e sta registrando i tasti premuti."],
    ["Network", "Rete", "Connection to 203.0.113.42:4444 established.", "Connessione a 203.0.113.42:4444 stabilita."],
    ["Warning", "Attenzione", "Your data is being sent to an unknown server.", "I tuoi dati vengono inviati a un server sconosciuto."],
    ["Files", "File", "Encrypting documents: 12,481 of 24,381 files.", "Cifratura dei documenti: 12.481 di 24.381 file."],
    ["Fatal error", "Errore fatale", "Kernel panic: attempted to kill init.", "Kernel panic: tentativo di terminare init."],
    ["Password manager", "Gestione password", "Stored passwords have been exported.", "Le password salvate sono state esportate."],
    ["Security", "Sicurezza", "Administrator account has been changed.", "L'account amministratore è stato modificato."],
    ["Error", "Errore", "The application has stopped responding.", "L'applicazione ha smesso di rispondere."],
  ];
  let winN = 0, winZ = 5;
  function spawnWin() {
    const w = WINS[winN++ % WINS.length];
    const el = document.createElement("div");
    el.className = "hk-win";
    el.style.zIndex = ++winZ;
    const wd = Math.min(340, innerWidth * 0.78);
    el.style.width = wd + "px";
    // keep clear of the central messages (alert, "thank you for your data", countdown)
    const zones = [alertEl, sub, count].map((z) => z.getBoundingClientRect());
    const ht = 120;
    let x = 4, y = 50;
    for (let tries = 0; tries < 40; tries++) {
      x = Math.max(4, Math.random() * (innerWidth - wd - 8));
      y = Math.max(50, Math.random() * (innerHeight - ht - 10));
      const hit = zones.some((r) => x < r.right + 8 && x + wd > r.left - 8 && y < r.bottom + 8 && y + ht > r.top - 8);
      if (!hit) break;
    }
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.innerHTML = '<div class="hk-wt"><span></span><b>✕</b></div><div class="hk-wb"><i>✕</i><p></p></div><div class="hk-wf"><u>OK</u></div>';
    el.querySelector(".hk-wt span").textContent = T(w[0], w[1]);
    el.querySelector("p").textContent = T(w[2], w[3]);
    wins.appendChild(el);
  }
  let timers = [], raf = 0, running = false, rainOn = false, redMode = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  function startRain() {
    const cx = rain.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (rain.width = innerWidth * dpr), H = (rain.height = innerHeight * dpr);
    const size = 16 * dpr, cols = Math.ceil(W / size), drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = "01アイウエオカキクケコサシスセソ<>/{}[]#$%&";
    cx.fillStyle = "#000"; cx.fillRect(0, 0, W, H);
    let last = 0;
    rainOn = true;
    (function step(t) {
      if (!rainOn) return;
      raf = requestAnimationFrame(step);
      if (t - last < 55) return;
      last = t;
      cx.fillStyle = "rgba(0,0,0,.16)"; cx.fillRect(0, 0, W, H);
      cx.font = size + "px monospace";
      for (let i = 0; i < cols; i++) {
        cx.fillStyle = redMode ? (Math.random() > 0.94 ? "#ffd0d0" : "#d4142e") : (Math.random() > 0.96 ? "#d6ffd6" : "#18b84a");
        cx.fillText(chars[(Math.random() * chars.length) | 0], i * size, drops[i] * size);
        if (drops[i] * size > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    })(0);
  }

  function close() {
    if (!running) return;
    running = false; rainOn = false;
    timers.forEach(clearTimeout); timers = [];
    cancelAnimationFrame(raf);
    ov.classList.remove("show", "ok", "alarm", "red"); redMode = false;
    document.body.style.overflow = ""; document.documentElement.style.overflow = "";
    later(() => { ov.hidden = true; btn.disabled = false; btn.focus({ preventScroll: true }); }, 500);
  }

  function run() {
    if (running) return;
    running = true; btn.disabled = true;
    log.textContent = ""; bar.style.width = "0"; pct.textContent = ""; alertEl.textContent = ""; alertEl.classList.remove("on");
    ov.classList.remove("ok", "alarm", "red"); redMode = false;
    wins.textContent = ""; skull.textContent = ""; sub.textContent = ""; count.textContent = ""; sub.classList.remove("on"); count.classList.remove("on");
    ov.hidden = false;
    document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden";
    void ov.offsetWidth; ov.classList.add("show");
    startRain();

    // phase 1: green terminal, fast and cold
    let t = 400;
    LINES.forEach((l) => { later(() => { log.textContent += T(l[0], l[1]) + "\n"; }, t); t += 430; });
    [1000, 2000, 3000].forEach((d) => later(spawnWin, d));
    const p0 = t;
    for (let k = 0; k <= 20; k++) later(() => { const v = k * 5; bar.style.width = v + "%"; pct.textContent = T("stealing personal files... ", "rubo i file personali... ") + v + "%"; }, p0 + k * 110);
    t = p0 + 21 * 110 + 300;
    // phase 2: everything turns red, the screen shakes, a skull appears
    later(() => {
      redMode = true; ov.classList.add("red", "alarm");
      skull.textContent = SKULL;
      alertEl.textContent = T("SYSTEM COMPROMISED", "SISTEMA COMPROMESSO"); alertEl.classList.add("on");
    }, t);
    SUB.forEach((s, i) => later(() => { sub.textContent = T(s[0], s[1]); sub.classList.add("on"); }, t + 900 + i * 1700));
    for (let k = 0; k < 18; k++) later(spawnWin, t + 150 + k * 300);
    const cd0 = t + 700;
    for (let k = 0; k <= 7; k++) later(() => { count.textContent = "00:0" + (7 - k); count.classList.add("on"); }, cd0 + k * 800);
    t = cd0 + 8 * 800 + 700;
    later(() => {
      wins.textContent = ""; ov.classList.remove("alarm", "red"); redMode = false; ov.classList.add("ok"); rainOn = false; cancelAnimationFrame(raf);
      joke.querySelector(".hk-j1").textContent = pick("Just kidding!", "Scherzavo!");
      joke.querySelector(".hk-j2").textContent = pick("Nothing happened. Everything is safe.", "Non è successo niente. È tutto al sicuro.");
    }, t);
    later(close, t + 3200);
  }

  btn.addEventListener("click", run);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && running && ov.classList.contains("ok")) close(); });
  ov.addEventListener("click", () => { if (ov.classList.contains("ok")) close(); });
})();
