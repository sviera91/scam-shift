// Scam Shift game logic. Reads DAYS, buildRun and the case templates from cases/.
// The game is a small "state machine": we keep everything in one `state` object,
// change it when the player acts, then redraw the parts of the screen that changed.

const VIEWS = ["message", "history", "directory"];
const VERIFY_SECONDS = 30;       // cost of verifying or contacting the sender
const PUZZLE_MISS_SECONDS = 10;  // cost of a wrong mini-game answer
const PHONE_DEAD_END_SECONDS = 15;
const PHONE_INVALID_SECONDS = 5;
const LOW_TIME_SECONDS = 30;
const POINTS = { verdict: 100, wrong: -100, step: 50, stepMiss: -50 };
const START_SAVINGS = 5000;
const LEADERBOARD_KEY = "scamShift.leaderboard.v1";
const LEADERBOARD_SIZE = 10;
const MOODS = {
  worried: { label: "Worried", reaction: "Worried about what happened." },
  relieved: { label: "Relieved", reaction: "Relieved the scam was stopped." },
  happy: { label: "Happy", reaction: "Happy the real message got through." },
};
const CHANNEL_LABELS = {
  text: "💬 TEXT", email: "📧 EMAIL", voicemail: "📼 VOICEMAIL", dm: "📱 DM",
  popup: "🖥️ POP-UP", letter: "✉️ LETTER", call: "☎️ CALL",
};

const state = {
  run: [],            // the five days for this run, built from random templates
  seed: 0,
  dayIndex: 0,
  caseIndex: 0,
  view: "message",
  timeLeft: 0,        // milliseconds left in the day
  running: false,     // is the day's timer counting down?
  lastTick: 0,
  lowTimeWarned: false,
  score: 0,           // run score (what goes on the leaderboard)
  dayScore: 0,
  timeBonus: 0,
  savings: START_SAVINGS,
  bankrupt: false,    // savings hit $0: the run ends after the current lesson
  correct: 0,
  runCorrect: 0,
  runCases: 0,        // cases resolved this run, including neighbors who decided alone
  aloneCount: 0,      // neighbors who decided on their own today
  calls: {},          // which contacts were reached for the current case
  puzzle: null,       // mini-game progress for the current case (see resetPuzzle)
  stepOptions: [],    // shuffled next-step options for the current case
  notes: [],          // tips collected for the end-of-day summary
};

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) {
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

function showScreen(id) {
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

function formatTime(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const formatMoney = (n) => "$" + n.toLocaleString("en-US");
const formatPoints = (n) => (n > 0 ? "+" : "") + n;
const currentDay = () => state.run[state.dayIndex];
const currentCase = () => currentDay().cases[state.caseIndex];
const canSpend = (seconds) => state.timeLeft > seconds * 1000;
const isLastDay = () => state.dayIndex === state.run.length - 1;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function addScore(points) {
  state.score += points;
  state.dayScore += points;
  return formatPoints(points) + " pts";
}

function loseSavings(amount) {
  const before = state.savings;
  state.savings = Math.max(0, state.savings - amount);
  if (before > 0 && state.savings === 0) state.bankrupt = true;
  if (before > amount) return `The town lost ${formatMoney(amount)}.`;
  if (before > 0) return `A ${formatMoney(amount)} loss wiped out the town's last ${formatMoney(before)}.`;
  return `The ${formatMoney(amount)} loss happened after town savings had run out.`;
}

// ---------- Day timer ----------
// Runs in real time while you work a case. It pauses during debriefs, so reading
// the lesson never costs you time, and while the browser tab is hidden.
function tick() {
  if (!state.running) return;
  const now = performance.now();
  state.timeLeft -= now - state.lastTick;
  state.lastTick = now;
  renderTimer();
  if (state.timeLeft <= 0) timeUp();
}

function startTimer() {
  state.running = true;
  state.lastTick = performance.now();
  renderTimer();
}

function pauseTimer() {
  tick();
  state.running = false;
}

function spendTime(seconds) {
  state.timeLeft -= seconds * 1000;
  renderTimer();
  if (state.timeLeft <= 0) timeUp();
}

setInterval(tick, 200);

let pausedByVisibility = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running) {
    pauseTimer();
    pausedByVisibility = true;
  } else if (!document.hidden && pausedByVisibility) {
    pausedByVisibility = false;
    startTimer();
  }
});

// ---------- Rendering ----------
function renderTimer() {
  const timer = $("#hud-timer");
  timer.textContent = formatTime(state.timeLeft);
  const low = state.timeLeft <= LOW_TIME_SECONDS * 1000;
  timer.parentElement.classList.toggle("low", low);
  if (low && state.running && !state.lowTimeWarned) {
    state.lowTimeWarned = true;
    sound.effect("arrival");
  }
}

