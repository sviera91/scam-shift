// Shared game content: sources, neighbors, the five-day week, and the case randomizer.
// Case templates live in the other files in this folder (starter.js, medium.js, hard.js).
// Each one calls addTemplates([...]). Run `node tools/check-cases.js` after editing cases.
//
// TEMPLATE
//   { id: "kebab-case-id", tier: 1 | 2 | 3, build(r) { return { ...case } } }
//   tier 1 = easy (Monday-ish), 2 = medium, 3 = hard (Thursday/Friday).
//   build(r) is called once per run with a seeded random helper `r` (see makeRandom below),
//   so names, amounts, numbers, domains, and even whether it's a scam can change every run.
//   "Twin" templates that sometimes return a scam and sometimes the real thing are the
//   best defense against players memorizing answers.
//
// CASE FIELDS (what build returns)
//   neighbor      one of NEIGHBORS (pronouns: neighbor.he / .him / .his)
//   resident      who forwarded the message and what they ask (say what they ALREADY did)
//   channel       "text" | "email" | "voicemail" | "dm" | "popup" | "letter" | "call"
//   from          sender as shown to the resident
//   body          the message itself
//   inMessageCall optional: what happens if you contact the sender (a trap for scams)
//   history       array of strings: what we know about past contact / the situation
//   directory     array of { name, contact, result } trusted contacts; `result` is revealed when
//                 the player spends 30s to verify. On tier 3, results should be inconclusive
//                 (voicemail, closed, "can't discuss") so the mini-game evidence matters.
//   puzzle        optional mini-game that unlocks a clue (see PUZZLE KINDS). Tier 3: required.
//   scam          true | false
//   loss          scams only: base savings lost if it gets through (400-2000). The day scales it.
//   missedCost    legit only: what goes wrong if the real message is treated as a scam
//   nextStep      { prompt, options: [3 x { text, correct?, why? }] }
//                 scam: exactly one option has correct: true; every option has `why`.
//                 legit: three believable decoys with no `correct` (shown if they wrongly say SCAM)
//   tells         array of strings, the clues (debrief). For legit cases: why it was real.
//   tip           one real-life takeaway
//   source        a SOURCES entry
//
// PUZZLE KINDS (every puzzle has: kind, tool (button label), prompt, reward, optional required)
//   choice    options: [strings], answer: index
//   spot      recordLabel, record, shownLabel, shown (same length strings). Player clicks the first
//             differing character, or THEY MATCH. Use long strings and look-alikes (r.lookalike).
//   link      url. Player clicks the part of the address that shows who really owns the site:
//             the last two labels of the hostname (e.g. "pinecrest.example" in
//             "https://pinecrest.example.login-check.example/x" is NOT it; "login-check.example" is).
//   phonetree number, menu. A phone menu the player navigates with a keypad to reach the right
//             team. menu = { say, options: [{ key, next: menu } | { key, goal: true } |
//             { key, dead: "what happens (they get sent back to the start)" }] }. Keys: "0"-"9", "*", "#".
//   audit     rows: [{ date, desc, amount }], answer: index of the row that doesn't belong, or -1
//             if everything checks out (button: noneLabel, default "ALL CHECK OUT").
//   story     lines: [strings], answer: index of the line that contradicts the History tab, or -1
//             (button: noneLabel, default "STORY HOLDS UP").
//   shred     lines: [4-6 distinct strings in the correct order]. Shown shuffled; the player
//             rebuilds the document strip by strip.
//   site      sites: [2-3 x { url, title, lines: [strings] }], answer: index of the fake, or -1
//             if they're the same real site (button: noneLabel, default "BOTH ARE REAL").
//
// CONTENT RULES
//   Fictional numbers only (555-01xx, short codes), and .example domains for anything fake or
//   made up. Every case cites a real source; guidance must match it.

const SOURCES = {
  phishing: {
    label: "FTC: How To Recognize and Avoid Phishing Scams",
    url: "https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams",
  },
  familyEmergency: {
    label: "FTC: Scammers Use Fake Emergencies To Steal Your Money",
    url: "https://consumer.ftc.gov/articles/scammers-use-fake-emergencies-steal-your-money",
  },
  spamText: {
    label: "FTC: How to Recognize and Report Spam Text Messages",
    url: "https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages",
  },
  uspsSmishing: {
    label: "U.S. Postal Inspection Service: Smishing",
    url: "https://www.uspis.gov/news/scam-article/smishing",
  },
  government: {
    label: "FTC: How To Avoid a Government Impersonation Scam",
    url: "https://consumer.ftc.gov/articles/how-avoid-government-impersonation-scam",
  },
  techSupport: {
    label: "FTC: How To Spot, Avoid, and Report Tech Support Scams",
    url: "https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams",
  },
  impostor: {
    label: "FTC: How To Avoid Imposter Scams",
    url: "https://consumer.ftc.gov/features/how-avoid-imposter-scams",
  },
  job: {
    label: "FTC: You got the job!",
    url: "https://consumer.ftc.gov/consumer-alerts/2023/04/you-got-job",
  },
  romance: {
    label: "FTC: When an online love interest offers investment advice",
    url: "https://consumer.ftc.gov/consumer-alerts/2024/06/what-do-if-your-online-love-interest-offers-teach-you-how-invest-your-money",
  },
  verificationCode: {
    label: "FTC: What's a verification code?",
    url: "https://consumer.ftc.gov/consumer-alerts/2024/03/whats-verification-code-why-would-someone-ask-me-it",
  },
  scammed: {
    label: "FTC: What To Do if You Were Scammed",
    url: "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed",
  },
  fakeChecks: {
    label: "FTC: How To Spot, Avoid, and Report Fake Check Scams",
    url: "https://consumer.ftc.gov/articles/how-spot-avoid-and-report-fake-check-scams",
  },
  giftCards: {
    label: "FTC: Avoiding and Reporting Gift Card Scams",
    url: "https://consumer.ftc.gov/articles/avoiding-and-reporting-gift-card-scams",
  },
  rental: {
    label: "FTC: Rental Listing Scams",
    url: "https://consumer.ftc.gov/articles/rental-listing-scams",
  },
  crypto: {
    label: "FTC: What To Know About Cryptocurrency and Scams",
    url: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams",
  },
  jobScams: {
    label: "FTC: Job Scams",
    url: "https://consumer.ftc.gov/articles/job-scams",
  },
};

