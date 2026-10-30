// A small neon "terminal" that types little programs about me, then wipes and starts the next one.
(function () {
  const pre = document.getElementById("ccCode");
  const fileEl = document.getElementById("ccFile");
  if (!pre) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // comments are the only lines that change with the language
  const SNIPPETS = [
    {
      file: "dreveen.js",
      lines: () => [
        "const denise = {",
        '  studies: "Computer Engineering",',
        '  stack: ["Java", "Python", "PHP", "SQL"],',
        "  curious: true,",
        "};",
        "",
        "function build(idea) {",
        "  return idea.toCode().withCare();",
        "}",
        "",
        'build("something beautiful");',
        I18N.pick("// bugs found: 0 (for now)", "// bug trovati: 0 (per ora)"),
      ],
    },
    {
      file: "loop.py",
      lines: () => [
        "while True:",
        "    learn()",
        "    build()",
        "    repeat()",
        "",
        I18N.pick("# coffee required", "# serve il caffè"),
        "coffee = True",
        "if not coffee:",
        '    print("zzz...")',
      ],
    },
    {
      file: "ideas.sql",
      lines: () => [
        "SELECT ideas",
        "FROM imagination",
        "WHERE logic = 'on'",
        "  AND creativity = 'max'",
        "ORDER BY wow DESC;",
        "",
        I18N.pick("-- 1 row returned: you", "-- 1 riga restituita: tu"),
      ],
    },
    {
      file: "hello.php",
      lines: () => [
        "<?php",
        'echo "Hello, world";',
        "",
        I18N.pick("// every expert started here", "// tutti sono partiti da qui"),
        "$next = 'something great';",
      ],
    },
  ];

  const KW = /\b(const|function|return|while|if|not|True|SELECT|FROM|WHERE|AND|ORDER|BY|DESC|echo|true|false)\b/g;
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function color(line) {
    // comments first (whole rest of the line)
    const m = line.match(/^(.*?)(\/\/.*|#.*|--.*)$/);
    let code = line, com = "";
    if (m) { code = m[1]; com = m[2]; }
    let out = esc(code)
      .replace(/("[^"]*"?|'[^']*'?)/g, '<b class="s">$1</b>')
      .replace(/\b(\d+)\b/g, '<b class="n">$1</b>');
    // keywords outside strings
    out = out.split(/(<b class="s">.*?<\/b>)/).map((p) => (p.indexOf('<b class="s">') === 0 ? p : p.replace(KW, '<b class="k">$1</b>'))).join("");
    if (com) out += '<b class="c">' + esc(com) + "</b>";
    return out;
  }
  function render(lines, n, cursor) {
    // n = number of characters typed overall; every line becomes a numbered row
    let left = n;
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      let h = color(L.slice(0, Math.max(0, left)));
      left -= L.length + 1;
      const active = left < 0;
      if (active && cursor) h += '<span class="cur"></span>';
      rows.push('<span class="l">' + h + "</span>");
      if (active) break;
    }
    pre.innerHTML = rows.join("");
  }
  const LANGS = { js: "JavaScript", py: "Python", sql: "SQL", php: "PHP" };
  const statusEl = document.getElementById("ccStatus");
  const langEl = document.getElementById("ccLang");
  const prog = document.getElementById("ccProg");
  function setStatus(done, pct) {
    if (statusEl) statusEl.textContent = done ? "✔ " + I18N.pick("compiled", "compilato") : I18N.pick("writing…", "scrittura…");
    if (prog) prog.style.width = (pct * 100).toFixed(1) + "%";
  }

  let idx = 0, timer = null, visible = false, runId = 0;

  function total(lines) { return lines.reduce((a, l) => a + l.length + 1, 0); }

  function run() {
    const my = ++runId;
    clearTimeout(timer);
    const snip = SNIPPETS[idx % SNIPPETS.length];
    const lines = snip.lines();
    fileEl.textContent = snip.file;
    if (langEl) langEl.textContent = LANGS[snip.file.split(".").pop()] || "";
    const max = total(lines);
    if (reduce) { render(lines, max, false); setStatus(true, 1); return; }
    let n = 0;
    (function tick() {
      if (my !== runId) return;
      if (!visible || document.hidden) { timer = setTimeout(tick, 400); return; }
      n += 1;
      render(lines, n, true);
      setStatus(n >= max, n / max);
      if (n < max) {
        const ch = lines.join("\n")[n - 1];
        timer = setTimeout(tick, ch === "\n" ? 140 : 28 + Math.random() * 40);
      } else {
        // finished: blink the cursor for a while, then next program
        timer = setTimeout(() => { idx++; run(); }, 3800);
      }
    })();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.2 }).observe(pre);
  } else { visible = true; }
  window.addEventListener("langchange", run);
  run();
})();