function renderHud() {
  const day = currentDay();
  $("#hud-shift").textContent = `${day.title} ${state.dayIndex + 1}/${state.run.length}`;
  renderTimer();
  $("#hud-score").textContent = state.score;
  $("#hud-savings").textContent = formatMoney(state.savings);
  $("#hud-savings").parentElement.classList.toggle("low", state.savings < START_SAVINGS * 0.3);
  $("#hud-case").textContent = `CASE ${state.caseIndex + 1}/${day.cases.length}`;
}

function makePortrait(neighbor, mood) {
  const portrait = el("div", { className: "portrait" }, [
    el("div", { className: "portrait-body" }),
    el("div", { className: "portrait-head" }),
  ]);
  portrait.dataset.neighbor = neighbor.id;
  portrait.dataset.mood = mood;
  return portrait;
}

function renderScene(c, mood = "worried") {
  const holder = $("#scene-portrait");
  const caseKey = `${state.dayIndex}:${state.caseIndex}`;
  let portrait = holder.querySelector(".portrait");
  if (!portrait || holder.dataset.caseKey !== caseKey) {
    portrait = makePortrait(c.neighbor, mood);
    holder.replaceChildren(portrait);
    holder.dataset.caseKey = caseKey;
  }
  portrait.dataset.mood = mood;
  $("#scene-name").textContent = c.neighbor.name;
  $("#scene-role").textContent = c.neighbor.role;
  $("#scene-mood").textContent = MOODS[mood].label;
  $("#scene-mood").dataset.mood = mood;
}

function renderTabs() {
  $$(".tab").forEach((tab) => {
    const active = tab.dataset.view === state.view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active);
  });
}

function callResult(text) {
  return el("div", { className: "call-result" }, "📞 " + text);
}

function costButton(label, seconds, onClick) {
  const btn = el("button", { className: "btn call", disabled: !canSpend(seconds) }, `${label} (-${seconds}s)`);
  btn.addEventListener("click", onClick);
  return btn;
}

// ---------- Mini-games ----------
// Each case can have one puzzle that unlocks a clue. On hard days the clue is the key evidence.
function resetPuzzle(c) {
  const p = c.puzzle;
  let order = [];
  if (p?.kind === "shred") {
    do order = shuffle(p.lines.map((_, i) => i));
    while (order.every((v, i) => v === i));
  }
  state.puzzle = { open: false, solved: false, feedback: "", node: p?.menu, keys: "", placed: 0, order };
}

function puzzleButton(label, onClick, className = "btn puzzle-option") {
  const btn = el("button", { className }, label);
  btn.addEventListener("click", onClick);
  return btn;
}

// "Nothing's wrong" answer for puzzles where the evidence can check out (answer -1).
const noneButton = (p, fallback) => puzzleButton(p.noneLabel || fallback, () => answerPuzzle(p.answer === -1));

function linkParts(p) {
  const url = new URL(p.url);
  const labels = url.hostname.split(".");
  const parts = [{ text: url.protocol + "//" }];
  if (url.username) parts.push({ text: decodeURIComponent(url.username), pick: true }, { text: "@" });
  labels.slice(0, -2).forEach((label) => parts.push({ text: label, pick: true }, { text: "." }));
  parts.push({ text: labels.slice(-2).join("."), pick: true, owner: true });
  url.pathname.split("/").filter(Boolean).forEach((seg) => parts.push({ text: "/" }, { text: decodeURIComponent(seg), pick: true }));
  if (url.search) parts.push({ text: url.search, pick: true });
  return parts;
}

