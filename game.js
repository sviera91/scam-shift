// Scam Shift game logic. Reads SHIFTS from cases.js.
// The game is a small "state machine": we keep everything in one `state` object,
// change it when the player acts, then call render() to redraw the screen.

const VIEWS = ["message", "history", "directory"];
const DAY_START = 9 * 60;   // 9:00 in minutes
const DAY_END = 17 * 60;    // 17:00
const DECISION_MINUTES = 30;
const CALL_MINUTES = 90;
const START_SAVINGS = 10000;

const state = {
  shiftIndex: 0,
  caseIndex: 0,
  view: "message",
  clock: DAY_START,
  trust: 100,
  savings: START_SAVINGS,
  correct: 0,
  calls: {},     // which directory entries were called for the current case
  notes: [],     // tips collected for the end-of-shift summary
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

function formatClock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

const formatMoney = (n) => "$" + n.toLocaleString("en-US");
const currentShift = () => SHIFTS[state.shiftIndex];
const currentCase = () => currentShift().cases[state.caseIndex];
const canCall = () => state.clock + CALL_MINUTES <= DAY_END;

// ---------- Rendering ----------
function renderHud() {
  const shift = currentShift();
  $("#hud-shift").textContent = shift.title;
  $("#hud-clock").textContent = formatClock(state.clock);
  $("#hud-trust").textContent = state.trust;
  $("#hud-savings").textContent = formatMoney(state.savings);
  $("#hud-case").textContent = `CASE ${state.caseIndex + 1}/${shift.cases.length}`;
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

function renderMessage(c) {
  const icons = { text: "💬 TEXT", email: "📧 EMAIL", voicemail: "📼 VOICEMAIL", dm: "✉️ DM" };
  const nodes = [
    el("p", { className: "meta" }, `${icons[c.channel]} · from ${c.from}`),
    el("p", { className: "body" }, c.body),
  ];
  if (c.inMessageCall) {
    if (state.calls.inMessage) {
      nodes.push(callResult(c.inMessageCall));
    } else {
      const btn = el("button", { className: "btn call", disabled: !canCall() }, `CONTACT VIA MESSAGE (-${CALL_MINUTES}m)`);
      btn.addEventListener("click", () => makeCall("inMessage"));
      nodes.push(btn);
    }
  }
  return nodes;
}

function renderHistory(c) {
  if (!c.history.length) return [el("p", { className: "empty" }, "No history on file.")];
  return [el("ul", {}, c.history.map((h) => el("li", {}, h)))];
}

function renderDirectory(c) {
  const nodes = [el("p", { className: "meta" }, "Trusted contacts. Verify using info you KNOW is real.")];
  c.directory.forEach((entry, i) => {
    const key = "dir" + i;
    const row = el("div", { className: "entry" }, [
      el("span", {}, [el("b", {}, entry.name), " · " + entry.contact]),
    ]);
    if (!state.calls[key]) {
      const btn = el("button", { className: "btn call", disabled: !canCall() }, `VERIFY (-${CALL_MINUTES}m)`);
      btn.addEventListener("click", () => makeCall(key));
      row.append(btn);
    }
    nodes.push(row);
    if (state.calls[key]) nodes.push(callResult(entry.result));
  });
  if (!canCall()) nodes.push(el("p", { className: "empty" }, "Not enough time left today to make calls."));
  return nodes;
}

function renderPanel() {
  const c = currentCase();
  const renderers = { message: renderMessage, history: renderHistory, directory: renderDirectory };
  $("#panel").replaceChildren(...renderers[state.view](c));
}

function render() {
  renderHud();
  $("#ticket-resident").textContent = currentCase().resident;
  renderTabs();
  renderPanel();
}

// ---------- Actions ----------
function setView(view) {
  state.view = view;
  renderTabs();
  renderPanel();
}

function cycleView() {
  const next = (VIEWS.indexOf(state.view) + 1) % VIEWS.length;
  setView(VIEWS[next]);
}

function makeCall(key) {
  if (!canCall() || state.calls[key]) return;
  state.calls[key] = true;
  state.clock += CALL_MINUTES;
  render();
}

function decide(decision) {
  const c = currentCase();
  const saidScam = decision !== "legit";
  const isCorrect = saidScam === c.scam;
  let outcome;

  if (c.scam && decision === "report") {
    state.trust = Math.min(100, state.trust + 5);
    outcome = "Scam stopped AND reported. Reports help authorities warn others. +5 Trust";
  } else if (c.scam && decision === "ignore") {
    outcome = "Scam stopped! Tip: reporting it too helps protect your neighbors.";
  } else if (c.scam) {
    state.savings -= c.loss;
    state.trust = Math.max(0, state.trust - 10);
    outcome = `It was a scam. The town lost ${formatMoney(c.loss)}. -10 Trust`;
  } else if (decision === "legit") {
    state.trust = Math.min(100, state.trust + 5);
    outcome = "Correct, it was legit! Neighbors appreciate not being left hanging. +5 Trust";
  } else {
    state.trust = Math.max(0, state.trust - 15);
    outcome = `That one was real. ${c.missedCost} -15 Trust`;
  }

  if (isCorrect) state.correct++;
  state.clock += DECISION_MINUTES;
  state.notes.push(c.tip);
  showDebrief(c, isCorrect, outcome);
}

function showDebrief(c, isCorrect, outcome) {
  const title = $("#debrief-title");
  title.textContent = isCorrect ? "GOOD CALL!" : "NOT QUITE…";
  title.className = isCorrect ? "correct" : "wrong";
  $("#debrief-outcome").textContent = outcome;
  $("#debrief-tells-title").textContent = c.scam ? "The tells" : "Why it was legit";
  $("#debrief-tells").replaceChildren(...c.tells.map((t) => el("li", {}, t)));
  $("#debrief-tip").textContent = c.tip;
  const src = $("#debrief-source");
  src.textContent = c.source.label;
  src.href = c.source.url;
  const last = state.caseIndex === currentShift().cases.length - 1;
  $("#btn-next").textContent = last ? "END SHIFT" : "NEXT CASE";
  renderHud();
  $("#debrief").showModal();
}

function nextCase() {
  $("#debrief").close();
  if (state.caseIndex < currentShift().cases.length - 1) {
    state.caseIndex++;
    state.view = "message";
    state.calls = {};
    render();
  } else {
    showSummary();
  }
}

function showSummary() {
  const total = currentShift().cases.length;
  const ratio = state.correct / total;
  const stars = ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
  $("#summary-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("#summary-stats").textContent =
    `${state.correct}/${total} correct · Trust ${state.trust} · Savings ${formatMoney(state.savings)} · Clocked out at ${formatClock(state.clock)}`;
  $("#summary-notes").replaceChildren(...state.notes.map((n) => el("li", {}, n)));
  showScreen("screen-summary");
}

function startShift() {
  Object.assign(state, {
    caseIndex: 0, view: "message", clock: DAY_START,
    trust: 100, savings: START_SAVINGS, correct: 0, calls: {}, notes: [],
  });
  $("#intro-title").textContent = currentShift().title;
  $("#intro-text").textContent = currentShift().intro;
  showScreen("screen-intro");
}

// ---------- Wiring up events ----------
$("#btn-start").addEventListener("click", startShift);
$("#btn-restart").addEventListener("click", startShift);
$("#btn-begin").addEventListener("click", () => { showScreen("screen-desk"); render(); });
$("#btn-next").addEventListener("click", nextCase);
$("#debrief").addEventListener("cancel", (e) => e.preventDefault()); // Esc can't skip the lesson

$$(".tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
$$("[data-decision]").forEach((btn) => btn.addEventListener("click", () => decide(btn.dataset.decision)));

// The SHIFT key is the core mechanic: tap it to shift between views.
// We only count a "clean tap" so combos like Shift+Tab still work for keyboard users.
let shiftTap = false;
document.addEventListener("keydown", (e) => { shiftTap = e.key === "Shift" && !e.repeat; });
document.addEventListener("keyup", (e) => {
  const onDesk = $("#screen-desk").classList.contains("active");
  if (e.key === "Shift" && shiftTap && onDesk && !$("#debrief").open) cycleView();
  shiftTap = false;
});
