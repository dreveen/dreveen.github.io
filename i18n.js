// English (default) / Italian switch.
// Static text is translated by matching exact strings; dynamic text (games, phone, quotes)
// uses I18N.pick(en, it) / I18N.set(el, en, it) and re-renders on the "langchange" event.
window.I18N = (function () {
  const KEY = "dreveen-lang";
  const IT = {
    // navigation
    "Menu": "Menu", "Close": "Chiudi", "Home": "Home", "About": "Chi sono", "Projects": "Progetti",
    "Games": "Giochi", "Contacts": "Contatti", "Skip": "Salta",
    // home
    "Computer Engineer & Software Developer": "Ingegnere Informatico e Sviluppatore Software",
    "Building digital solutions through software, technology and innovation.": "Creo soluzioni digitali attraverso software, tecnologia e innovazione.",
    "About me": "Chi sono", "Scroll": "Scorri", "Approach": "Approccio",
    "Studying": "Studio", "Computer Engineering": "Ingegneria Informatica", "University": "Università",
    "Based in": "Vivo in", "Italy": "Italia", "Skills": "Competenze", "Java, Python, PHP & more": "Java, Python, PHP e altro",
    "Explore": "Esplora",
    "From idea to code, with care for every detail.": "Dall'idea al codice, con cura per ogni dettaglio.",
    "Who I am and where I'm heading": "Chi sono e dove sto andando",
    "Selected work and experiments": "Lavori selezionati ed esperimenti",
    "Snake, Hangman, Memory and Cat Jump": "Snake, Impiccato, Memory e Cat Jump",
    "Let's get in touch": "Mettiamoci in contatto",
    // about
    "Computer": "Ingegnere", "Engineer": "informatico", "& Software Developer": "& Sviluppatore software",
    "Profile": "Profilo",
    "I'm Denise Guadagnuolo, a Computer Engineering student with a strong curiosity for software development, web applications and digital technologies.":
      "Sono Denise Guadagnuolo, studentessa di Ingegneria Informatica con una forte curiosità per lo sviluppo software, le applicazioni web e le tecnologie digitali.",
    "My path began with the desire to understand how ideas become concrete solutions through code. Every project is an opportunity to learn, experiment and sharpen my technical skills.":
      "Il mio percorso è iniziato dal desiderio di capire come le idee diventano soluzioni concrete attraverso il codice. Ogni progetto è un'occasione per imparare, sperimentare e affinare le mie competenze tecniche.",
    "I'm currently deepening my knowledge of web development, backend programming, database management and the technologies behind modern, efficient and scalable applications.":
      "Sto approfondendo lo sviluppo web, la programmazione backend, la gestione dei database e le tecnologie alla base di applicazioni moderne, efficienti e scalabili.",
    "02 — Skills": "02 — Competenze", "My": "Il mio", "& more ↗": "e altro ↗",
    "And more: see my LinkedIn profile": "E altro: guarda il mio profilo LinkedIn",
    "03 — Philosophy": "03 — Filosofia", "Technology,": "Tecnologia,", "creativity": "creatività", "and constant growth": "e crescita costante",
    "I believe computer science is a balance between logic and creativity: writing code is not only about solving problems, but about designing tools that simplify processes and improve people's experience.":
      "Credo che l'informatica sia un equilibrio tra logica e creatività: scrivere codice non significa solo risolvere problemi, ma progettare strumenti che semplificano i processi e migliorano l'esperienza delle persone.",
    "Through Dreveen I gather my journey in technology, from personal projects to development experiences, with the goal of building a solid professional identity as a computer engineer.":
      "Con Dreveen raccolgo il mio percorso nella tecnologia, dai progetti personali alle esperienze di sviluppo, con l'obiettivo di costruire una solida identità professionale come ingegnere informatico.",
    // projects
    "Selected": "Lavori", "work": "selezionati",
    "I'm currently building my projects portfolio. Until then, you can explore my code and experiments on GitHub.":
      "Sto costruendo il mio portfolio di progetti. Nel frattempo puoi esplorare il mio codice e i miei esperimenti su GitHub.",
    "Visit GitHub": "Vai su GitHub", "More projects coming soon": "Altri progetti in arrivo",
    // contacts
    "Let's get": "Mettiamoci", "in touch": "in contatto",
    "Find me on these platforms. I'm always happy to talk about code, ideas and new projects.":
      "Trovami su queste piattaforme. Parlo sempre volentieri di codice, idee e nuovi progetti.",
    "Phone": "Telefono", "Call Denise": "Chiama Denise",
    "Phone (not available, please use email)": "Telefono (non disponibile, usa l'email)",
    // games page
    "Play": "Gioca", "Game": "Sala", "room": "giochi",
    "A few small things I built for fun. Pick one and play.": "Qualche piccolo gioco che ho creato per divertimento. Scegline uno e gioca.",
    "Choose a game": "Scegli un gioco",
    "Hangman": "Impiccato", "Arrow keys or swipe": "Frecce o swipe", "Guess the word": "Indovina la parola",
    "Find the pairs": "Trova le coppie", "Tap to jump": "Tocca per saltare",
    "Choose a game above and it opens right here.": "Scegli un gioco qui sopra e si apre proprio qui.",
    "Use the arrow keys, or swipe on touch screens. Eat the apples, avoid the walls and yourself.":
      "Usa le frecce, oppure scorri con il dito sui touch screen. Mangia le mele, evita i muri e te stesso.",
    "Score": "Punteggio", "Best": "Record", "Start": "Avvia", "Snake game board": "Area di gioco di Snake",
    "Direction controls": "Controlli di direzione", "Up": "Su", "Down": "Giù", "Left": "Sinistra", "Right": "Destra",
    "Guess the word before the drawing is complete. Click the board and type, or use the keys below.":
      "Indovina la parola prima che il disegno sia completo. Clicca sull'area di gioco e scrivi, oppure usa i tasti qui sotto.",
    "Mistakes": "Errori", "/ 6 Streak": "/ 6 Serie", "New word": "Nuova parola",
    "Flip two cards at a time and find all the matching pairs in as few moves as you can.":
      "Gira due carte alla volta e trova tutte le coppie con meno mosse possibile.",
    "Moves": "Mosse", "New game": "Nuova partita",
    "A cat, a moonlit night and puddles, thorny weeds and rocks. Tap the board or press Space to jump over them.":
      "Un gatto, una notte di luna, pozzanghere, erbacce spinose e sassi. Tocca l'area di gioco o premi Spazio per saltarli.",
    "Cat Jump game board": "Area di gioco di Cat Jump",
    // page titles
    "About | Dreveen": "Chi sono | Dreveen", "Projects | Dreveen": "Progetti | Dreveen",
    "Contacts | Dreveen": "Contatti | Dreveen", "Games | Dreveen": "Giochi | Dreveen",
  };

  // quotes, game lines, icon names: looked up by I18N.t() at display time
  const MORE = {
    "Make it work, then make it beautiful.": "Fallo funzionare, poi fallo diventare bellissimo.",
    "Small steps, every single day.": "Piccoli passi, ogni singolo giorno.",
    "Curiosity compiles everything.": "La curiosità compila tutto.",
    "Debug your doubts.": "Fai il debug dei tuoi dubbi.",
    "Elegant code, fearless mind.": "Codice elegante, mente senza paura.",
    "Dream in logic, build in colour.": "Sogna con la logica, costruisci a colori.",
    "Every expert once wrote hello world.": "Anche i migliori hanno iniziato con un hello world.",
    "Progress is a loop with no exit condition.": "Il progresso è un ciclo senza condizione di uscita.",
    "Fail fast, learn faster.": "Sbaglia in fretta, impara ancora più in fretta.",
    "Bloom where you compile.": "Fiorisci dove compili.",
    "Stay curious, stay unstoppable.": "Coltiva la curiosità, sii inarrestabile.",
    "Compile courage, run confidence.": "Compila il coraggio, esegui la sicurezza.",
    "Meow-velous!": "Meow-ravigliosa!", "Paws up!": "Zampe in su!", "Cat-apult!": "Gattapulta!",
    "I meant to do that.": "Volevo farlo apposta.", "Purr-fect!": "Purr-fect!", "Not today, puddle!": "Oggi no, pozzanghera!",
    "Fur real?": "Pelo e contropelo!", "Nine lives, nine jumps.": "Nove vite, nove salti.", "Look ma, dry paws!": "Guarda mamma, zampe asciutte!",
    "Whisker me away!": "Baffi al vento!", "Hiss-terical!": "Iss-terica!", "Zoom zoom!": "Zoom zoom!", "Elegance, darling.": "Eleganza, tesoro.",
    "I'm not wet, I'm moisturized.": "Non sono bagnato, sono idratato.", "Dignity: lost.": "Dignità: persa.",
    "Meow-ch, my paws!": "Miao-uch, le mie zampe!", "That was on purpose.": "L'ho fatto apposta.",
    "Towel, please.": "Un asciugamano, per favore.", "Cats and water: still a bad idea.": "Gatti e acqua: ancora una pessima idea.",
    "That rock came out of nowhere.": "Quel sasso è spuntato dal nulla.", "Was that a plant? Rude.": "Era una pianta? Maleducata.",
    "I'm calling it a nap.": "Lo chiamo un pisolino.", "Bonk! Zero stars.": "Bonk! Zero stelle.",
    "The plant started it.": "È stata la pianta a cominciare.", "Smooth. Very smooth.": "Liscia. Molto liscia.", "Thorns? Really?": "Spine? Davvero?",
    "Sss-orry, not today!": "Ssscusa, oggi no!", "That snake did not come to play.": "Quel serpente non voleva giocare.",
    "Rose": "Rosa", "Moon": "Luna", "Sparkle": "Scintilla", "Gem": "Gemma", "Crown": "Corona", "Key": "Chiave", "Hourglass": "Clessidra", "Ring": "Anello",
  };
  Object.keys(MORE).forEach((k) => { IT[k] = MORE[k]; });

  const norm = (s) => s.replace(/\s+/g, " ").trim();
  let lang = "en";
  try {
    const q = new URLSearchParams(location.search).get("lang");
    lang = q === "it" || q === "en" ? q : localStorage.getItem(KEY) === "it" ? "it" : "en";
  } catch (e) {}

  function t(en) { return lang === "it" && IT[en] !== undefined ? IT[en] : en; }
  function pick(en, it) { return lang === "it" ? it : en; }
  function set(el, en, it) {
    el.dataset.en = en;
    el.dataset.it = it === undefined ? (IT[en] !== undefined ? IT[en] : en) : it;
    el.textContent = lang === "it" ? el.dataset.it : en;
  }

  // ----- static DOM translation -----
  const originals = new WeakMap(); // text node -> original English
  const attrOriginals = new WeakMap(); // element -> { attr: english }
  const SKIP = "script, style, noscript, canvas, svg, .lang, [data-no-i18n], [data-en], #statement, #quote, #hm-word, #hm-keys, .mem-board, .hm-meaning, #hm-status, #mem-status, #phoneNote";

  function walk(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => {
      if (!originals.has(n)) { if (!norm(n.nodeValue)) return; originals.set(n, n.nodeValue); }
      const orig = originals.get(n);
      const key = norm(orig);
      const lead = orig.match(/^\s*/)[0];
      const trail = orig.match(/\s*$/)[0];
      n.nodeValue = lang === "it" && IT[key] !== undefined ? lead + IT[key] + trail : orig;
    });
    root.querySelectorAll("[aria-label], [title]").forEach((el) => {
      if (el.closest(".lang, [data-en]")) return;
      let rec = attrOriginals.get(el);
      if (!rec) { rec = {}; ["aria-label", "title"].forEach((a) => { if (el.hasAttribute(a)) rec[a] = el.getAttribute(a); }); attrOriginals.set(el, rec); }
      Object.keys(rec).forEach((a) => { el.setAttribute(a, lang === "it" && IT[rec[a]] !== undefined ? IT[rec[a]] : rec[a]); });
    });
  }

  const titleEn = document.title;
  const descEl = document.querySelector('meta[name="description"]');
  const descEn = descEl ? descEl.content : "";

  function apply() {
    document.documentElement.lang = lang;
    walk(document.body);
    document.title = lang === "it" && IT[titleEn] !== undefined ? IT[titleEn] : titleEn;
    document.querySelectorAll("[data-en]").forEach((el) => { el.textContent = lang === "it" ? el.dataset.it : el.dataset.en; });
    document.querySelectorAll(".lang").forEach((b) => {
      b.setAttribute("aria-label", lang === "it" ? "Lingua: italiano. Passa all'inglese" : "Language: English. Switch to Italian");
      b.querySelectorAll("[data-l]").forEach((s) => s.classList.toggle("on", s.dataset.l === lang));
    });
    window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  function setLang(l) {
    lang = l === "it" ? "it" : "en";
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lang").forEach((b) => b.addEventListener("click", () => setLang(lang === "it" ? "en" : "it")));
    apply();
  });

  return { get lang() { return lang; }, t: t, pick: pick, set: set, setLang: setLang };
})();