const PUZZLES = {
  choice: (p) => [el("div", { className: "puzzle-options" },
    p.options.map((option, i) => puzzleButton(option, () => answerPuzzle(i === p.answer))))],

  spot(p) {
    const diff = [...p.shown].findIndex((ch, i) => ch !== p.record[i]);
    const grid = el("div", { className: "spot-grid" });
    grid.style.setProperty("--cols", p.record.length);
    grid.append(el("span", { className: "spot-label" }, p.recordLabel));
    [...p.record].forEach((ch) => grid.append(el("span", { className: "spot-cell" }, ch)));
    grid.append(el("span", { className: "spot-label" }, p.shownLabel));
    [...p.shown].forEach((ch, i) => grid.append(puzzleButton(ch, () => answerPuzzle(i === diff), "spot-cell spot-pick")));
    grid.querySelectorAll(".spot-pick").forEach((btn, i) => btn.setAttribute("aria-label", `Character ${i + 1}: ${btn.textContent}`));
    return [
      el("p", { className: "small" }, "Click the first character that's different, or choose THEY MATCH."),
      el("div", { className: "spot-scroll" }, grid),
      puzzleButton("THEY MATCH", () => answerPuzzle(diff === -1)),
    ];
  },

  link(p) {
    const bar = el("div", { className: "link-bar" }, linkParts(p).map((part) => part.pick
      ? puzzleButton(part.text, () => answerPuzzle(part.owner), "link-part")
      : el("span", { className: "link-sep" }, part.text)));
    return [el("p", { className: "small" }, "Click the part of the address that shows who really owns the website."), bar];
  },

  phonetree(p) {
    const pz = state.puzzle;
    const pad = el("div", { className: "keypad" }, [..."123456789*0#"].map((key) =>
      puzzleButton(key, () => pressKey(p, key), "keypad-key")));
    return [
      el("p", { className: "phone-dial" }, `📞 ${p.number}${pz.keys ? ` · pressed ${[...pz.keys].join(" ")}` : ""}`),
      el("p", { className: "phone-say" }, `"${pz.node.say}"`),
      pad,
      puzzleButton("HANG UP & REDIAL", () => redial(p), "btn redial"),
    ];
  },

  audit: (p) => [
    el("p", { className: "small" }, "Click the line that doesn't belong. Check History for what's expected."),
    el("div", { className: "audit" }, p.rows.map((row, i) => puzzleButton([
      el("span", {}, row.date), el("span", {}, row.desc), el("span", { className: "audit-amount" }, row.amount),
    ], () => answerPuzzle(i === p.answer), "audit-row"))),
    noneButton(p, "ALL CHECK OUT"),
  ],

  story: (p) => [
    el("p", { className: "small" }, "Click the line that contradicts what's on file. Press SHIFT to check History."),
    el("div", { className: "story" }, p.lines.map((line, i) => puzzleButton(`“${line}”`, () => answerPuzzle(i === p.answer), "story-line"))),
    noneButton(p, "STORY HOLDS UP"),
  ],

  shred(p) {
    const pz = state.puzzle;
    const built = el("div", { className: "shred-built" }, pz.placed
      ? p.lines.slice(0, pz.placed).map((line) => el("p", { className: "strip placed" }, line))
      : el("p", { className: "shred-empty" }, "Pick the strip that goes at the top."));
    const pile = el("div", { className: "shred-pile" }, pz.order.filter((i) => i >= pz.placed).map((i, n) => {
      const strip = puzzleButton(p.lines[i], () => placeStrip(p, i), "strip");
      strip.style.setProperty("--tilt", `${((i * 7 + n * 3) % 5) - 2}deg`);
      return strip;
    }));
    return [el("p", { className: "small" }, `Rebuild it top to bottom (${pz.placed}/${p.lines.length}).`), built, pile];
  },

  site: (p) => [
    el("p", { className: "small" }, "Compare them closely. Which one is fake?"),
    el("div", { className: "sites" }, p.sites.map((s, i) => el("div", { className: "site-card" }, [
      el("div", { className: "site-bar" }, [el("span", { className: "site-dots", ariaHidden: "true" }, "●●●"), el("span", { className: "site-url" }, s.url)]),
      el("div", { className: "site-body" }, [el("p", { className: "site-title" }, s.title), ...s.lines.map((line) => el("p", {}, line))]),
      puzzleButton(`SITE ${"ABC"[i]} IS FAKE`, () => answerPuzzle(i === p.answer)),
    ]))),
    noneButton(p, "BOTH ARE REAL"),
  ],
};

function renderPuzzle(p) {
  const box = el("div", { className: `puzzle puzzle-${p.kind}` }, [el("p", { className: "puzzle-prompt" }, p.prompt)]);
  box.append(...PUZZLES[p.kind](p));
  if (state.puzzle.feedback) box.append(el("p", { className: "puzzle-feedback", role: "status", tabIndex: -1 }, state.puzzle.feedback));
  return box;
}

function focusPuzzle(selector) {
  ($(`#panel .puzzle-feedback`) || $(`#panel ${selector}`) || $("#panel .puzzle button"))?.focus();
}

function togglePuzzle() {
  state.puzzle.open = !state.puzzle.open;
  state.puzzle.feedback = "";
  renderPanel();
  sound.effect("select");
  focusPuzzle(".puzzle button");
}

function answerPuzzle(isRight, missText = "Not quite.") {
  if (!state.running) return;
  if (isRight) {
    state.puzzle.solved = true;
    state.puzzle.open = false;
    sound.effect("correct");
    renderPanel();
    $("#panel .clue")?.setAttribute("tabindex", "-1");
    $("#panel .clue")?.focus();
    return;
  }
  missPuzzle(`${missText} -${PUZZLE_MISS_SECONDS}s. Look again.`, PUZZLE_MISS_SECONDS);
}

function missPuzzle(feedback, seconds) {
  state.puzzle.feedback = feedback;
  sound.effect("incorrect");
  spendTime(seconds);
  if (state.running) {
    renderPanel();
    focusPuzzle("");
  }
}

