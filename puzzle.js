// Van Gogh Puzzle - piece by piece. Drag (or tap) two tiles to swap them until the painting is whole.
(function () {
  const root = document.getElementById("puzzle");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const boardEl = $("pzBoard"), wrap = $("pzWrap"), timeEl = $("pzTime"), movesEl = $("pzMoves"), bestEl = $("pzBest");
  const prevImg = $("pzPreviewImg"), winEl = $("pzWin"), topEl = $("pzTop"), topTitle = $("pzTopTitle");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pick = (en, it) => (window.I18N ? I18N.pick(en, it) : en);

  const PAINTINGS = [
    { src: "starry-night.jpg", en: "The Starry Night", it: "Notte stellata", year: 1889 },
    { src: "puzzle/sunflowers.jpg", en: "Sunflowers", it: "I girasoli", year: 1888 },
    { src: "puzzle/cafe.jpg", en: "Café Terrace at Night", it: "Terrazza del caffè di notte", year: 1888 },
    { src: "puzzle/irises.jpg", en: "Irises", it: "Gli iris", year: 1889 },
    { src: "puzzle/almond.jpg", en: "Almond Blossom", it: "Mandorlo in fiore", year: 1890 },
    { src: "puzzle/bedroom.jpg", en: "The Bedroom", it: "La camera da letto", year: 1888 },
  ];
  const LEVELS = [{ n: 3, en: "Easy", it: "Facile" }, { n: 5, en: "Medium", it: "Media" }, { n: 7, en: "Hard", it: "Difficile" }];

  // 26 things about Van Gogh: her ten qualities (rewritten, #10 as she wrote it), one story for each painting of the puzzle (p = painting) and ten documented facts
  const FACTS = [
    { ti: "Sensibilità profonda", te: "Deep sensitivity", it: "Van Gogh sentiva il mondo senza filtri. Nelle sue lettere descrive un colore come si descrive un'emozione, e una sera di campagna come un'esperienza dell'anima: per lui guardare non era un gesto passivo, ma un modo di toccare la vita.", en: "Van Gogh felt the world without filters. In his letters he describes a colour the way one describes an emotion, and an evening in the countryside as an experience of the soul: for him, looking was never passive, but a way of touching life." },
    { ti: "Amore per la bellezza delle piccole cose", te: "Love for the beauty of small things", it: "Van Gogh sapeva trovare meraviglia dove gli altri non guardavano più: in un campo di grano, in un fiore, in un cielo stellato, nei gesti semplici di ogni giorno. Per lui la bellezza non andava cercata lontano: abitava già la quotidianità, e bastava imparare a vederla.", en: "Van Gogh could find wonder where others no longer looked: in a wheat field, a flower, a starry sky, the simple gestures of every day. For him beauty was not to be sought far away: it already lived in ordinary life, and it was enough to learn to see it." },
    { ti: "Autenticità", te: "Authenticity", it: "Non dipinse ciò che il suo tempo si aspettava. Scelse un linguaggio imperfetto ma suo, fatto di pennellate spesse e di colori puri, invece di una perfezione che non gli somigliava. Oggi è proprio quella voce inconfondibile a emozionarci.", en: "He did not paint what his time expected. He chose a language that was imperfect but his own, made of thick brushstrokes and pure colours, rather than a perfection that did not resemble him. Today it is that unmistakable voice that moves us." },
    { ti: "Passione", te: "Passion", it: "Decise di diventare artista a ventisette anni e morì a trentasette. In circa dieci anni realizzò più di duemila opere, tra cui oltre ottocento dipinti a olio: per lui l'arte non era un mestiere, era il modo di respirare.", en: "He decided to become an artist at twenty-seven and died at thirty-seven. In about ten years he made more than two thousand works, including over eight hundred oil paintings: for him art was not a trade, it was a way of breathing." },
    { ti: "Perseveranza", te: "Perseverance", it: "In vita Van Gogh conobbe poco successo e molte difficoltà, e visse grazie al sostegno del fratello Theo. Eppure non smise mai di studiare, di sperimentare e di ricominciare da capo: non aspettava di essere riconosciuto per andare avanti. La sua perseveranza non era ostinazione, era fedeltà alla propria strada, anche quando nessuno sembrava vederla.", en: "In his lifetime Van Gogh knew little success and many hardships, and he lived thanks to the support of his brother Theo. Yet he never stopped studying, experimenting and starting over: he did not wait to be recognised before carrying on. His perseverance was not stubbornness, it was faithfulness to his own path, even when no one seemed able to see it." },
    { ti: "Empatia e umanità", te: "Empathy and humanity", it: "Van Gogh guardava le persone con una tenerezza rara. Prima di dedicarsi alla pittura voleva aiutare chi soffriva, e visse tra i minatori del Borinage, condividendone la povertà. Dipinse contadini, tessitori e lavoratori senza abbellirli e senza compatirli, con rispetto: ne I mangiatori di patate volle mostrare le mani che lavorano la terra e il cibo guadagnato con la fatica. Per lui la dignità di una persona non dipendeva dalla posizione sociale, ma dal modo in cui vive la propria umanità.", en: "Van Gogh looked at people with a rare tenderness. Before turning to painting he wanted to help those who suffered, and he lived among the miners of the Borinage, sharing their poverty. He painted peasants, weavers and workers without embellishing them and without pitying them, with respect: in The Potato Eaters he wanted to show the hands that work the land and the food earned through effort. For him a person's dignity did not depend on social standing, but on the way they live their own humanity." },
    { ti: "Ricerca della luce", te: "The search for light", it: "Nei periodi più bui scrisse che la vista delle stelle lo faceva sempre sognare. La luce, per lui, non era solo luce: era speranza, calore, la promessa che si può ritrovare la meraviglia anche dopo la notte più lunga.", en: "In his darkest periods he wrote that the sight of the stars always made him dream. Light, for him, was never only light: it was hope, warmth, the promise that wonder can be found again even after the longest night." },
    { ti: "Immaginazione", te: "Imagination", it: "Van Gogh non dipingeva il mondo com'era, ma com'era dentro di lui. Partiva da ciò che vedeva, un cielo, un campo, una stanza, e lo trasformava con la sua immaginazione: le stelle diventano vortici, un cipresso una fiamma. Per questo i suoi quadri non mostrano soltanto un luogo, ma ciò che quel luogo gli faceva provare.", en: "Van Gogh did not paint the world as it was, but as it was inside him. He started from what he saw, a sky, a field, a room, and transformed it with his imagination: stars become whirlpools, a cypress a flame. That is why his paintings do not only show a place, but what that place made him feel." },
    { ti: "Il coraggio di essere diverso", te: "The courage to be different", it: "Mentre l'arte ufficiale del suo tempo cercava la finezza, Van Gogh scelse un linguaggio tutto suo: pennellate spesse, colori puri, forme che vibrano. Non si adattò alle convenzioni, anche se questo significava non essere capito. Ci vuole coraggio per restare se stessi senza l'approvazione degli altri, ed è proprio questo coraggio a rendere unici i suoi quadri ancora oggi.", en: "While the official art of his time sought refinement, Van Gogh chose a language entirely his own: thick brushstrokes, pure colours, forms that vibrate. He did not adapt to conventions, even if that meant not being understood. It takes courage to remain oneself without the approval of others, and it is exactly this courage that makes his paintings unique still today." },
    { ti: "Amore per la vita", te: "Love of life", it: "Nonostante le sue sofferenze, conservò una straordinaria capacità di meravigliarsi davanti alla bellezza del mondo.", en: "Despite his suffering, he kept an extraordinary ability to marvel at the beauty of the world." },

    { ti: "La notte stellata", te: "The Starry Night", p: 0, it: "Van Gogh la dipinse nel giugno del 1889, ispirandosi alla vista dalla finestra della sua stanza nell'ospedale di Saint-Rémy, dove era ricoverato. Ma non è un paesaggio reale: il villaggio da quella finestra non si vedeva, il campanile ricorda quelli dell'Olanda dove era nato, e il cipresso, così alto e vicino, era in realtà molto più lontano. Anche i vortici del cielo somigliano alle nebulose, le nuvole di polvere e gas che gli astronomi del suo tempo avevano osservato. Van Gogh unì ciò che vedeva, ciò che ricordava e ciò che sentiva, e ne fece un cielo che non mostra una notte, ma l'emozione di guardarla.", en: "Van Gogh painted it in June 1889, inspired by the view from the window of his room in the Saint-Rémy hospital, where he was a patient. But it is not a real landscape: the village could not be seen from that window, the steeple recalls those of the Netherlands where he was born, and the cypress, so tall and so close, was in reality much farther away. Even the swirls of the sky resemble nebulae, the clouds of dust and gas that astronomers of his time had observed. Van Gogh combined what he saw, what he remembered and what he felt, and made a sky that does not show a night, but the emotion of looking at it." },
    { ti: "I girasoli", te: "Sunflowers", p: 1, it: "Dipinse i girasoli ad Arles, nell'estate del 1888, per decorare la stanza di Paul Gauguin, che stava per raggiungerlo nella Casa Gialla. Voleva accoglierlo con la luce: il giallo era, per lui, il colore del sole e dell'amicizia. Ma questi fiori dicono anche di più: dietro c'è il sogno di creare una casa per artisti nel Sud, un luogo dove non sentirsi più solo. Sono un gesto di ospitalità e di speranza, l'attesa di un amico dipinta con tutto il calore che aveva.", en: "He painted the sunflowers in Arles, in the summer of 1888, to decorate the room of Paul Gauguin, who was about to join him in the Yellow House. He wanted to welcome him with light: yellow was, for him, the colour of the sun and of friendship. But these flowers say even more: behind them lies the dream of creating a home for artists in the South, a place where he would no longer feel alone. They are a gesture of hospitality and hope, the waiting for a friend painted with all the warmth he had." },
    { ti: "Terrazza del caffè di notte", te: "Café Terrace at Night", p: 2, it: "Nel settembre del 1888 dipinse una terrazza di Arles all'aperto, di notte, sotto un cielo blu pieno di stelle. In una lettera alla sorella Willemien scrisse che era un quadro di notte «senza nero»: le ombre sono fatte di blu, di viola e di verde. La scena è anche una carezza: una macchia di luce gialla e calda in mezzo al blu profondo, un luogo dove le persone stanno insieme. Van Gogh, che conosceva bene la solitudine, negli stessi giorni scriveva che la notte gli sembrava più viva e più ricca di colori del giorno: un caffè illuminato era un piccolo rifugio di compagnia dentro il buio.", en: "In September 1888 he painted a café terrace in Arles outdoors, at night, under a blue sky full of stars. In a letter to his sister Willemien he wrote that it was a night painting \"without black\": the shadows are made of blue, violet and green. The scene is also a caress: a patch of warm yellow light in the middle of deep blue, a place where people sit together. Van Gogh, who knew loneliness well, was writing in those same days that the night seemed to him more alive and more richly coloured than the day: a lit café was a small refuge of company inside the dark." },
    { ti: "Gli iris", te: "Irises", p: 3, it: "Dipinse gli iris nel maggio del 1889, nel giardino dell'ospedale di Saint-Rémy, poche settimane dopo il ricovero. Il taglio audace e i contorni netti ricordano le stampe giapponesi che amava. Nel momento di maggior fragilità, scelse di guardare un fiore. Questo quadro racconta una forma di resistenza silenziosa: in un luogo di cura, lontano da tutto, Van Gogh trovò un'esplosione di vita e di colore. Le foglie che ondeggiano e i petali blu non parlano di dolore, ma di una bellezza che insiste, anche dove tutto sembra fermo.", en: "He painted the irises in May 1889, in the garden of the Saint-Rémy hospital, just weeks after being admitted. The bold framing and sharp outlines recall the Japanese prints he loved. At his most fragile moment, he chose to look at a flower. This painting tells of a quiet form of resistance: in a place of care, far from everything, Van Gogh found an outburst of life and colour. The swaying leaves and the blue petals do not speak of pain, but of a beauty that insists, even where everything seems still." },
    { ti: "Mandorlo in fiore", te: "Almond Blossom", p: 4, it: "Lo dipinse nel febbraio del 1890 per la nascita di suo nipote, il figlio di Theo, a cui fu dato il suo stesso nome: Vincent Willem. I rami che fioriscono contro il cielo sono un augurio di vita nuova. È forse il suo quadro più tenero: i fiori di mandorlo sono i primi a sbocciare, quando l'inverno non è ancora finito, e Van Gogh, che non ebbe figli, li dipinse come un abbraccio per quel bambino. In un periodo difficile, scelse di regalare speranza.", en: "He painted it in February 1890 for the birth of his nephew, Theo's son, who was given his own name: Vincent Willem. The branches blossoming against the sky are a wish for new life. It is perhaps his most tender painting: almond trees are the first to bloom, when winter is not yet over, and Van Gogh, who had no children, painted them as an embrace for that child. In a difficult time, he chose to give hope." },
    { ti: "La camera da letto", te: "The Bedroom", p: 5, it: "Ne dipinse tre versioni, nella Casa Gialla di Arles, nel 1888. Voleva che i colori semplici suggerissero riposo e sonno: in una lettera a Theo spiegò che guardare quel quadro doveva riposare la mente, o meglio l'immaginazione. Le pareti oggi sembrano azzurre, ma in origine erano viola: i pigmenti si sono alterati nel tempo. È un autoritratto senza persone: una stanza semplice, con un letto, due sedie e pochi quadri, che racconta il suo desiderio di avere finalmente una casa, un luogo sicuro dove fermarsi e riposare.", en: "He painted three versions, in the Yellow House in Arles, in 1888. He wanted the simple colours to suggest rest and sleep: in a letter to Theo he explained that looking at the painting should rest the mind, or rather the imagination. The walls now look blue, but they were originally purple: the pigments have changed over time. It is a self-portrait without people: a simple room, with a bed, two chairs and a few pictures, which tells of his wish to finally have a home, a safe place to stop and rest." },

    { ti: "Una strada lunga per arrivare all'arte", te: "A long road to art", it: "Prima di dipingere fu commesso in una galleria d'arte, insegnante, libraio e predicatore. Ogni strada lo riportava alle stesse domande: come si guarda la vita, e come si può dare qualcosa agli altri.", en: "Before painting he worked in an art gallery, taught, sold books and preached. Every road brought him back to the same questions: how to look at life, and how to give something to others." },
    { ti: "Imparare da solo", te: "Teaching himself", it: "Quasi da autodidatta, copiò per anni le stampe di Millet e il Corso di disegno di Charles Bargue, ripetendo gli stessi esercizi finché non lo convincevano. Il suo stile libero nasce da una disciplina paziente.", en: "Almost self-taught, he copied for years the prints of Millet and Charles Bargue's Drawing Course, repeating the same exercises until they satisfied him. His free style was born from patient discipline." },
    { ti: "Parigi accende i colori", te: "Paris lights up the colours", it: "Dal 1886 al 1888 visse a Parigi con Theo e incontrò gli impressionisti. La sua tavolozza, scura e terrosa come ne I mangiatori di patate, si schiarì: da lì in poi il colore diventò il suo modo di parlare.", en: "From 1886 to 1888 he lived in Paris with Theo and met the Impressionists. His palette, dark and earthy as in The Potato Eaters, grew lighter: from then on colour became his way of speaking." },
    { ti: "Il Giappone nel cuore", te: "Japan in his heart", it: "Raccolse una collezione di circa 660 stampe giapponesi e ne copiò alcune, rendendo i colori ancora più intensi. Da quelle stampe imparò i contorni netti, i tagli audaci e le superfici piatte che riconosciamo nei suoi quadri.", en: "He gathered a collection of about 660 Japanese prints and copied some of them, making the colours even more intense. From those prints he learned the sharp outlines, bold framing and flat surfaces we recognise in his paintings." },
    { ti: "Colori che vibrano", te: "Colours that vibrate", it: "Accostava colori complementari, come il blu e l'arancio, il rosso e il verde, il giallo e il viola, perché ciascuno facesse brillare l'altro. È il segreto dei suoi cieli che sembrano muoversi.", en: "He set complementary colours side by side, such as blue and orange, red and green, yellow and violet, so that each made the other shine. It is the secret of his skies that seem to move." },
    { ti: "Una vita in lettere", te: "A life in letters", it: "Scrisse più di ottocento lettere, quasi tutte al fratello Theo, spesso accompagnate da piccoli schizzi dei quadri a cui stava lavorando. Grazie a loro non conosciamo solo le sue opere, ma i suoi pensieri.", en: "He wrote more than eight hundred letters, almost all to his brother Theo, often accompanied by small sketches of the paintings he was working on. Thanks to them we know not only his works, but his thoughts." },
    { ti: "Theo e Jo", te: "Theo and Jo", it: "Theo lo sostenne per tutta la vita e morì pochi mesi dopo di lui. Sua moglie Jo van Gogh-Bonger si prese cura dei quadri e delle stampe di Vincent e si dedicò a farli conoscere: senza di lei, il suo mondo forse non sarebbe arrivato a noi.", en: "Theo supported him throughout his life and died only a few months after him. Theo's wife, Jo van Gogh-Bonger, took care of Vincent's paintings and prints and devoted herself to making them known: without her, his world might never have reached us." },
    { ti: "Un museo per lui", te: "A museum for him", it: "Il Museo Van Gogh di Amsterdam conserva più di duecento suoi dipinti, circa cinquecento disegni e quasi tutte le sue lettere: è la più grande raccolta al mondo delle sue opere.", en: "The Van Gogh Museum in Amsterdam holds more than two hundred of his paintings, about five hundred drawings and almost all of his letters: it is the largest collection of his work in the world." },
    { ti: "Un lettore appassionato", te: "A passionate reader", it: "Leggeva moltissimo: Dickens, Zola, Hugo, Daudet. Gli studiosi delle lettere collegano il suo pensiero sulle stelle a un racconto di Alphonse Daudet, Le stelle: per lui libri e quadri parlavano la stessa lingua.", en: "He read a great deal: Dickens, Zola, Hugo, Daudet. The scholars of his letters link his thought about the stars to a story by Alphonse Daudet, The Stars: for him books and paintings spoke the same language." },
    { ti: "Un ritratto da record", te: "A record portrait", it: "Nel 1990 il Ritratto del dottor Gachet fu venduto per 82,5 milioni di dollari, allora un record. Lo stesso Van Gogh, in vita, faticò a vendere i suoi quadri.", en: "In 1990 the Portrait of Dr Gachet was sold for 82.5 million dollars, a record at the time. In his lifetime, Van Gogh himself struggled to sell his paintings." },
  ];

  const S = { paint: 0, level: 0, slots: [], n: 3, moves: 0, started: false, done: false, elapsed: 0, t0: 0, running: false, ratio: 1.26, tw: 0, th: 0, pieces: [], selected: -1, ready: false };
  const SKEY = "dreveen-puzzle-scores";
  let scores = [];
  try { scores = JSON.parse(localStorage.getItem(SKEY)) || []; } catch (e) { scores = []; }
  const saveScores = () => { try { localStorage.setItem(SKEY, JSON.stringify(scores)); } catch (e) {} };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  // ---------- timer ----------
  let tick = null;
  function now() { return S.elapsed + (S.running ? performance.now() - S.t0 : 0); }
  function startTimer() { if (S.running || S.done) return; S.running = true; S.t0 = performance.now(); tick = setInterval(() => { timeEl.textContent = fmt(now()); }, 250); }
  function pauseTimer() { if (!S.running) return; S.elapsed += performance.now() - S.t0; S.running = false; clearInterval(tick); }
  document.addEventListener("gamehide", pauseTimer);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseTimer(); });

  // ---------- geometry ----------
  function size() {
    const maxW = Math.max(220, wrap.clientWidth || 320);
    const maxH = Math.max(280, window.innerHeight * 0.72);
    const w = Math.min(maxW, maxH * S.ratio);
    return { w: Math.floor(w), h: Math.floor(w / S.ratio) };
  }
  function layout(animate) {
    if (!S.ready) return;
    const { w, h } = size(), n = S.n;
    boardEl.style.width = w + "px"; boardEl.style.height = h + "px";
    S.tw = w / n; S.th = h / n;
    const src = PAINTINGS[S.paint].src;
    S.pieces.forEach((el, id) => {
      const col = id % n, row = Math.floor(id / n);
      el.style.width = S.tw + "px"; el.style.height = S.th + "px";
      el.style.backgroundImage = 'url("' + src + '")';
      el.style.backgroundSize = w + "px " + h + "px";
      el.style.backgroundPosition = -col * S.tw + "px " + -row * S.th + "px";
      if (!animate) el.style.transition = "none";
      place(el, S.slots.indexOf(id));
      el.classList.toggle("ok", !S.done && S.slots.indexOf(id) === id);
      if (!animate) { void el.offsetWidth; el.style.transition = ""; }
    });
    prevImg.style.width = w + "px"; prevImg.style.height = h + "px";
  }
  function place(el, slot) {
    const n = S.n;
    el.style.transform = "translate(" + (slot % n) * S.tw + "px," + Math.floor(slot / n) * S.th + "px)";
  }

  // ---------- building a game ----------
  function build() {
    const n = LEVELS[S.level].n;
    S.n = n; S.moves = 0; S.started = false; S.done = false; S.elapsed = 0; S.running = false; S.selected = -1;
    clearInterval(tick);
    timeEl.textContent = "0:00"; movesEl.textContent = "0";
    winEl.hidden = true; boardEl.classList.remove("solved");
    boardEl.innerHTML = ""; S.pieces = [];
    for (let id = 0; id < n * n; id++) {
      const el = document.createElement("div");
      el.className = "pz-piece"; el.dataset.id = id; el.setAttribute("role", "button"); el.tabIndex = -1;
      boardEl.appendChild(el); S.pieces.push(el);
    }
    // shuffle (never already solved)
    S.slots = Array.from({ length: n * n }, (_, i) => i);
    do { for (let i = S.slots.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [S.slots[i], S.slots[j]] = [S.slots[j], S.slots[i]]; } }
    while (S.slots.every((v, i) => v === i));
    layout(false);
    renderBest();
  }
  function load(index) {
    S.paint = index; S.ready = false;
    const im = new Image();
    im.onload = () => { S.ratio = im.naturalWidth / im.naturalHeight; prevImg.src = PAINTINGS[index].src; S.ready = true; build(); };
    im.src = PAINTINGS[index].src;
    document.querySelectorAll("#pzPaintings button").forEach((b, i) => { b.classList.toggle("on", i === index); b.setAttribute("aria-pressed", i === index); });
  }

  // ---------- moves: drag a tile onto another one, or tap two tiles ----------
  function swap(a, b) {
    const t = S.slots[a]; S.slots[a] = S.slots[b]; S.slots[b] = t;
    S.moves++; movesEl.textContent = S.moves;
    startTimer(); S.started = true;
    layout(true);
    if (S.slots.every((v, i) => v === i)) solved();
  }
  let drag = null;
  boardEl.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".pz-piece");
    if (!el || S.done) return;
    e.preventDefault();
    const id = Number(el.dataset.id), slot = S.slots.indexOf(id), r = boardEl.getBoundingClientRect();
    drag = { el: el, id: id, slot: slot, x0: e.clientX, y0: e.clientY, moved: false, bx: (slot % S.n) * S.tw, by: Math.floor(slot / S.n) * S.th, r: r };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });
  boardEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; drag.el.classList.add("dragging"); }
    if (drag.moved) drag.el.style.transform = "translate(" + (drag.bx + dx) + "px," + (drag.by + dy) + "px) scale(1.04)";
  });
  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    d.el.classList.remove("dragging");
    if (!d.moved) {
      // a tap: pick the tile, then tap another to swap
      if (S.selected < 0) { S.selected = d.slot; d.el.classList.add("sel"); }
      else if (S.selected === d.slot) { S.selected = -1; d.el.classList.remove("sel"); }
      else { const from = S.selected; S.selected = -1; S.pieces.forEach((p) => p.classList.remove("sel")); swap(from, d.slot); }
      return;
    }
    S.selected = -1; S.pieces.forEach((p) => p.classList.remove("sel"));
    const cx = e.clientX - d.r.left, cy = e.clientY - d.r.top;
    const col = Math.min(S.n - 1, Math.max(0, Math.floor(cx / S.tw))), row = Math.min(S.n - 1, Math.max(0, Math.floor(cy / S.th)));
    const to = row * S.n + col;
    if (cx < 0 || cy < 0 || cx > d.r.width || cy > d.r.height || to === d.slot) { layout(true); return; }
    swap(d.slot, to);
  }
  boardEl.addEventListener("pointerup", endDrag);
  boardEl.addEventListener("pointercancel", () => { if (drag) { drag.el.classList.remove("dragging"); drag = null; layout(true); } });

  // ---------- the painting is whole ----------
  function solved() {
    S.done = true; pauseTimer();
    const t = Math.round(S.elapsed);
    timeEl.textContent = fmt(t);
    boardEl.classList.add("solved");
    S.pieces.forEach((p) => p.classList.remove("ok", "sel"));
    const prev = bestFor(S.paint, S.level), record = !prev || t < prev.t;
    scores.push({ p: S.paint, l: S.level, t: t, m: S.moves, d: Date.now() });
    scores.sort((a, b) => a.t - b.t);
    scores = scores.slice(0, 60);
    saveScores();
    winEl.hidden = false;
    renderWin(record);
    renderBest();
    if (browse) setBrowse(false);
    showFact(factForPainting()); autoFacts();
    if (!reduce) winEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function renderWin(record) {
    const p = PAINTINGS[S.paint];
    winEl.innerHTML = "";
    const h = document.createElement("p"); h.className = "pz-win-t"; h.textContent = pick("The painting is whole!", "Il quadro è completo!");
    const s = document.createElement("p"); s.className = "pz-win-s";
    s.textContent = pick(p.en, p.it) + " · " + p.year + "  —  " + fmt(S.elapsed) + "  ·  " + S.moves + " " + pick("moves", "mosse") + (record ? "  ·  " + pick("new best time!", "nuovo record!") : "");
    winEl.append(h, s);
    winEl.dataset.rec = record ? "1" : "";
  }

  // ---------- best times (kept in this browser) ----------
  function bestFor(p, l) { return scores.filter((s) => s.p === p && s.l === l).sort((a, b) => a.t - b.t)[0]; }
  function renderBest() {
    const b = bestFor(S.paint, S.level);
    bestEl.textContent = b ? fmt(b.t) : "-";
    const list = scores.filter((s) => s.p === S.paint && s.l === S.level).sort((a, b) => a.t - b.t).slice(0, 5);
    const p = PAINTINGS[S.paint];
    topTitle.textContent = pick("Best times", "Migliori tempi") + " · " + pick(p.en, p.it) + " · " + pick(LEVELS[S.level].en, LEVELS[S.level].it);
    topEl.innerHTML = "";
    if (!list.length) { const li = document.createElement("li"); li.className = "none"; li.textContent = pick("No times yet. Be the first!", "Ancora nessun tempo. Sii la prima!"); topEl.appendChild(li); return; }
    list.forEach((s) => {
      const li = document.createElement("li");
      const t = document.createElement("b"); t.textContent = fmt(s.t);
      const m = document.createElement("span"); m.textContent = s.m + " " + pick("moves", "mosse");
      li.append(t, m); topEl.appendChild(li);
    });
  }

  // ---------- facts about Van Gogh: always visible at the bottom ----------
  let fi = (Math.random() * FACTS.length) | 0, factTimer = null;
  // random, never the same one twice in a row
  const nextFact = () => { let j; do { j = (Math.random() * FACTS.length) | 0; } while (FACTS.length > 1 && j === fi); return (fi = j); };
  // finishing a painting opens the story of that very painting
  const factForPainting = () => { const i = FACTS.findIndex((f) => f.p === S.paint); return i >= 0 ? i : nextFact(); };
  let browse = false;
  function setBrowse(on) {
    browse = on;
    if (on) showFact(0); // always start from the first one
    $("pzFactNav").hidden = !on;
    $("pzFactMore").textContent = on ? pick("Close", "Chiudi") : pick("See more curiosities", "Vedi altre curiosità");
    $("pzFact").classList.toggle("browsing", on);
    if (on) clearTimeout(factTimer); else autoFacts();
  }
  function showFact(i) {
    fi = i;
    const f = FACTS[i], box = $("pzFact");
    $("pzFactNum").textContent = i + 1 + " / " + FACTS.length;
    $("pzFactTitle").textContent = pick(f.te, f.ti);
    $("pzFactText").textContent = pick(f.en, f.it);
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
  }
  // a new random curiosity every 60 to 75 seconds, so each one stays long enough to be read
  function autoFacts() {
    clearTimeout(factTimer);
    factTimer = setTimeout(function again() {
      if (browse) return;
      if (!root.hidden && !document.hidden) { showFact(nextFact()); autoFacts(); } else factTimer = setTimeout(again, 5000);
    }, 60000 + Math.random() * 15000);
  }
  $("pzFactNext").addEventListener("click", () => showFact((fi + 1) % FACTS.length));
  $("pzFactPrev").addEventListener("click", () => showFact((fi + FACTS.length - 1) % FACTS.length));
  $("pzFactMore").addEventListener("click", () => setBrowse(!browse));

  // ---------- controls ----------
  function setup() {
    const box = $("pzPaintings");
    PAINTINGS.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.style.backgroundImage = 'url("' + p.src + '")';
      b.setAttribute("aria-label", p.en); b.title = p.en;
      b.addEventListener("click", () => { if (i !== S.paint) { pauseTimer(); load(i); } });
      box.appendChild(b);
    });
    document.querySelectorAll("#pzLevels button").forEach((b, i) => b.addEventListener("click", () => {
      S.level = i; document.querySelectorAll("#pzLevels button").forEach((x, j) => x.classList.toggle("on", j === i));
      pauseTimer(); build();
    }));
    $("pzNew").addEventListener("click", () => { pauseTimer(); build(); });
    $("pzPreview").addEventListener("click", () => {
      const on = wrap.classList.toggle("peek");
      $("pzPreview").textContent = on ? pick("Hide original", "Nascondi originale") : pick("Show original", "Mostra originale");
      $("pzPreview").setAttribute("aria-pressed", on);
    });
    load(0);
    showFact(fi); setBrowse(false);
  }

  let inited = false;
  function init() { if (inited) return; inited = true; setup(); }
  function relabel() {
    if (inited) $("pzFactMore").textContent = browse ? pick("Close", "Chiudi") : pick("See more curiosities", "Vedi altre curiosità");
    $("pzPreview").textContent = wrap.classList.contains("peek") ? pick("Hide original", "Nascondi originale") : pick("Show original", "Mostra originale");
    if (!inited) return;
    renderBest(); showFact(fi);
    if (S.done) renderWin(winEl.dataset.rec === "1");
    PAINTINGS.forEach((p, i) => { const b = $("pzPaintings").children[i]; if (b) { b.title = pick(p.en, p.it); } });
  }
  window.addEventListener("langchange", () => setTimeout(relabel, 0));
  window.addEventListener("resize", () => { if (root.hidden) return; init(); layout(false); });
  document.addEventListener("gamehide", () => {});
  if (!root.hidden) init();
  relabel();
})();
