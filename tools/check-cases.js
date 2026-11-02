// Validates every case template. Usage: node tools/check-cases.js [file ...]
// With no arguments it checks all of cases/*.js. Builds each template with many seeds.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dir = path.join(__dirname, "..", "cases");
const extra = process.argv.slice(2);
const files = ["core.js", ...(extra.length ? extra.map((f) => path.basename(f)) : fs.readdirSync(dir).filter((f) => f !== "core.js" && f.endsWith(".js")).sort())];
const ctx = vm.createContext({ console });
for (const f of [...new Set(files)]) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx, { filename: f });
const { TEMPLATES, NEIGHBORS, SOURCES, DAYS, makeRandom, buildRun } = vm.runInContext("({ TEMPLATES, NEIGHBORS, SOURCES, DAYS, makeRandom, buildRun })", ctx);

const CHANNELS = ["text", "email", "voicemail", "dm", "popup", "letter", "call"];
const KINDS = ["choice", "spot", "link", "phonetree", "audit", "story", "shred", "site"];
const errors = [];
const str = (v) => typeof v === "string" && v.trim().length > 0;
const strs = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every(str);
const index = (v, len, allowNone) => Number.isInteger(v) && (v >= 0 ? v < len : allowNone && v === -1);

function checkMenu(menu, where, depth = 0) {
  const e = [];
  if (depth > 4) return { e: [`${where}: menu too deep`], goal: false };
  if (!str(menu?.say)) e.push(`${where}: menu.say missing`);
  if (!Array.isArray(menu?.options) || menu.options.length < 2) return { e: [...e, `${where}: menu needs 2+ options`], goal: false };
  let goal = false;
  const keys = new Set();
  for (const o of menu.options) {
    if (!/^[0-9*#]$/.test(o.key)) e.push(`${where}: bad key ${o.key}`);
    if (keys.has(o.key)) e.push(`${where}: duplicate key ${o.key}`);
    keys.add(o.key);
    const kinds = ["next", "goal", "dead"].filter((k) => o[k] !== undefined);
    if (kinds.length !== 1) e.push(`${where}: option ${o.key} needs exactly one of next/goal/dead`);
    if (o.goal) goal = true;
    if (o.dead !== undefined && !str(o.dead)) e.push(`${where}: dead must be a string`);
    if (o.next) { const sub = checkMenu(o.next, `${where}>${o.key}`, depth + 1); e.push(...sub.e); goal ||= sub.goal; }
  }
  return { e, goal };
}

function checkPuzzle(p, tier) {
  const e = [];
  if (!KINDS.includes(p.kind)) return [`puzzle.kind "${p.kind}" unknown`];
  for (const k of ["tool", "prompt", "reward"]) if (!str(p[k])) e.push(`puzzle.${k} missing`);
  if (tier === 3 && p.required !== true) e.push("tier 3 puzzle must have required: true");
  switch (p.kind) {
    case "choice":
      if (!strs(p.options, 2) || !index(p.answer, p.options?.length ?? 0, false)) e.push("choice: options/answer invalid");
      break;
    case "spot":
      if (!str(p.record) || !str(p.shown) || p.record.length !== p.shown.length) e.push("spot: record/shown must be same length");
      if (!str(p.recordLabel) || !str(p.shownLabel)) e.push("spot: labels missing");
      break;
    case "link": {
      try {
        const u = new URL(p.url);
        if (u.hostname.split(".").length < 2) e.push("link: hostname needs 2+ labels");
      } catch { e.push(`link: bad url ${p.url}`); }
      break;
    }
    case "phonetree": {
      if (!str(p.number)) e.push("phonetree: number missing");
      const res = checkMenu(p.menu, "phonetree");
      e.push(...res.e);
      if (!res.goal) e.push("phonetree: no goal reachable");
      break;
    }
    case "audit":
      if (!Array.isArray(p.rows) || p.rows.length < 4 || !p.rows.every((row) => str(row.date) && str(row.desc) && str(row.amount))) e.push("audit: need 4+ rows of {date, desc, amount}");
      if (!index(p.answer, p.rows?.length ?? 0, true)) e.push("audit: answer invalid");
      break;
    case "story":
      if (!strs(p.lines, 3) || !index(p.answer, p.lines?.length ?? 0, true)) e.push("story: lines/answer invalid");
      break;
    case "shred":
      if (!strs(p.lines, 4) || p.lines.length > 6 || new Set(p.lines).size !== p.lines.length) e.push("shred: need 4-6 distinct lines");
      break;
    case "site":
      if (!Array.isArray(p.sites) || p.sites.length < 2 || p.sites.length > 3 || !p.sites.every((s) => str(s.url) && str(s.title) && strs(s.lines, 1))) e.push("site: need 2-3 sites {url, title, lines}");
      if (!index(p.answer, p.sites?.length ?? 0, true)) e.push("site: answer invalid");
      break;
  }
  return e;
}

function checkCase(c, tier) {
  const e = [];
  if (!Object.values(NEIGHBORS).includes(c.neighbor)) e.push("neighbor must be a NEIGHBORS entry");
  for (const k of ["resident", "from", "body", "tip"]) if (!str(c[k])) e.push(`${k} missing`);
  if (!CHANNELS.includes(c.channel)) e.push(`channel "${c.channel}" invalid`);
  if (!Array.isArray(c.history) || !c.history.every(str)) e.push("history must be an array of strings");
  if (!Array.isArray(c.directory) || !c.directory.every((d) => str(d.name) && str(d.contact) && str(d.result))) e.push("directory entries need name, contact, result");
  if (c.inMessageCall !== undefined && !str(c.inMessageCall)) e.push("inMessageCall must be a string");
  if (typeof c.scam !== "boolean") e.push("scam must be boolean");
  if (c.scam && !(c.loss >= 400 && c.loss <= 2000)) e.push(`loss ${c.loss} must be 400-2000`);
  if (!c.scam && !str(c.missedCost)) e.push("legit case needs missedCost");
  if (!strs(c.tells, 2)) e.push("need 2+ tells");
  if (!Object.values(SOURCES).includes(c.source)) e.push("source must be a SOURCES entry");
  const ns = c.nextStep;
  if (!str(ns?.prompt) || !Array.isArray(ns?.options) || ns.options.length !== 3 || !ns.options.every((o) => str(o.text))) e.push("nextStep needs prompt and 3 options");
  else if (c.scam) {
    if (ns.options.filter((o) => o.correct === true).length !== 1) e.push("scam nextStep needs exactly one correct");
    if (!ns.options.every((o) => str(o.why))) e.push("scam nextStep options all need why");
  } else if (ns.options.some((o) => o.correct)) e.push("legit nextStep options must not be correct");
  if (tier === 3 && !c.puzzle) e.push("tier 3 needs a puzzle");
  if (c.puzzle) e.push(...checkPuzzle(c.puzzle, tier));
  const text = JSON.stringify({ ...c, neighbor: undefined, source: undefined });
  if (/\$\{|undefined|NaN|\[object/.test(text)) e.push("text contains undefined/NaN/template leftovers");
  return e;
}

const stats = { 1: 0, 2: 0, 3: 0 };
const kinds = {};
for (const t of TEMPLATES) {
  if (![1, 2, 3].includes(t.tier)) errors.push(`${t.id}: tier must be 1-3`);
  stats[t.tier] = (stats[t.tier] || 0) + 1;
  let scams = 0;
  const seen = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    let c;
    try { c = t.build(makeRandom(seed * 7919)); } catch (err) { errors.push(`${t.id} seed ${seed}: build threw ${err.message}`); break; }
    for (const msg of checkCase(c, t.tier)) seen.add(msg);
    if (c.scam) scams++;
    if (c.puzzle) kinds[c.puzzle.kind] = (kinds[c.puzzle.kind] || 0) + 1;
  }
  for (const msg of seen) errors.push(`${t.id}: ${msg}`);
  t._scamRate = scams / 60;
}

for (let seed = 1; seed <= 200; seed++) {
  try { buildRun(seed); } catch (err) { errors.push(`buildRun(${seed}) failed: ${err.message}`); break; }
}

console.log(`Templates: ${TEMPLATES.length} (tier1 ${stats[1]}, tier2 ${stats[2]}, tier3 ${stats[3]})`);
console.log("Twins (sometimes scam, sometimes real):", TEMPLATES.filter((t) => t._scamRate > 0 && t._scamRate < 1).map((t) => t.id).join(", ") || "none");
console.log("Puzzle kinds (builds over 60 seeds):", JSON.stringify(kinds));
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log("All good.");