function pressKey(p, key) {
  if (!state.running) return;
  const pz = state.puzzle;
  const option = pz.node.options.find((o) => o.key === key);
  if (!option) return missPuzzle(`"Sorry, that's not a valid option." -${PHONE_INVALID_SECONDS}s`, PHONE_INVALID_SECONDS);
  pz.keys += key;
  if (option.goal) return answerPuzzle(true);
  if (option.dead) {
    pz.node = p.menu;
    pz.keys = "";
    return missPuzzle(`${option.dead} You're back at the main menu. -${PHONE_DEAD_END_SECONDS}s`, PHONE_DEAD_END_SECONDS);
  }
  pz.node = option.next;
  pz.feedback = "";
  sound.effect("select");
  renderPanel();
  focusPuzzle(".keypad-key");
}

function redial(p) {
  if (!state.running) return;
  Object.assign(state.puzzle, { node: p.menu, keys: "", feedback: "" });
  sound.effect("call");
  renderPanel();
  focusPuzzle(".keypad-key");
}

function placeStrip(p, i) {
  if (!state.running) return;
  if (i !== state.puzzle.placed) return answerPuzzle(false, "That strip doesn't go there.");
  state.puzzle.placed++;
  if (state.puzzle.placed === p.lines.length) return answerPuzzle(true);
  state.puzzle.feedback = "";
  sound.effect("select");
  renderPanel();
  focusPuzzle(".shred-pile .strip");
}

function renderMessage(c) {
  const nodes = [
    el("p", { className: "meta" }, `${CHANNEL_LABELS[c.channel]} · from ${c.from}`),
    el("p", { className: "body" }, c.body),
  ];
  const tools = el("div", { className: "tools" });
  if (c.puzzle) {
    if (state.puzzle.solved) {
      nodes.push(el("div", { className: "clue" }, "🔓 " + c.puzzle.reward));
    } else {
      const btn = el("button", { className: "btn tool", ariaExpanded: String(state.puzzle.open) }, `🔍 ${c.puzzle.tool}`);
      if (c.puzzle.required) btn.append(el("span", { className: "key-tag" }, "KEY EVIDENCE"));
      btn.addEventListener("click", togglePuzzle);
      tools.append(btn);
    }
  }
  if (c.inMessageCall && !state.calls.inMessage) {
    tools.append(costButton("CONTACT SENDER", VERIFY_SECONDS, () => makeCall("inMessage")));
  }
  if (tools.children.length) nodes.push(tools);
  if (c.puzzle && state.puzzle.open && !state.puzzle.solved) nodes.push(renderPuzzle(c.puzzle));
  if (state.calls.inMessage) nodes.push(callResult(c.inMessageCall));
  return nodes;
}

function lockedHint(c) {
  return c.puzzle?.required && !state.puzzle.solved
    ? [el("p", { className: "locked-hint" }, `🔒 Key evidence is locked. Use 🔍 ${c.puzzle.tool} on the Message tab.`)]
    : [];
}

function renderHistory(c) {
  const items = c.history.map((h) => el("li", {}, h));
  if (c.puzzle && state.puzzle.solved) items.push(el("li", { className: "clue-item" }, "🔓 " + c.puzzle.reward));
  const list = items.length ? el("ul", {}, items) : el("p", { className: "empty" }, "No history on file.");
  return [list, ...lockedHint(c)];
}

function renderDirectory(c) {
  const nodes = [el("p", { className: "meta" }, "Trusted contacts. Verify using info you KNOW is real.")];
  c.directory.forEach((entry, i) => {
    const key = "dir" + i;
    const row = el("div", { className: "entry" }, [
      el("span", {}, [el("b", {}, entry.name), " · " + entry.contact]),
    ]);
    if (!state.calls[key]) row.append(costButton("VERIFY", VERIFY_SECONDS, () => makeCall(key)));
    nodes.push(row);
    if (state.calls[key]) nodes.push(callResult(entry.result));
  });
  if (!c.directory.length) nodes.push(el("p", { className: "empty" }, "No trusted contacts on file for this one."));
  if (!canSpend(VERIFY_SECONDS)) nodes.push(el("p", { className: "empty" }, "Not enough time left to verify."));
  return [...nodes, ...lockedHint(c)];
}

function renderPanel() {
  const c = currentCase();
  const renderers = { message: renderMessage, history: renderHistory, directory: renderDirectory };
  $("#panel").replaceChildren(...renderers[state.view](c));
}

function render() {
  renderHud();
  const c = currentCase();
  renderScene(c);
  $("#ticket-resident").textContent = c.resident;
  renderTabs();
  renderPanel();
}

// ---------- Actions ----------
function setView(view) {
  if (state.view === view) return;
  state.view = view;
  renderTabs();
  renderPanel();
  sound.effect("select");
}

function cycleView() {
  const next = (VIEWS.indexOf(state.view) + 1) % VIEWS.length;
  setView(VIEWS[next]);
}

function makeCall(key) {
  if (!state.running || !canSpend(VERIFY_SECONDS) || state.calls[key]) return;
  state.calls[key] = true;
  sound.effect("call");
  spendTime(VERIFY_SECONDS);
  if (state.running) render();
}

