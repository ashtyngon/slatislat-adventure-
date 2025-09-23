// Слатислат Муромский: Берестяной Путь
// Простая движковая логика для текстового приключения с состоянием, журналом и сохранениями.

const $ = (sel) => document.querySelector(sel);
const logBox = $("#log");
const invList = $("#inventory");

const state = {
  year: 912,
  influence: 0,
  alliances: new Set(),
  bark: 0,
  inventory: [],
  flags: {},
  fastText: false,
  scene: "prologue"
};

const data = {
  prologue: {
    title: "Пролог: Береста и ветер Оки",
    text: "Муром. Около 912 года. Юный князь Слатислат стоит на берегу Оки, где варяжские лодьи привозят вести и товары. В руках — берестяная пластинка со знаками, что ещё не стали буквами. Настало время выбрать путь: меч, слово или союз.",
    choices: [
      { text: "Исследовать берестяную запись", hint: "Письменность и знание", effect: () => { state.bark += 1; addLog("Вы разглядели узоры и нашли ритм записи."); }, next: "scribe" },
      { text: "Собрать совет старейшин", hint: "Институции и порядок", effect: () => { state.influence += 1; addLog("Вы созвали старейшин племён у святилища."); }, next: "duma" },
      { text: "Искать союз среди соседей", hint: "Дипломатия и риск", effect: () => { addLog("Путь к соседям не близок, но шанс велик."); }, next: "embassy" }
    ]
  },
  scribe: {
    title: "Писец у князя",
    text: "При дворе вводится запись на бересте. Радогост, юный банщик и тонкий советник, замечает, что знаки можно упорядочить. Он предлагает «окский порядок» линий и точек.",
    choices: [
      { text: "Принять систему Радогоста", hint: "Сильнее письменность", effect: () => { state.bark += 2; state.influence += 1; state.flags.radogostCounsel = true; }, next: "bark_archive" },
      { text: "Сохранить старые методы", hint: "Традиция превыше всего", effect: () => { state.bark += 1; }, next: "bark_archive" }
    ]
  },
  duma: {
    title: "Прообраз думы",
    text: "Вы собираете старейшин. Они требуют равного голоса. Вы готовы поделиться властью?",
    choices: [
      { text: "Ввести совет и право вето старейшин", hint: "Легитимность", effect: () => { state.influence += 2; state.flags.veto = true; }, next: "reform_tax" },
      { text: "Оставить совет совещательным", hint: "Скорость решений", effect: () => { state.influence += 1; }, next: "reform_tax" }
    ]
  },
  embassy: {
    title: "Посольство к пяти племенам",
    text: "Муромичи, мещера, радимичи, эрзя и мордва — пять различий и пять дверей к миру. Каждый союз укрепит княжество.",
    choices: [
      { text: "Союз с муромичами", hint: "Ближние", effect: () => addAlliance("муромичи"), next: "embassy_more" },
      { text: "Союз с мещерой", hint: "Леса и реки", effect: () => addAlliance("мещера"), next: "embassy_more" },
      { text: "Союз с радимичами", hint: "Торговые пути", effect: () => addAlliance("радимичи"), next: "embassy_more" }
    ]
  },
  embassy_more: {
    title: "Расширение союза",
    text: "Первый шаг сделан. Мир крепнет с каждым договором.",
    choices: [
      { text: "Союз с эрзёй", hint: "Степная граница", effect: () => addAlliance("эрзя"), next: "embassy_final" },
      { text: "Союз с мордвой", hint: "Ремесло и металл", effect: () => addAlliance("мордва"), next: "embassy_final" },
      { text: "Вернуться двором", hint: "Пора реформ", effect: () => {}, next: "reform_tax" }
    ]
  },
  embassy_final: {
    title: "Кольцо мира",
    text: "Кольцо союзов почти замкнулось. Но каждый союз требует дара: слово, металл или заложник.",
    choices: [
      { text: "Дар слова: послать берестяные грамоты", hint: "Культура", effect: () => { state.bark += 2; }, next: "reform_tax" },
      { text: "Дар металла: отковать мечи", hint: "Военная мощь", effect: () => { state.influence += 1; }, next: "reform_tax" },
      { text: "Отказ от даров", hint: "Экономия", effect: () => { state.influence -= 1; }, next: "reform_tax" }
    ]
  },
  bark_archive: {
    title: "Берестяной архив",
    text: "Архив при дворе растёт. Появляется мысль собрать летопись — без чудес, но с фактами.",
    choices: [
      { text: "Учредить летописца", hint: "История и статус", effect: () => { state.influence += 1; state.bark += 2; state.inventory.push("Летописная доска"); }, next: "reform_tax" },
      { text: "Оставить записи частными", hint: "Гибкость", effect: () => { state.bark += 1; }, next: "reform_tax" }
    ]
  },
  reform_tax: {
    title: "Окский сбор",
    text: "Казна требует порядка. Предложение: единообразный «окский сбор». Радогост предупреждает — не перегнуть.",
    choices: [
      { text: "Ввести умеренный сбор", hint: "Равновесие", effect: () => { state.influence += 2; state.flags.taxModerate = true; }, next: "midgame" },
      { text: "Ввести высокий сбор", hint: "Быстрые ресурсы", effect: () => { state.influence += 1; state.flags.taxHigh = true; }, next: "midgame" },
      { text: "Отложить реформу", hint: "Популизм", effect: () => { state.influence -= 1; }, next: "midgame" }
    ]
  },
  midgame: {
    title: "Испытания мира",
    text: "Годы идут. Союзы крепнут, но угрозы множатся: на западе усобицы, на севере варяги требуют пошлин, на востоке слухи о новых богах.",
    choices: [
      { text: "Послать грамоту в Киев", hint: "Дипломатия шире", effect: () => { state.influence += 1; state.bark += 1; }, next: "kiev" },
      { text: "Договор с варягами", hint: "Торговля", effect: () => { state.influence += 1; }, next: "varangians" },
      { text: "Тайный совет с Радогостом", hint: "Личная связь", effect: () => { state.flags.trustRad = true; }, next: "radogost" }
    ]
  },
  kiev: {
    title: "Кий и грамота",
    text: "Послы из Киева отвечают уважительно. Интересуются вашей письменностью.",
    choices: [
      { text: "Поделиться системой записи", hint: "Культурное влияние", effect: () => { state.bark += 2; state.influence += 1; }, next: "late" },
      { text: "Сохранить секрет двора", hint: "Эксклюзивность", effect: () => { state.influence += 1; }, next: "late" }
    ]
  },
  varangians: {
    title: "Цена моря",
    text: "Варяги требуют увеличения пошлин за безопасные пути. Торг уместен.",
    choices: [
      { text: "Компромисс", hint: "Стабильность", effect: () => { state.influence += 1; }, next: "late" },
      { text: "Жёсткий отказ", hint: "Риск нападения", effect: () => { state.influence -= 1; }, next: "late" }
    ]
  },
  radogost: {
    title: "Ночной разговор",
    text: "Радогост приносит тёплый пар и тихие слова: «Сила — в том, что мы записываем, а не забываем».",
    choices: [
      { text: "Назначить Радогоста советником", hint: "Ближний круг", effect: () => { state.influence += 1; state.flags.radAdvisor = true; }, next: "late" },
      { text: "Сохранить всё как есть", hint: "Осторожность", effect: () => {}, next: "late" }
    ]
  },
  late: {
    title: "Наследие на бересте",
    text: "Подходит время подводить итоги. Мир удержан? Союзы замкнуты? Письменность жива?",
    choices: [
      { text: "Созвать великое чтение у Оки", hint: "Культурный финал", effect: () => endGame("culture") },
      { text: "Провести смотр дружины", hint: "Военный финал", effect: () => endGame("military") },
      { text: "Оставить письма Радогосту", hint: "Личный финал", effect: () => endGame("personal") }
    ]
  }
};