// Add a source from a case file (verify the URL is real and current first).
function addSources(extra) {
  for (const [key, value] of Object.entries(extra)) {
    if (SOURCES[key]) throw new Error(`Source "${key}" already exists.`);
    SOURCES[key] = value;
  }
}

const NEIGHBORS = {
  okafor: { id: "okafor", name: "Mr. Okafor", role: "Retired teacher", he: "he", him: "him", his: "his" },
  rosa: { id: "rosa", name: "Rosa", role: "Bakery owner", he: "she", him: "her", his: "her" },
  priya: { id: "priya", name: "Priya", role: "College student", he: "she", him: "her", his: "her" },
  ines: { id: "ines", name: "Grandma Inés", role: "Grandmother", he: "she", him: "her", his: "her" },
  dev: { id: "dev", name: "Dev", role: "Hardware store owner", he: "he", him: "him", his: "his" },
};

// The week. `tiers` lists the difficulty of each case drawn that day; `lossScale` multiplies
// every scam's base loss, so mistakes hurt more as the week goes on.
const DAYS = [
  {
    title: "MONDAY", seconds: 210, lossScale: 1, tiers: [1, 1, 1, 1, 2],
    intro: "Welcome to the Maple Hollow Help Desk! Neighbors forward you messages they're unsure about. " +
      "The clock runs while you work, and verifying costs extra time. Anyone still waiting at closing " +
      "decides alone. Town savings start at $5,000. If they hit $0, the Help Desk is shut down.",
  },
  {
    title: "TUESDAY", seconds: 225, lossScale: 1.2, tiers: [1, 1, 2, 2, 2],
    intro: "Word is spreading about the Help Desk, and so are the scams. Some real messages look scary too. " +
      "Losses are a bit bigger today.",
  },
  {
    title: "WEDNESDAY", seconds: 255, lossScale: 1.4, tiers: [1, 2, 2, 2, 3],
    intro: "Midweek. Scammers are getting smarter: some messages look perfectly clean. " +
      "When the Directory can't settle it, the 🔍 tools hold the key evidence.",
  },
  {
    title: "THURSDAY", seconds: 285, lossScale: 1.6, tiers: [2, 2, 3, 3, 3],
    intro: "A scam wave is hitting Maple Hollow. Trusted contacts are swamped and hard to reach. " +
      "Expect to dig through statements, letters and phone menus.",
  },
  {
    title: "FRIDAY", seconds: 300, lossScale: 1.8, tiers: [2, 3, 3, 3, 3],
    intro: "Last shift of the week, and the toughest. One bad call could empty what's left of town savings. " +
      "Make it count.",
  },
];

const TEMPLATES = [];
function addTemplates(list) {
  for (const t of list) {
    if (TEMPLATES.some((other) => other.id === t.id)) throw new Error(`Duplicate template id "${t.id}".`);
    TEMPLATES.push(t);
  }
}

const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Seeded random helper (mulberry32), so a run can be replayed with ?seed=123.
function makeRandom(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const LOOKALIKES = { o: "0", 0: "o", l: "1", 1: "l", i: "l", e: "c", c: "e", a: "o", m: "n", n: "m", u: "v", v: "u", s: "5", 5: "s", b: "6", g: "q", q: "g" };
  const r = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p = 0.5) => next() < p,
    shuffle(list) {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    // A fictional US number like 555-0137.
    phone: () => `555-01${String(r.int(0, 99)).padStart(2, "0")}`,
    // A five-digit SMS short code.
    shortCode: () => String(r.int(20000, 99999)),
    money: (min, max, step = 50) => min + step * r.int(0, Math.floor((max - min) / step)),
    // Swap one character (never the first) for a look-alike. Keeps the same length.
    lookalike(text) {
      const spots = [...text].map((ch, i) => i).filter((i) => i > 0 && (/\d/.test(text[i]) || LOOKALIKES[text[i]]));
      if (!spots.length) throw new Error(`No look-alike possible for "${text}".`);
      const i = r.pick(spots);
      const ch = text[i];
      const swap = LOOKALIKES[ch] ?? String((Number(ch) + r.pick([1, 9])) % 10);
      return text.slice(0, i) + swap + text.slice(i + 1);
    },
  };
  return r;
}

// Build one run: five days, each drawing cases by tier with no template repeated.
function buildRun(seed) {
  const r = makeRandom(seed);
  const used = new Set();
  return DAYS.map((day) => {
    const cases = day.tiers.map((tier) => {
      const pool = TEMPLATES.filter((t) => !used.has(t.id));
      if (!pool.length) throw new Error("Ran out of case templates.");
      const gap = Math.min(...pool.map((t) => Math.abs(t.tier - tier)));
      const template = r.pick(pool.filter((t) => Math.abs(t.tier - tier) === gap));
      used.add(template.id);
      const c = template.build(r);
      c.templateId = template.id;
      c.tier = template.tier;
      if (c.scam) c.loss = Math.round((c.loss * day.lossScale) / 50) * 50;
      return c;
    });
    return { ...day, cases: r.shuffle(cases) };
  });
}