function setStepChoice(open, moveFocus = true) {
  $("#actions-verdict").hidden = open;
  $("#actions-step").hidden = !open;
  if (open) {
    // Real messages get believable decoy steps too, so peeking here can't give the answer away.
    const c = currentCase();
    $("#step-prompt").textContent = c.nextStep.prompt;
    if (!state.stepOptions.length) state.stepOptions = shuffle(c.nextStep.options);
    $("#step-options").replaceChildren(...state.stepOptions.map((option) => {
      const btn = el("button", { className: "btn step-option" }, option.text);
      btn.addEventListener("click", () => decide("scam", option));
      return btn;
    }));
  }
  if (moveFocus) (open ? $("#step-prompt") : $("#btn-scam")).focus();
}

function decide(verdict, step) {
  if (!state.running) return;
  pauseTimer();
  if ($("#timeout").open) return; // the clock ran out at the same moment
  const c = currentCase();
  const saidScam = verdict === "scam";
  const verdictRight = saidScam === c.scam;
  const parts = [];
  let stepResult = null;

  if (c.scam && saidScam) {
    parts.push(`Scam spotted! ${addScore(POINTS.verdict)}.`);
    stepResult = { chosen: step, right: step.correct };
    parts.push(step.correct
      ? `Right next step: ${addScore(POINTS.step)}.`
      : `But that next step could still hurt: ${addScore(POINTS.stepMiss)}.`);
  } else if (c.scam) {
    parts.push(`It was a scam. ${loseSavings(c.loss)} ${addScore(POINTS.wrong)}.`);
  } else if (saidScam) {
    parts.push(`That one was real. ${c.missedCost} ${addScore(POINTS.wrong)}.`);
  } else {
    parts.push(`Correct, it was legit! ${addScore(POINTS.verdict)}.`);
  }

  if (verdictRight) {
    state.correct++;
    state.runCorrect++;
  }
  state.runCases++;
  state.notes.push(c.tip);
  showDebrief(c, verdictRight, stepResult, parts.join(" "));
}

function bestStep(c) {
  return c.nextStep.options.find((o) => o.correct);
}

function renderStepReview(c, stepResult) {
  const box = $("#debrief-step");
  if (!c.scam) {
    box.hidden = true;
    return;
  }
  const best = bestStep(c);
  const items = [el("h3", {}, "The safest next step")];
  if (stepResult && !stepResult.right) {
    items.push(el("p", { className: "wrong" }, `✘ You chose: ${stepResult.chosen.text}`));
    items.push(el("p", { className: "small" }, stepResult.chosen.why));
  }
  items.push(el("p", { className: "correct" }, `✔ ${best.text}`));
  items.push(el("p", { className: "small" }, best.why));
  box.replaceChildren(...items);
  box.hidden = false;
}

function fillLesson(prefix, c) {
  $(`#${prefix}-tells-title`).textContent = c.scam ? "The tells" : "Why it was legit";
  $(`#${prefix}-tells`).replaceChildren(...c.tells.map((t) => el("li", {}, t)));
  $(`#${prefix}-tip`).textContent = c.tip;
  const src = $(`#${prefix}-source`);
  src.textContent = c.source.label;
  src.href = c.source.url;
}

function continueLabel(last) {
  if (state.bankrupt) return "READ THE NEWS 📰";
  if (!last) return "NEXT CASE";
  return isLastDay() ? "FINISH THE WEEK" : "END DAY";
}

function showDebrief(c, verdictRight, stepResult, outcome) {
  const fullyRight = verdictRight && (!stepResult || stepResult.right);
  const mood = verdictRight ? (c.scam ? "relieved" : "happy") : "worried";
  renderScene(c, mood);
  $("#debrief-portrait").replaceChildren(makePortrait(c.neighbor, mood));
  $("#debrief-name").textContent = c.neighbor.name;
  $("#debrief-reaction").textContent = MOODS[mood].reaction;
  const title = $("#debrief-title");
  title.textContent = fullyRight ? "GOOD CALL!" : verdictRight ? "HALF RIGHT…" : "NOT QUITE…";
  title.className = fullyRight ? "correct" : verdictRight ? "partial" : "wrong";
  $("#debrief-outcome").textContent = outcome + (state.bankrupt ? " Town savings are gone." : "");
  renderStepReview(c, stepResult);
  fillLesson("debrief", c);
  $("#btn-next").textContent = continueLabel(state.caseIndex === currentDay().cases.length - 1);
  renderHud();
  $("#debrief").showModal();
  sound.effect(fullyRight ? "correct" : "incorrect");
}

function resetCaseState() {
  state.view = "message";
  state.calls = {};
  state.stepOptions = [];
  resetPuzzle(currentCase());
}