function addAlliance(name) {
  if (!state.alliances.has(name)) {
    state.alliances.add(name);
    state.influence += 1;
    addLog(`Заключён союз: ${name}.`);
  } else {
    addLog(`Союз с ${name} уже заключён.`);
  }
}

function addLog(text) {
  const el = document.createElement("div");
  el.textContent = `• ${text}`;
  logBox.prepend(el);
}

function renderStats() {
  $("#year").textContent = state.year;
  $("#inf").textContent = state.influence;
  $("#alliances").textContent = `${state.alliances.size}/5`;
  $("#bark").textContent = state.bark;
  invList.innerHTML = "";
  state.inventory.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    invList.appendChild(li);
  });
}

function typeText(el, text, done) {
  el.innerHTML = "";
  if (state.fastText) {
    el.textContent = text;
    if (done) done();
    return;
  }
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i++);
    if (i <= text.length) requestAnimationFrame(tick);
    else if (done) done();
  };
  tick();
}

function renderScene(key) {
  state.scene = key;
  const s = data[key];
  $("#scene-title").textContent = s.title;
  typeText($("#scene-text"), s.text);
  const choicesEl = $("#choices");
  choicesEl.innerHTML = "";
  s.choices.forEach((ch, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerHTML = `${ch.text}${ch.hint ? `<small>${ch.hint}</small>` : ""}`;
    btn.addEventListener("click", () => {
      if (ch.effect) ch.effect();
      if (ch.next) {
        if (data[ch.next]) {
          renderStats();
          saveGame();
          setTimeout(() => renderScene(ch.next), 100);
        } else {
          console.error("Unknown scene:", ch.next);
        }
      }
    });
    choicesEl.appendChild(btn);
  });
  renderStats();
  saveGame();
}