function nextCase() {
  $("#debrief").close();
  setStepChoice(false, false);
  if (state.bankrupt) {
    showEnd("gameover");
  } else if (state.caseIndex < currentDay().cases.length - 1) {
    state.caseIndex++;
    resetCaseState();
    render();
    startTimer();
    $(".tab.active").focus();
    sound.effect("arrival");
  } else {
    state.timeBonus = Math.floor(Math.max(0, state.timeLeft) / 1000);
    addScore(state.timeBonus);
    if (isLastDay()) showEnd("complete");
    else showSummary();
  }
}

// ---------- Time's up: remaining neighbors decide alone ----------
let revealTimers = [];

function timeUp() {
  if (!state.running && state.timeLeft > 0) return;
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  state.running = false;
  state.timeLeft = 0;
  setStepChoice(false, false);
  const remaining = currentDay().cases.slice(state.caseIndex);
  state.aloneCount = remaining.length;
  state.runCases += remaining.length;

  const cards = remaining.map((c, i) => {
    const luckyRight = Math.random() < 0.5;
    let outcome;
    let points = 0;
    if (luckyRight) {
      outcome = c.scam
        ? `${c.neighbor.name} got suspicious and ignored it. Lucky this time.`
        : `${c.neighbor.name} trusted it, and it was real. Lucky!`;
    } else if (c.scam) {
      points = POINTS.wrong;
      outcome = `${c.neighbor.name} fell for it. ${loseSavings(c.loss)}`;
    } else {
      points = POINTS.wrong;
      outcome = `${c.neighbor.name} thought it was a scam and ignored it. ${c.missedCost}`;
    }
    if (points) addScore(points);
    state.notes.push(c.tip);
    const mood = luckyRight ? (c.scam ? "relieved" : "happy") : "worried";
    const lesson = el("details", { className: "alone-lesson" }, [
      el("summary", {}, c.scam ? "It was a scam: the tells" : "It was real: why"),
      el("ul", {}, c.tells.map((t) => el("li", {}, t))),
      ...(c.scam ? [el("p", { className: "small" }, `Safest next step: ${bestStep(c).text}`)] : []),
      el("p", { className: "tip" }, "💡 " + c.tip),
      el("p", { className: "small" }, ["Source: ", el("a", { href: c.source.url, target: "_blank", rel: "noopener" }, c.source.label)]),
    ]);
    const portrait = makePortrait(c.neighbor, "worried");
    const card = el("li", { className: "alone-card" }, [
      portrait,
      el("div", {}, [
        el("p", { className: "reaction-name" }, c.neighbor.name),
        el("p", { className: "alone-thinking" }, "Deciding alone…"),
        el("div", { className: "alone-reveal" }, [
          el("p", { className: "alone-outcome" }, [outcome, " ", el("b", { className: points ? "wrong" : "" }, points ? `${points} pts` : "0 pts")]),
          lesson,
        ]),
      ]),
    ]);
    card.style.setProperty("--delay", `${i * 900}ms`);
    // Reveal each decision one by one so it feels like they're choosing without you.
    revealTimers.push(setTimeout(() => {
      card.classList.add("revealed", luckyRight ? "lucky" : "unlucky");
      portrait.replaceWith(makePortrait(c.neighbor, mood));
      sound.effect(luckyRight ? "correct" : "incorrect");
    }, i * 900 + 700));
    return card;
  });

  $("#timeout-summary").textContent = remaining.length === 1
    ? "1 neighbor couldn't wait any longer and decided on their own."
    : `${remaining.length} neighbors couldn't wait any longer and decided on their own.`;
  $("#timeout-list").replaceChildren(...cards);
  const done = $("#btn-timeout-done");
  done.textContent = state.bankrupt ? "READ THE NEWS 📰" : isLastDay() ? "FINISH THE WEEK" : "SEE DAY SUMMARY";
  done.disabled = true;
  revealTimers.push(setTimeout(() => { done.disabled = false; }, (cards.length - 1) * 900 + 800));
  renderHud();
  $("#timeout").showModal();
  sound.effect("arrival");
}

// ---------- Quitting ----------
function askQuit() {
  if (!state.running) return;
  pauseTimer();
  $("#quit").showModal();
}

function resumeFromQuit() {
  $("#quit").close();
  if ($("#screen-desk").classList.contains("active") && !state.running && state.timeLeft > 0) startTimer();
}

// ---------- Leaderboard ----------
let storageWorks = true;
function loadLeaderboard() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((e) => typeof e.score === "number" && typeof e.name === "string") : [];
  } catch (error) {
    console.warn("Could not read the leaderboard:", error);
    storageWorks = false;
    return [];
  }
}

function saveLeaderboard(list) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.warn("Could not save the leaderboard:", error);
    storageWorks = false;
    return false;
  }
}

function qualifies(score) {
  const list = loadLeaderboard();
  return list.length < LEADERBOARD_SIZE || score > list[list.length - 1].score;
}

function entryDetail(entry) {
  const record = `${entry.correct}/${entry.total}`;
  if (entry.status === "gameover") return `💸 BROKE ${entry.day} · ${record}`;
  if (entry.status === "quit") return `🚪 QUIT ${entry.day} · ${record}`;
  return `${record} correct`;
}