function endGame(kind) {
  // простая логика итогов
  let title = "Финал";
  let text = "";
  const alliances = state.alliances.size;
  const inf = state.influence;
  const bark = state.bark;
  if (kind === "culture") {
    if (bark >= 4) {
      title = "Финал: Берестяной Канон";
      text = "Ваши грамоты становятся образцом для соседей. В летописях вас назовут архитектором письма.";
    } else {
      title = "Финал: Слова на ветру";
      text = "Письменность была, но не стала традицией. История запомнит вас как экспериментатора.";
    }
  } else if (kind === "military") {
    if (inf >= 4 && alliances >= 3) {
      title = "Финал: Щит Оки";
      text = "Муром стоит крепко, соседи уважают вас, а дружина без дела скучает — мир удержан.";
    } else {
      title = "Финал: Дым над плёсом";
      text = "Слишком много врагов и мало рук. Мир шаток — урок в том, что союз дороже стали.";
    }
  } else if (kind === "personal") {
    if (state.flags.trustRad || state.flags.radAdvisor) {
      title = "Финал: Письмо Радогосту";
      text = "Вы оставляете берестяные письма тому, кто понимал вас с полуслова. Личная правда спасает память.";
    } else {
      title = "Финал: Тишина в парной";
      text = "Слова не сказаны, записи не завершены. Летопись оборвалась — каждый хранит свой секрет.";
    }
  }
  $("#scene-title").textContent = title;
  typeText($("#scene-text"), text);
  const choicesEl = $("#choices");
  choicesEl.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = "Сыграть снова";
  btn.addEventListener("click", () => newGame());
  choicesEl.appendChild(btn);
  renderStats();
  saveGame(true); // финальный слепок
}

function newGame() {
  Object.assign(state, {
    year: 912,
    influence: 0,
    alliances: new Set(),
    bark: 0,
    inventory: [],
    flags: {},
    scene: "prologue"
  });
  $("#log").innerHTML = "";
  addLog("Начало новой партии.");
  renderScene("prologue");
}

function saveGame(finalSnapshot=false) {
  try {
    const save = {
      year: state.year,
      influence: state.influence,
      alliances: Array.from(state.alliances),
      bark: state.bark,
      inventory: state.inventory,
      flags: state.flags,
      fastText: state.fastText,
      scene: state.scene,
      log: logBox.innerHTML,
      finalSnapshot
    };
    localStorage.setItem("slatislat_save", JSON.stringify(save));
  } catch(e) {
    console.warn("Не удалось сохранить игру:", e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("slatislat_save");
    if (!raw) return false;
    const save = JSON.parse(raw);
    state.year = save.year ?? 912;
    state.influence = save.influence ?? 0;
    state.alliances = new Set(save.alliances ?? []);
    state.bark = save.bark ?? 0;
    state.inventory = save.inventory ?? [];
    state.flags = save.flags ?? {};
    state.fastText = save.fastText ?? false;
    $("#log").innerHTML = save.log ?? "";
    renderScene(save.scene ?? "prologue");
    return true;
  } catch(e) {
    console.warn("Не удалось загрузить игру:", e);
    return false;
  }
}

function bindUI() {
  $("#btn-new").addEventListener("click", newGame);
  $("#btn-continue").addEventListener("click", () => {
    const ok = loadGame();
    if (!ok) newGame();
  });
  $("#btn-settings").addEventListener("click", () => {
    $("#settings-modal").showModal();
  });
  $("#toggle-fast").addEventListener("change", (e) => {
    state.fastText = e.target.checked;
    saveGame();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  // Автозагрузка сохранения, если существует
  if (!loadGame()) {
    newGame();
  } else {
    // синхронизировать чекбокс
    $("#toggle-fast").checked = !!state.fastText;
  }
});