function renderLeaderboard(target, highlight = -1) {
  const list = loadLeaderboard();
  if (!list.length) {
    target.replaceChildren(el("li", { className: "empty-board" }, storageWorks ? "No scores yet. Be the first!" : "Scores can't be saved in this browser."));
    return;
  }
  target.replaceChildren(...list.map((entry, i) =>
    el("li", { className: [i === highlight ? "mine" : "", entry.status && entry.status !== "complete" ? "ended" : ""].join(" ").trim() }, [
      el("span", { className: "lb-rank" }, `${i + 1}.`),
      el("span", { className: "lb-name" }, entry.name),
      el("span", { className: "lb-score" }, String(entry.score)),
      el("span", { className: "lb-detail" }, entryDetail(entry)),
    ])));
}

function submitScore(event) {
  event.preventDefault();
  const name = $("#lb-name").value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "???";
  const entry = {
    name, score: state.score, correct: state.runCorrect, total: state.runCases,
    status: state.endStatus, day: currentDay().title.slice(0, 3),
    date: new Date().toISOString().slice(0, 10),
  };
  const list = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_SIZE);
  const rank = list.indexOf(entry);
  if (!saveLeaderboard(list)) {
    $("#lb-status").textContent = "Couldn't save your score in this browser.";
    return;
  }
  $("#lb-form").hidden = true;
  $("#lb-status").textContent = rank >= 0 ? `Saved! You're #${rank + 1}.` : "Saved.";
  renderLeaderboard($("#summary-board"), rank);
  renderLeaderboard($("#title-board"));
  sound.effect("correct");
}

// ---------- Screens ----------
// The Maple Hollow Gazette reports how the week ended.
function gazette(status) {
  const day = currentDay().title;
  const lost = formatMoney(START_SAVINGS - state.savings);
  if (status === "gameover") {
    return {
      headline: "SCAM WAVE EMPTIES TOWN SAVINGS",
      sub: `Help Desk shut down by town council on ${day}. Neighbors lost ${lost} to scammers. "We trusted that desk," sighs local baker.`,
    };
  }
  if (status === "quit") {
    return {
      headline: "HELP DESK CLOSES EARLY",
      sub: `Sign on the door reads "Back never." Neighbors left on hold since ${day}; town savings stand at ${formatMoney(state.savings)}.`,
    };
  }
  if (state.savings >= START_SAVINGS * 0.6) {
    return {
      headline: "HELP DESK SAVES MAPLE HOLLOW",
      sub: `Scammers leave town empty-handed after a tough week. Town savings: ${formatMoney(state.savings)}. Mr. Okafor calls it "a textbook result."`,
    };
  }
  return {
    headline: "TOWN SCRAPES THROUGH SCAM WEEK",
    sub: `Maple Hollow lost ${lost} but the Help Desk stays open. "Next week we verify everything," vows Dev.`,
  };
}

function showSummary(status = "day") {
  state.running = false;
  state.endStatus = status;
  const ending = status !== "day";
  const day = currentDay();
  const total = day.cases.length;
  const ratio = state.correct / total;
  const stars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
  const titles = { day: `${day.title} COMPLETE`, complete: "WEEK COMPLETE", gameover: "GAME OVER", quit: "RUN ABANDONED" };
  $("#summary-title").textContent = titles[status];
  $("#summary-title").className = status === "gameover" ? "wrong" : "";
  $("#summary-stars").hidden = status === "gameover" || status === "quit";
  $("#summary-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);

  const paper = $("#summary-gazette");
  paper.hidden = !ending;
  if (ending) {
    const news = gazette(status);
    paper.dataset.status = status;
    $("#gazette-date").textContent = `${day.title} EDITION`;
    $("#gazette-headline").textContent = news.headline;
    $("#gazette-sub").textContent = news.sub;
  }

  const alone = state.aloneCount ? ` · ${state.aloneCount} decided alone` : "";
  const bonus = status === "quit" || status === "gameover" ? ""
    : state.aloneCount ? " (no time bonus: desk closed)" : ` (time bonus +${state.timeBonus})`;
  $("#summary-stats").textContent =
    `${day.title}: ${state.correct}/${total} correct${alone} · Day score ${formatPoints(state.dayScore)}${bonus} · Savings ${formatMoney(state.savings)}`;
  $("#summary-score").textContent = `TOTAL SCORE ${state.score}`;
  $("#summary-progress").textContent = `${state.runCorrect}/${state.runCases} correct this week. ` + ({
    day: `Score and Savings carry into ${state.run[state.dayIndex + 1]?.title}. Mistakes cost more each day.`,
    complete: "You made it through the whole week!",
    gameover: "Town savings hit $0, so the Help Desk was shut down.",
    quit: "You closed the Help Desk early.",
  })[status];
  $("#summary-notes").replaceChildren(...state.notes.map((n) => el("li", {}, n)));
  $("#btn-next-shift").hidden = ending;
  $("#btn-restart").textContent = ending ? "PLAY AGAIN" : "START OVER";
  $("#btn-main-menu").hidden = !ending;

  $("#summary-leaderboard").hidden = !ending;
  if (ending) {
    const canSave = qualifies(state.score);
    $("#lb-form").hidden = !canSave;
    $("#lb-name").value = "";
    $("#lb-status").textContent = canSave
      ? (status === "complete" ? "New high score! Enter your initials." : "You made the board. Enter your initials.")
      : "Not quite a top-10 score this time.";
    renderLeaderboard($("#summary-board"));
  }
  showScreen("screen-summary");
  $("#summary-title").focus();
  if (status === "gameover") sound.effect("incorrect");
  if (status === "complete") sound.effect("correct");
}

const showEnd = (status) => showSummary(status);

function startDay() {
  const day = currentDay();
  Object.assign(state, {
    caseIndex: 0, timeLeft: day.seconds * 1000, running: false, lowTimeWarned: false,
    correct: 0, dayScore: 0, timeBonus: 0, aloneCount: 0, notes: [],
  });
  resetCaseState();
  $("#scene-portrait").replaceChildren();
  setStepChoice(false, false);
  delete $("#scene-portrait").dataset.caseKey;
  $("#intro-title").textContent = `DAY ${state.dayIndex + 1}/${state.run.length}: ${day.title}`;
  $("#intro-text").textContent = day.intro;
  $("#intro-progress").textContent =
    `Score ${state.score} · Savings ${formatMoney(state.savings)} · Time on the clock: ${formatTime(day.seconds * 1000)}`;
  showScreen("screen-intro");
  $("#intro-title").focus();
}

function startCampaign() {
  // ?seed=123 replays the same set of cases, which is handy for testing.
  const seedParam = Number(new URLSearchParams(location.search).get("seed"));
  const seed = Number.isInteger(seedParam) && seedParam > 0 ? seedParam : Math.floor(Math.random() * 2 ** 31);
  Object.assign(state, {
    run: buildRun(seed), seed, dayIndex: 0, score: 0, savings: START_SAVINGS,
    bankrupt: false, runCorrect: 0, runCases: 0, endStatus: null,
  });
  sound.start();
  startDay();
}

function nextDay() {
  if (isLastDay()) {
    console.warn("There is no next day.");
    return;
  }
  state.dayIndex++;
  startDay();
}

// ---------- Wiring up events ----------
$("#btn-start").addEventListener("click", startCampaign);
$("#btn-restart").addEventListener("click", startCampaign);
$("#btn-main-menu").addEventListener("click", () => {
  state.running = false;
  renderLeaderboard($("#title-board"));
  showScreen("screen-title");
  $("#btn-start").focus();
});
$("#btn-next-shift").addEventListener("click", nextDay);
$("#btn-begin").addEventListener("click", () => {
  showScreen("screen-desk");
  render();
  startTimer();
  $(".tab.active").focus();
  sound.effect("arrival");
});
$("#btn-next").addEventListener("click", nextCase);
$("#btn-timeout-done").addEventListener("click", () => {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  $("#timeout").close();
  if (state.bankrupt) showEnd("gameover");
  else showSummary(isLastDay() ? "complete" : "day");
});
$("#debrief").addEventListener("cancel", (e) => e.preventDefault()); // Esc can't skip the lesson
$("#timeout").addEventListener("cancel", (e) => e.preventDefault());
$("#lb-form").addEventListener("submit", submitScore);

$("#btn-quit").addEventListener("click", askQuit);
$("#btn-quit-cancel").addEventListener("click", resumeFromQuit);
$("#quit").addEventListener("cancel", (e) => { e.preventDefault(); resumeFromQuit(); });
$("#btn-quit-confirm").addEventListener("click", () => {
  $("#quit").close();
  setStepChoice(false, false);
  showEnd("quit");
});

$$(".tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
$("#btn-legit").addEventListener("click", () => decide("legit", null));
$("#btn-scam").addEventListener("click", () => { setStepChoice(true); sound.effect("select"); });
$("#btn-back").addEventListener("click", () => { setStepChoice(false); sound.effect("select"); });

renderLeaderboard($("#title-board"));

// The SHIFT key is the core mechanic: tap it to shift between views.
// We only count a "clean tap" so combos like Shift+Tab still work for keyboard users.
let shiftTap = false;
document.addEventListener("keydown", (e) => { shiftTap = e.key === "Shift" && !e.repeat; });
document.addEventListener("keyup", (e) => {
  const onDesk = $("#screen-desk").classList.contains("active");
  const typing = e.target instanceof HTMLInputElement;
  const dialogOpen = [...$$("dialog")].some((d) => d.open);
  if (e.key === "Shift" && shiftTap && onDesk && !typing && !dialogOpen && state.running) cycleView();
  shiftTap = false;
});
