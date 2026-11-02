// cases/starter.js — Tier 1-2 templates rebuilt from the original hand-written Maple Hollow cases.
(() => {
  const AREAS = ["207", "413", "603", "802"];
  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Distinct fictional numbers: "555-01xx", or "802-555-01xx" when full is true.
  function phones(r, count, full = false) {
    const set = new Set();
    while (set.size < count) set.add(full ? `${r.pick(AREAS)}-${r.phone()}` : r.phone());
    return [...set];
  }

  // A number that's almost the same: last two digits swapped, or one digit nudged.
  // Only touches the area code or the last two digits, so it stays a fictional 555-01xx number.
  function nearPhone(r, num) {
    const d = num.split("");
    const end = d.length - 1;
    if (r.chance(0.4) && d[end] !== d[end - 1]) {
      [d[end], d[end - 1]] = [d[end - 1], d[end]];
      return d.join("");
    }
    const spots = (d.length > 8 ? [1, 2, end - 1, end] : [end - 1, end]).filter((i) => /\d/.test(d[i]));
    const i = r.pick(spots);
    d[i] = String((Number(d[i]) + r.pick([1, 9])) % 10);
    return d.join("");
  }

  // A short code whose look-alike is always another all-digit code.
  function safeShortCode(r) {
    let code = r.shortCode();
    while (/[015]/.test(code)) code = r.shortCode();
    return code;
  }

  const cents = (r, min, max) => `$${r.int(min, max)}.${String(r.int(0, 99)).padStart(2, "0")}`;
  const owner = (url) => url.split("/")[2].split(".").slice(-2).join(".");
  const steps = (r, prompt, options) => ({ prompt, options: r.shuffle(options) });
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  addTemplates([
    // ---------------------------------------------------------------- TIER 1
    {
      id: "pharmacy-refill-text",
      tier: 1,
      build(r) {
        const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.ines, NEIGHBORS.dev]);
        const scam = r.chance(0.5);
        const [real] = phones(r, 1, true);
        const shown = scam ? nearPhone(r, real) : real;
        const day = r.pick(DAYS_OF_WEEK);
        return {
          neighbor: n,
          resident: `${n.name} says: "I called this number back and read them my insurance member ID and birthday. Was that OK?"`,
          channel: "text",
          from: shown,
          body: "Maple Hollow Pharmacy: Your refill is ready for pickup. Your insurance plan changed this year, so please call us at this number to confirm your member ID first.",
          inMessageCall: scam
            ? "A cheerful voice thanks them and asks for the Social Security number \"to match the insurance file.\""
            : undefined,
          history: [
            `${n.name} called in a refill on ${day}.`,
            `${cap(n.his)} insurance really did switch plans in January.`,
          ],
          directory: [
            {
              name: "Maple Hollow Pharmacy (saved contact)",
              contact: real,
              result: scam
                ? `"${n.name}'s refill is ready, but we didn't text about insurance. We already have ${n.his} new card on file."`
                : `"Yes, that was us! We have ${n.his} member ID now, and the refill is waiting at the Elm St counter."`,
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE NUMBER",
            prompt: `Compare the sender with the pharmacy number saved in ${n.name}'s phone.`,
            recordLabel: "Saved pharmacy",
            record: real,
            shownLabel: "This text",
            shown,
            reward: scam
              ? `The text came from ${shown}, but the pharmacy's saved number is ${real}. So close, but not the same.`
              : `They match exactly. And since ${n.name} called that number back, ${n.he} reached the real pharmacy.`,
          },
          scam,
          loss: scam ? r.money(500, 1100) : undefined,
          missedCost: scam ? undefined : `${n.name} put off the pickup and went three days without ${n.his} medication.`,
          nextStep: scam
            ? steps(r, `${n.name} already gave a stranger ${n.his} member ID and birthday. What now?`, [
              { text: `Call ${n.his} insurer at the number on ${n.his} insurance card, then follow the plan at IdentityTheft.gov`, correct: true, why: "Thieves use a member ID to bill care to you. The insurer can flag it, and IdentityTheft.gov walks you through recovery." },
              { text: "Call the number in the text and ask them to delete the info", correct: false, why: "That number belongs to the scammer. Calling back only gives them another try." },
              { text: "Do nothing, since a member ID is useless without the card", correct: false, why: "A member ID plus a birthday is enough to bill care or prescriptions in your name." },
            ])
            : steps(r, `${n.name} already shared ${n.his} member ID. What should ${n.he} do now?`, [
              { text: `Call ${n.his} insurer and report ${n.his} member ID as stolen` },
              { text: "Forward the text to 7726 (SPAM), then delete it" },
              { text: "Skip the pickup until the pharmacy calls again" },
            ]),
          tells: scam
            ? [
              `The number isn't the pharmacy's saved one (${real}). It only looks close.`,
              "The pharmacy already had the new insurance card. Nobody needed to \"confirm\" anything.",
              "Scammers blast \"your refill is ready\" texts because some people really are waiting on one.",
            ]
            : [
              "The sender matches the pharmacy's saved number exactly.",
              "It fits what we know: a refill was called in and the insurance really changed.",
              "The pharmacy confirmed it on its trusted number.",
            ],
          tip: scam
            ? "A message that matches your plans can still be fake. Call back on a number you saved yourself, not one in the text."
            : "Before you call a number in a text, check it against one you already trust. When they match, you're talking to the real business.",
          source: scam ? SOURCES.scammed : SOURCES.phishing,
        };
      },
    },

    {
      id: "library-hold-email",
      tier: 1,
      build(r) {
        const n = r.pick([NEIGHBORS.priya, NEIGHBORS.okafor, NEIGHBORS.ines]);
        const greet = { priya: "Priya", okafor: "Mr. Okafor", ines: "Inés" }[n.id];
        const scam = r.chance(0.55);
        const book = r.pick(["Intro to Game Design", "The Bread Baker's Year", "Birds of the Northeast", "Fixing Old Clocks", "A Short History of Maps"]);
        const placed = `Oct ${r.int(20, 30)}`;
        const real = "maplehollowlibrary.example";
        const url = scam
          ? r.pick([
            `https://${real}.holds-signin.example/account`,
            `https://catalog.${r.lookalike("maplehollowlibrary")}.example/holds`,
            `https://maplehollowlibrary-holds.example/account`,
          ])
          : r.pick([`https://${real}/account/holds`, `https://catalog.${real}/holds`]);
        const site = owner(url);
        const [libNum] = phones(r, 1);
        return {
          neighbor: n,
          resident: `${n.name} says: "I already clicked the link and signed in with my library card number and PIN. Was that safe?"`,
          channel: "email",
          from: "holds@maplehollowlibrary.example",
          body: `Hi ${greet}! Your hold "${book}" is ready. Please sign in within 7 days to confirm pickup: ${url}`,
          history: [
            `${n.name} placed a hold on "${book}" on ${placed}.`,
            "The library's website is maplehollowlibrary.example.",
          ],
          directory: [
            {
              name: "Maple Hollow Library",
              contact: `${libNum} · maplehollowlibrary.example`,
              result: scam
                ? `"${cap(n.his)} hold is still third in line, and we never ask anyone to sign in from an email. That page isn't ours."`
                : `"Yep, ${book} is on the hold shelf for ${n.him}!"`,
            },
          ],
          puzzle: {
            kind: "link",
            tool: "UNTANGLE LINK",
            prompt: "Click the part of the address that shows who really owns this page.",
            url,
            reward: scam
              ? `The page belongs to ${site}, not the library's ${real}.`
              : `It's ${real}, the library's real site. Everything after that is just a page on it.`,
          },
          scam,
          loss: scam ? r.money(400, 800) : undefined,
          missedCost: scam ? undefined : `${n.name}'s hold expired and the book went to the next person on the waitlist.`,
          nextStep: scam
            ? steps(r, `${n.name} typed ${n.his} card number and PIN into that page. What now?`, [
              { text: `Change ${n.his} PIN on the library's real site, and anywhere else ${n.he} uses it`, correct: true, why: "If you typed a password into a fake page, change it right away, starting with any account that reuses it." },
              { text: "Reply to the email and ask if it's real", correct: false, why: "The reply goes straight to the scammer, who will happily say yes." },
              { text: "Leave it, since a library card has nothing worth stealing", correct: false, why: "The account holds an address and phone, and a reused PIN can unlock other accounts." },
            ])
            : steps(r, `${n.name} already signed in through the link. What should ${n.he} do now?`, [
              { text: `Change ${n.his} library PIN right away` },
              { text: "Report the email to the library as phishing" },
              { text: `Call ${n.his} bank to freeze ${n.his} cards` },
            ]),
          tells: scam
            ? [
              `The link really opens ${site}. The library's name is just a costume.`,
              "The library says the hold isn't even ready yet.",
              "Libraries don't need you to sign in from an email to pick up a book.",
            ]
            : [
              `${n.name} expected this: ${n.he} placed the hold.`,
              `The link really opens ${real}, the library's own site.`,
              "No payment, no threat, and the library confirmed the hold.",
            ],
          tip: "To read a link, find the last two parts of the name right before the first single slash. That's who really owns the page.",
          source: SOURCES.phishing,
        };
      },
    },

    {
      id: "water-shutoff-email",
      tier: 1,
      build(r) {
        const n = NEIGHBORS.rosa;
        const scam = r.chance(0.5);
        const real = "water.maplehollow.example";
        const shown = scam ? `water.${r.lookalike("maplehollow")}.example` : real;
        const when = r.pick(["tomorrow", "Thursday", "Friday"]);
        const hours = r.pick(["7 to 9 a.m.", "8 to 10 a.m.", "6 to 11 a.m."]);
        const [office] = phones(r, 1);
        return {
          neighbor: n,
          resident: `Rosa says: "I already put up a sign that we're closed ${when} morning, and I signed in to the outage map with my water account. Was that a trick?"`,
          channel: "email",
          from: `notices@${shown}`,
          body: `Water service on Pine Street will be shut off ${when} from ${hours} for a water main repair. Sign in to see your street on the outage map: https://${shown}/outages`,
          history: [
            "The bakery is on Pine Street.",
            "Rosa pays her water bill online with a saved card.",
          ],
          directory: [
            {
              name: "Maple Hollow Water Office",
              contact: office,
              result: scam
                ? "\"There's no repair planned on Pine Street, and that email isn't ours.\""
                : `"Yes, that's real: the Pine Street repair runs ${hours} ${when}. Sorry for the trouble!"`,
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE SENDER",
            prompt: "Compare the email's web address with the one printed on Rosa's paper water bill.",
            recordLabel: "Paper bill",
            record: real,
            shownLabel: "This email",
            shown,
            reward: scam
              ? `The email uses ${shown}. The paper bill says ${real}. One sneaky letter is different.`
              : "They match exactly. It's the city water office's real address.",
          },
          scam,
          loss: scam ? r.money(400, 900) : undefined,
          missedCost: scam ? undefined : "The bakery was caught without water in the middle of dough prep.",
          nextStep: scam
            ? steps(r, "Rosa typed her water account login into that page. What should she do first?", [
              { text: "Change her water account password on the real site, then check her saved card for charges", correct: true, why: "Change any password you gave a fake page right away, and watch the card it can reach." },
              { text: "Reply to the email to ask when the repair really is", correct: false, why: "The reply goes to the scammer, not the water office." },
              { text: "Sign in again on the same page to see if it still works", correct: false, why: "Every visit to a fake page is another chance for it to steal something." },
            ])
            : steps(r, "Rosa already changed her plans. What should she do now?", [
              { text: "Take the sign down and report the email to the city" },
              { text: "Change her water account password and call her bank" },
              { text: "Reply to the sender asking for proof" },
            ]),
          tells: scam
            ? [
              `The address is ${shown}, a look-alike of the real ${real}.`,
              "The water office has no repair planned on Pine Street.",
              "A calm, helpful notice can still be bait for your login.",
            ]
            : [
              "The address matches the one on her paper bill exactly.",
              "The water office confirmed the repair through a trusted contact.",
              "It sounds alarming, but asks for no payment or personal info.",
            ],
          tip: "Urgent doesn't always mean scam, and calm doesn't always mean safe. Check the sender against something you already have, like a paper bill.",
          source: SOURCES.phishing,
        };
      },
    },

    {
      id: "package-redelivery-text",
      tier: 1,
      build(r) {
        const n = r.pick([NEIGHBORS.dev, NEIGHBORS.rosa, NEIGHBORS.okafor]);
        const item = { dev: "shelf brackets", rosa: "a new cake stand", okafor: "a box of used books" }[n.id];
        const scam = r.chance(0.55);
        const trk = `PW${r.int(4000000, 9999999)}`;
        const shownTrk = scam ? nearPhone(r, trk) : trk;
        const newDay = r.pick(DAYS_OF_WEEK);
        const url = scam
          ? r.pick([
            `https://parcelway.example-redeliver.example/${shownTrk}`,
            `https://track.${r.lookalike("parcelway")}.example/${shownTrk}`,
            `https://parcelway-redelivery.example/${shownTrk}`,
          ])
          : r.pick([`https://parcelway.example/redeliver/${trk}`, `https://track.parcelway.example/${trk}`]);
        const site = owner(url);
        return {
          neighbor: n,
          resident: `${n.name} says: "I tapped the link and picked ${newDay} for redelivery. It asked for my name, address, and phone, so I typed them in."`,
          channel: "text",
          from: "Parcelway",
          body: `Parcelway: We missed you today. Package ${shownTrk} is back at our depot. Pick a new delivery day: ${url}`,
          history: [
            `${n.name} ordered ${item} online. The store's email says it ships by Parcelway, tracking ${trk}.`,
            `${cap(n.he)} signed up for Parcelway text alerts at checkout.`,
          ],
          directory: [
            {
              name: "Parcelway tracking (typed in by hand)",
              contact: "parcelway.example",
              result: scam
                ? `${trk}: "Out for delivery today." No missed attempts.`
                : `${trk}: "Delivery missed. Rescheduled for ${newDay}."`,
            },
          ],
          puzzle: {
            kind: "link",
            tool: "UNTANGLE LINK",
            prompt: "Click the part of the address that shows who really owns this page.",
            url,
            reward: scam
              ? `This page belongs to ${site}. Parcelway's real site is parcelway.example.`
              : "It's parcelway.example, the carrier's real site.",
          },
          scam,
          loss: scam ? r.money(400, 700) : undefined,
          missedCost: scam ? undefined : `${n.name}'s package sat at the depot for a week and went back to the seller.`,
          nextStep: scam
            ? steps(r, `${n.name} gave the page ${n.his} name, address, and phone. What now?`, [
              { text: "Forward the text to 7726 (SPAM), delete it, and check tracking on parcelway.example typed in by hand", correct: true, why: "Forwarding to 7726 helps carriers block the sender. Then check deliveries only on the real site, and expect more scam texts." },
              { text: "Reply STOP so they quit texting", correct: false, why: "Replying, even STOP, tells scammers the number works. More scam texts follow." },
              { text: "Go back to the page and finish any steps it asks for", correct: false, why: "The next step is usually a small \"fee\" to steal full card details." },
            ])
            : steps(r, `${n.name} already picked a new day. What should ${n.he} do now?`, [
              { text: "Forward the text to 7726 (SPAM), then delete it" },
              { text: "Reply STOP so they quit texting" },
              { text: "Call the store and cancel the order" },
            ]),
          tells: scam
            ? [
              `The tracking number is ${shownTrk}. ${n.name}'s real one is ${trk}.`,
              `The link really opens ${site}, not parcelway.example.`,
              "Real tracking says the package is still on its way.",
            ]
            : [
              "The tracking number matches the store's email exactly.",
              "The link really opens parcelway.example.",
              `${n.name} signed up for these alerts, and tracking confirms the missed delivery.`,
            ],
          tip: "Don't trust delivery texts by looks. Check the tracking number against your order, and look up deliveries on the carrier's real site yourself.",
          source: SOURCES.spamText,
        };
      },
    },

    {
      id: "ssa-callback-voicemail",
      tier: 1,
      build(r) {
        const n = r.pick([NEIGHBORS.ines, NEIGHBORS.okafor]);
        const scam = r.chance(0.55);
        const [real] = phones(r, 1, true);
        const shown = scam ? nearPhone(r, real) : real;
        const changes = ["mailing address", "direct deposit bank"];
        const asked = r.pick(changes);
        const mentioned = scam && r.chance(0.5) ? changes.find((c) => c !== asked) : asked;
        const agent = r.pick(["Ms. Dunn", "Mr. Ortiz", "Ms. Bell", "Mr. Shah"]);
        const day = r.pick(DAYS_OF_WEEK);
        return {
          neighbor: n,
          resident: `${n.name} says: "I called back and confirmed my Social Security number and bank account so the change goes through. Did I do right?"`,
          channel: "voicemail",
          from: shown,
          body: `"Hi, this is ${agent} with Social Security, about the ${mentioned} change you asked for. We need to verify a few details before it goes through. Please call me back at ${shown}."`,
          inMessageCall: scam
            ? `"${agent}" says one more step is needed: a "processing fee" by gift card.`
            : undefined,
          history: [
            `${n.name} asked the Social Security office to update ${n.his} ${asked} on ${day}.`,
          ],
          directory: [
            {
              name: "Social Security office (saved contact)",
              contact: real,
              result: scam
                ? "\"Nobody here left that message, and we don't call to collect bank details. Please don't share anything else.\""
                : `"Yes, ${agent} called. The ${asked} change is all set."`,
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE NUMBER",
            prompt: `Compare the callback number with the office number ${n.name} saved.`,
            recordLabel: "Saved office number",
            record: real,
            shownLabel: "Voicemail",
            shown,
            reward: scam
              ? `The voicemail says ${shown}. The real office is ${real}. ${n.name} called a stranger.`
              : `They match exactly. ${n.name} called the real office back.`,
          },
          scam,
          loss: scam ? r.money(1000, 1800) : undefined,
          missedCost: scam ? undefined : `${n.name}'s ${asked} change stalled, and ${n.his} next payment was delayed.`,
          nextStep: scam
            ? steps(r, `${n.name} gave a stranger ${n.his} Social Security number and bank account. What now?`, [
              { text: `Call ${n.his} bank at the number on ${n.his} card, then follow the plan at IdentityTheft.gov`, correct: true, why: "The bank can watch or close the account, and IdentityTheft.gov gives a step-by-step plan for a stolen Social Security number." },
              { text: `Call ${agent} back and ask to cancel everything`, correct: false, why: "That number reaches the scammer, who will invent a new reason to collect more." },
              { text: "Wait for the next benefits payment to see if it shows up", correct: false, why: "Waiting gives the thief time to redirect payments or open accounts." },
            ])
            : steps(r, `${n.name} already confirmed ${n.his} details. What should ${n.he} do now?`, [
              { text: "Go to IdentityTheft.gov and report a stolen Social Security number" },
              { text: `Call ${n.his} bank and close the account`, },
              { text: "Report the voicemail at ReportFraud.ftc.gov" },
            ]),
          tells: scam
            ? [
              `The callback number is a look-alike of the real office (${real}).`,
              mentioned === asked
                ? "Scammers know people update their records. A real-sounding reason isn't proof."
                : `${n.name} asked about ${n.his} ${asked}, but the voicemail says ${mentioned}.`,
              "The office says nobody there called.",
            ]
            : [
              `${n.name} really did ask for a ${asked} change.`,
              "The callback number matches the office number exactly.",
              "The office confirmed the call on its trusted number.",
            ],
          tip: "Government impostors sound calm and official. Call back only on a number you already trust, never one from the message.",
          source: SOURCES.government,
        };
      },
    },

    {
      id: "grandkid-bail-voicemail",
      tier: 1,
      build(r) {
        const n = NEIGHBORS.ines;
        const kid = r.pick([
          { name: "Mateo", he: "he", him: "him" },
          { name: "Lucía", he: "she", him: "her" },
        ]);
        const lawyer = r.pick(["Mr. Grant", "Mr. Fields", "Ms. Lane"]);
        const lawyerHe = lawyer.startsWith("Ms.") ? "She" : "He";
        const bail = r.money(2000, 4000, 500);
        const paid = r.money(300, 800, 100);
        const [kidNum, momNum, unknown] = phones(r, 3);
        const twist = r.pick(["grandma", "drive", "trip"]);
        const facts = {
          grandma: `${kid.name} has always called her "Grandma," never "Abuela."`,
          drive: `${kid.name} doesn't drive yet. ${cap(kid.he)} takes the bus everywhere.`,
          trip: `${kid.name} is on a school trip to Lakeport until Sunday.`,
        };
        const lines = [
          `${twist === "grandma" ? "Abuela" : "Grandma"}? It's me, ${kid.name}. I'm in trouble.`,
          twist === "trip"
            ? "I crashed the car at the mall here in Maple Hollow, and I'm at the police station."
            : "I crashed the car on the way home, and I'm at the police station.",
          `Please don't tell Mom. My lawyer, ${lawyer}, is going to call you.`,
          `${lawyerHe} says gift cards are the fastest way to pay the bail. Please hurry!`,
        ];
        const answer = { grandma: 0, drive: 1, trip: 1 }[twist];
        return {
          neighbor: n,
          resident: `Grandma Inés says: "${kid.name}'s lawyer told me bail is ${usd(bail)}. I already bought ${usd(paid)} in gift cards and read ${lawyerHe === "She" ? "her" : "him"} the numbers. What now?"`,
          channel: "voicemail",
          from: `Unknown number (${unknown})`,
          body: `"${lines.join(" ")}"`,
          inMessageCall: `"${lawyer}" answers right away: "We still need ${usd(bail - paid)} more in gift cards. And remember, don't tell anyone."`,
          history: [
            `${kid.name} usually calls from ${kidNum}.`,
            facts[twist],
          ],
          directory: [
            { name: `${kid.name} (grandchild)`, contact: kidNum, result: "No answer. It goes to voicemail. (Maybe just busy…)" },
            { name: `${kid.name}'s mom`, contact: momNum, result: `"I just talked to ${kid.name}. ${cap(kid.he)}'s fine! That's a scam, Mamá!"` },
          ],
          puzzle: {
            kind: "story",
            tool: "CHECK THE STORY",
            prompt: `Which line of the voicemail doesn't fit what we know about ${kid.name}?`,
            lines,
            answer,
            reward: `That line doesn't fit: ${facts[twist]} The caller isn't ${kid.name}.`,
          },
          scam: true,
          loss: r.money(900, 1600),
          nextStep: steps(r, `Inés already sent ${usd(paid)} in gift card numbers. What's the best next step?`, [
            { text: "Call the gift card company now, say it was a scam, and ask for her money back", correct: true, why: "Contact the card company right away. They can sometimes freeze cards that haven't been spent yet." },
            { text: `Call ${lawyer} back and demand a refund`, correct: false, why: `${lawyer} is the scammer, and will invent another reason to ask for more.` },
            { text: `Buy the remaining ${usd(bail - paid)} so ${kid.name} gets home`, correct: false, why: `${kid.name} is safe. Any extra money goes straight to the scammer.` },
          ]),
          tells: [
            "An emergency plus \"don't tell anyone\" is the classic family-emergency setup.",
            "Payment by gift card. No real lawyer, court, or police station asks for that.",
            `The story clashes with what she knows: ${facts[twist]}`,
            `Unknown number, not ${kid.name}'s usual one. Voices can be faked.`,
          ],
          tip: "If you paid a scammer with a gift card, contact the card company immediately, tell them it was a scam, and ask for a refund.",
          source: SOURCES.familyEmergency,
        };
      },
    },

    {
      id: "tech-support-popup",
      tier: 1,
      build(r) {
        const n = NEIGHBORS.dev;
        const paid = r.pick([299, 399, 499]);
        const extra = r.pick([49.99, 89.99, 149.99, 199.99]);
        const [popNum, repairNum] = phones(r, 2);
        const brand = r.pick([["SECUREPC SUPPORT", "SPC*PROTECT RENEW"], ["TECHSHIELD HELP", "TSH*LIFETIME PLAN"], ["PC RESCUE DESK", "PCR*CARE MONTHLY"]]);
        const base = r.int(3, 20);
        const rows = r.shuffle([
          { date: `Nov ${base}`, desc: "LUMBER & BOLT SUPPLY", amount: cents(r, 120, 480) },
          { date: `Nov ${base}`, desc: "MAPLE HOLLOW COFFEE", amount: cents(r, 3, 9) },
          { date: `Nov ${base + 1}`, desc: "HOLLOW ELECTRIC CO", amount: cents(r, 90, 210) },
          { date: `Nov ${base + 1}`, desc: brand[0], amount: `$${paid}.00` },
          { date: `Nov ${base + 2}`, desc: brand[1], amount: `$${extra}`, bad: true },
        ]);
        const answer = rows.findIndex((row) => row.bad);
        return {
          neighbor: n,
          resident: `Dev says: "My computer said it had a virus. I called, let them connect to fix it, and paid $${paid} by card. Now what?"`,
          channel: "popup",
          from: "A website on the shop computer",
          body: `Security alert: suspicious activity detected on this device. Your files may be at risk. Call support at ${popNum} before closing this window.`,
          inMessageCall: "The \"technician\" says the virus is back and offers a \"lifetime protection plan.\"",
          history: [
            "The warning appeared while Dev was browsing a supplier's website.",
            `The $${paid} payment is the only charge Dev agreed to.`,
          ],
          directory: [
            { name: "Bluebird Computer Repair (saved contact)", contact: repairNum, result: "\"That's a fake warning. Real security alerts never ask you to call a number.\"" },
          ],
          puzzle: {
            kind: "audit",
            tool: "AUDIT STATEMENT",
            prompt: "Dev's card activity since the call. Which charge did he NOT agree to?",
            rows: rows.map(({ date, desc, amount }) => ({ date, desc, amount })),
            answer,
            reward: `${brand[1]} for $${extra}: the same "support" company charged Dev again without asking.`,
          },
          scam: true,
          loss: r.money(700, 1400),
          nextStep: steps(r, "The scammer had remote access and Dev's card. What's the best next step?", [
            { text: "Run a security scan, remove what it finds, and ask his card company to reverse both charges", correct: true, why: "After remote access, update security software, scan, and delete threats. Card charges can often be disputed." },
            { text: `Call ${popNum} so they can uninstall their program`, correct: false, why: "That reconnects him to the scammers, who will likely ask for more money." },
            { text: "Just restart the computer; that removes remote access", correct: false, why: "A restart doesn't remove programs the scammer installed." },
          ]),
          tells: [
            "A web page used a scary warning to push Dev to call its own number.",
            "Real security warnings never ask you to call a phone number.",
            "A second charge he never approved shows the scammers kept his card.",
          ],
          tip: "If a tech support scammer got remote access, scan and clean the computer, and dispute card charges right away.",
          source: SOURCES.techSupport,
        };
      },
    },

    {
      id: "grandkid-code-dm",
      tier: 1,
      build(r) {
        const n = NEIGHBORS.ines;
        const kid = r.pick(["Mateo", "Lucía"]);
        const app = r.pick(["ChatNest", "Pingly", "Hollowgram"]);
        const contest = r.pick(["a photo contest", "a talent show", "a science fair prize"]);
        const code = String(r.int(100000, 999999));
        const [kidNum] = phones(r, 1);
        const options = r.shuffle([
          { text: `Voting for ${kid} in ${contest}`, right: false },
          { text: `Signing in to Inés's own ${app} account`, right: true },
          { text: `Confirming ${kid}'s new phone number`, right: false },
        ]);
        return {
          neighbor: n,
          resident: `Grandma Inés asks: "${kid} needs a code for ${contest}. I haven't sent it yet. Should I?"`,
          channel: "dm",
          from: `${kid}'s usual ${app} account`,
          body: `"Abuela, can you help me win ${contest}? You'll get a 6-digit code by text. Just send it to me here so your vote counts!"`,
          history: [
            `The message is in Inés's usual ${app} chat with ${kid}.`,
            `A text just arrived with a 6-digit code: ${code}.`,
          ],
          directory: [
            { name: `${kid} (saved phone number)`, contact: kidNum, result: "\"I didn't send that! Someone got into my account. Please don't send the code.\"" },
          ],
          puzzle: {
            kind: "choice",
            tool: "READ THE CODE TEXT",
            prompt: `The text says: "Your ${app} sign-in code is ${code}. Don't share it with anyone." What is the code really for?`,
            options: options.map((o) => o.text),
            answer: options.findIndex((o) => o.right),
            reward: `The code signs in to Inés's OWN ${app} account. Whoever gets it can take her account over too.`,
          },
          scam: true,
          loss: r.money(400, 900),
          nextStep: steps(r, "Inés hasn't sent the code. What should she do?", [
            { text: `Keep the code private and call ${kid} at the saved number to warn them`, correct: true, why: `Never share a verification code. Calling ${kid} another way lets them know their account was taken over.` },
            { text: `Reply with a question only ${kid} would know`, correct: false, why: "A scammer inside the account can scroll old chats for the answer, and replying keeps them talking." },
            { text: `Send the code, since it's ${kid}'s real account`, correct: false, why: "The code signs in to Inés's own account. Sharing it would hand that over too." },
          ]),
          tells: [
            "A familiar account can be taken over and used to impersonate someone.",
            "The code text says it's for signing in, not voting.",
            `${kid} confirmed through a separate trusted number that the message wasn't from them.`,
          ],
          tip: "Keep verification codes to yourself. If a friend asks for one, contact them another way.",
          source: SOURCES.verificationCode,
        };
      },
    },

    // ---------------------------------------------------------------- TIER 2
    {
      id: "pinecrest-card-alert",
      tier: 2,
      build(r) {
        const n = r.pick([NEIGHBORS.rosa, NEIGHBORS.dev, NEIGHBORS.okafor]);
        const scam = r.chance(0.5);
        const code = safeShortCode(r);
        const shown = scam ? r.lookalike(code) : code;
        const [cardNum] = phones(r, 1, true);
        const follow = scam ? nearPhone(r, cardNum) : cardNum;
        const amount = cents(r, 80, 900);
        const merchant = r.pick(["Lakeside Electronics", "Northgate Fuel", "an online shoe store", "Riverbend Furniture"]);
        const reached = r.chance(0.6);
        return {
          neighbor: n,
          resident: `${n.name} says: "I replied NO, and it texted back a number for the fraud team. I haven't called yet. Should I?"`,
          channel: "text",
          from: shown,
          body: `Pinecrest Bank: We paused your debit card after a ${amount} purchase at ${merchant}. Was this you? Reply YES or NO.`,
          inMessageCall: scam
            ? "A calm \"fraud agent\" answers and asks for the code they're texting \"to unlock your card.\""
            : undefined,
          history: [
            `${n.name} has Pinecrest text alerts turned on.`,
            `The follow-up text says: "Thanks. Call our fraud team at ${follow}."`,
          ],
          directory: [
            {
              name: "Pinecrest Bank (number on back of card)",
              contact: cardNum,
              result: !reached
                ? "Long hold music… the line drops after 20 minutes. (Couldn't get through.)"
                : scam
                  ? `"There's no alert on ${n.his} card and nothing is paused. That text wasn't from us."`
                  : `"Yes, we paused the card over a ${amount} charge at ${merchant}. The fraud team can take it from here."`,
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE SENDER",
            prompt: `Compare the sender with the Pinecrest short code saved in ${n.name}'s phone.`,
            recordLabel: "Saved Pinecrest code",
            record: code,
            shownLabel: "This text",
            shown,
            reward: scam
              ? `The sender is ${shown}, but Pinecrest's real short code is ${code}.`
              : `They match: ${code} is Pinecrest's real short code.`,
          },
          scam,
          loss: scam ? r.money(800, 1600) : undefined,
          missedCost: scam ? undefined : `${n.name}'s card stayed frozen for days while the real fraud charge went unreported.`,
          nextStep: scam
            ? steps(r, `${n.name} replied NO but hasn't called. What should ${n.he} do?`, [
              { text: "Skip the texted number, call Pinecrest at the number on the card, and forward the texts to 7726", correct: true, why: "Call the bank on a number you trust. Forwarding to 7726 helps carriers block the sender." },
              { text: "Call the texted number, but don't give them any codes", correct: false, why: "That line belongs to the scammer, who is trained to talk you into \"just one\" code." },
              { text: "Reply STOP to both texts and forget about it", correct: false, why: "Replying shows the number is active, and the bank still hasn't heard about it." },
            ])
            : steps(r, `${n.name} replied NO. What should ${n.he} do now?`, [
              { text: "Forward both texts to 7726 (SPAM), then delete them" },
              { text: "Ignore it; the card will unlock by itself" },
              { text: "Reply STOP to turn off the alerts" },
            ]),
          tells: scam
            ? [
              `The sender is ${shown}, a look-alike of Pinecrest's real code (${code}).`,
              `The fraud team number (${follow}) isn't the one on the back of the card (${cardNum}).`,
              "A YES/NO alert looks real; the trap is the number it sends you to next.",
            ]
            : [
              "The sender matches Pinecrest's saved short code.",
              "The fraud team number is the same one printed on the back of the card.",
              "It asked only YES or NO. No link, password, or code.",
            ],
          tip: "Real fraud alerts exist. Before you call back, make sure the number matches one you already trust, like the back of your card.",
          source: scam ? SOURCES.spamText : SOURCES.phishing,
        };
      },
    },

    {
      id: "library-volunteer-voicemail",
      tier: 2,
      build(r) {
        const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.ines]);
        const greet = { okafor: "Mr. Okafor", ines: "Inés" }[n.id];
        const scam = r.chance(0.5);
        const [coord, otherCoord] = r.shuffle(["Ms. Park", "Mr. Reyes", "Ms. Adeyemi", "Mr. Lind"]);
        const [program, otherProgram] = r.shuffle(["reading club", "homework help", "story time", "the book sale"]);
        const meetDay = r.pick(["Tuesday", "Wednesday", "Thursday"]);
        const formDay = r.pick(["Monday", "last Friday", "last week"]);
        const [libNum, callback] = phones(r, 2, true);
        const wrong = scam ? r.pick(["coord", "program"]) : null;
        const lines = [
          `Hi ${greet}, it's ${wrong === "coord" ? otherCoord : coord} at Maple Hollow Library.`,
          `Thanks for signing up to help with ${wrong === "program" ? otherProgram : program}.`,
          `Can you come in ${meetDay} at 10? Bring a photo ID.`,
          `For the background check, call me at ${callback} with your Social Security number.`,
        ];
        const reached = r.chance(0.6);
        return {
          neighbor: n,
          resident: `${n.name} says: "I called back, said yes to ${meetDay}, and gave my Social Security number for the background check. Was that a mistake?"`,
          channel: "voicemail",
          from: `Maple Hollow Library (${libNum})`,
          body: `"${lines.join(" ")}"`,
          history: [
            `${n.name} signed up to volunteer with ${program} ${formDay}.`,
            `${coord} is the library's volunteer coordinator.`,
          ],
          directory: [
            {
              name: "Maple Hollow Library (main line)",
              contact: libNum,
              result: !reached
                ? "Recorded message: \"The library opens at noon today.\" (No one to ask yet.)"
                : scam
                  ? `"We haven't called any volunteers yet. ${coord} does background checks in person, at the front desk."`
                  : `"Yes, ${coord} called. See you ${meetDay}!"`,
            },
          ],
          puzzle: {
            kind: "story",
            tool: "CHECK THE STORY",
            prompt: "Does every line of the voicemail fit the History tab?",
            lines,
            answer: scam ? (wrong === "coord" ? 0 : 1) : -1,
            reward: scam
              ? wrong === "coord"
                ? `The caller says ${otherCoord}, but the library's coordinator is ${coord}.`
                : `The caller says ${otherProgram}, but ${n.name} signed up for ${program}.`
              : `Every detail fits: ${coord}, ${program}, and ${meetDay}. The story holds up.`,
          },
          scam,
          loss: scam ? r.money(900, 1600) : undefined,
          missedCost: scam ? undefined : `${n.name} skipped the orientation, and ${program} lost its newest volunteer.`,
          nextStep: scam
            ? steps(r, `${n.name} gave a stranger ${n.his} Social Security number. What now?`, [
              { text: "Go to IdentityTheft.gov and follow its plan for a stolen Social Security number", correct: true, why: "IdentityTheft.gov gives a step-by-step recovery plan, like placing a fraud alert or freezing credit." },
              { text: "Call the number back and ask them to delete it", correct: false, why: "That number belongs to the scammer. They won't delete anything." },
              { text: "Wait and see if anything strange happens", correct: false, why: "Thieves can open accounts fast. The sooner you act, the easier it is to fix." },
            ])
            : steps(r, `${n.name} already said yes. What should ${n.he} do now?`, [
              { text: `Call back and cancel the ${meetDay} meeting` },
              { text: "Report the call at ReportFraud.ftc.gov" },
              { text: "Freeze credit and file at IdentityTheft.gov" },
            ]),
          tells: scam
            ? [
              wrong === "coord"
                ? `Wrong name: the library's coordinator is ${coord}, not ${otherCoord}.`
                : `Wrong program: ${n.name} signed up for ${program}, not ${otherProgram}.`,
              "Caller ID showed the library, but caller ID can be faked.",
              "It asked for a Social Security number by phone. The real library does background checks in person.",
            ]
            : [
              `Every detail matched: ${coord}, ${program}, and an expected callback.`,
              `${n.name} signed up to volunteer, so the call made sense.`,
              "Real volunteer roles often need a background check.",
            ],
          tip: "Scammers copy real situations. Check the small details (names, dates, what you signed up for) against what you already know.",
          source: SOURCES.impostor,
        };
      },
    },

    {
      id: "college-portal-email",
      tier: 2,
      build(r) {
        const n = NEIGHBORS.priya;
        const scam = r.chance(0.55);
        const realHost = "portal.maplehollowcollege.example";
        const fakeHost = r.pick([
          `portal.${r.lookalike("maplehollowcollege")}.example`,
          "maplehollowcollege.example.portal-upload.example",
          "portal-maplehollowcollege.example",
        ]);
        const host = scam ? fakeHost : realHost;
        const [itNum, fakeNum] = phones(r, 2);
        const page = (h, help) => ({
          url: `https://${h}/upload`,
          title: "Maple Hollow College · Student Portal",
          lines: ["Sign in with your college email and password.", "Then upload your file to the class dropbox.", `IT help: ${help}`],
        });
        const linkFirst = r.chance(0.5);
        const linked = page(host, scam ? fakeNum : itNum);
        const bookmark = page(realHost, itNum);
        const sites = linkFirst ? [linked, bookmark] : [bookmark, linked];
        const reached = r.chance(0.6);
        return {
          neighbor: n,
          resident: "Priya says: \"I already signed in through the email's upload page and turned in my essay. Is this real?\"",
          channel: "email",
          from: "helpdesk@maplehollowcollege.example",
          body: `The student portal goes offline for maintenance at 8 p.m. tonight. Finish any uploads before then: https://${host}/upload`,
          history: [
            "Priya has an essay due tonight at 11:59.",
            `Her bookmarked portal is https://${realHost}.`,
          ],
          directory: [
            {
              name: "College IT desk (saved contact)",
              contact: itNum,
              result: !reached
                ? "Voicemail: \"We're helping other students. Please leave a message.\" (No answer.)"
                : scam
                  ? "\"There's no maintenance tonight, and we never email upload links. We don't see her essay either.\""
                  : "\"Yes, maintenance starts at 8. Her essay came through fine.\"",
            },
          ],
          puzzle: {
            kind: "site",
            tool: "COMPARE SITES",
            prompt: `Site ${linkFirst ? "A" : "B"} is the page Priya used. Site ${linkFirst ? "B" : "A"} is her bookmark. Is one of them fake?`,
            sites,
            answer: scam ? (linkFirst ? 0 : 1) : -1,
            reward: scam
              ? `The page she used lives at ${owner(linked.url)}, and its help number is wrong. It's a copy.`
              : "Same address, same help number. They're the same real portal.",
          },
          scam,
          loss: scam ? r.money(600, 1200) : undefined,
          missedCost: scam ? undefined : "Priya missed her upload window when the portal went offline, and lost points for a late essay.",
          nextStep: scam
            ? steps(r, "Priya typed her college password into that page. What should she do first?", [
              { text: "Change her password on the real portal, upload her essay there, and tell the IT desk", correct: true, why: "Change a password you gave a fake page right away. Then turn in the work on the real site." },
              { text: "Reply to the email to ask whether her essay arrived", correct: false, why: "Replies go to the scammer. They'll say it did." },
              { text: "Wait until after 8 p.m. to see if the portal really goes down", correct: false, why: "Waiting gives the scammer hours inside her college account." },
            ])
            : steps(r, "Priya already uploaded through the link. What should she do now?", [
              { text: "Run a virus scan and change her portal password" },
              { text: "Report the email to the college as phishing" },
              { text: "Upload the essay again after 8 p.m. to be safe" },
            ]),
          tells: scam
            ? [
              `The link opens ${owner(linked.url)}, not maplehollowcollege.example.`,
              "The copied page even lists a different IT help number.",
              "The email looked calm and normal. That's the point.",
            ]
            : [
              "The link opens the same portal as her bookmark.",
              "The help number matches the IT desk's saved contact.",
              "It asked for nothing new, just a heads-up about timing.",
            ],
          tip: "Fake pages can copy every word. Compare the address with your own bookmark before you sign in.",
          source: SOURCES.phishing,
        };
      },
    },

    {
      id: "job-fake-check",
      tier: 2,
      build(r) {
        const n = NEIGHBORS.priya;
        const company = r.pick([["MapleTech", "mapletech"], ["Birchline Media", "birchline"], ["Northfield Data", "northfielddata"]]);
        const realAddr = `jobs@${company[1]}.example`;
        const fakeAddr = `jobs@${r.lookalike(company[1])}.example`;
        const vendor = r.money(900, 1800, 50);
        const check = vendor + r.money(400, 1200, 100);
        const [careerNum] = phones(r, 1);
        const reached = r.chance(0.7);
        return {
          neighbor: n,
          resident: `Priya says: "I got the job! I deposited their ${usd(check)} check and it already shows in my account. They want me to pay the equipment vendor ${usd(vendor)} today."`,
          channel: "email",
          from: fakeAddr,
          body: `Welcome to ${company[0]}! Your equipment check is attached. Deposit it, then pay our approved vendor for your laptop today so it ships before your start date. The rest covers your first week.`,
          history: [
            `Priya applied to ${company[0]} through a job site.`,
            "Her only \"interview\" was a 10-minute chat by text.",
          ],
          directory: [
            {
              name: "College career center (saved contact)",
              contact: careerNum,
              result: reached
                ? `"${company[0]}'s real hiring team uses ${realAddr}. A check you deposit, then pay out of, is a classic fake-check scam."`
                : "\"Everyone's at the career fair today. Call back tomorrow.\" (No help yet.)",
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE SENDER",
            prompt: `${company[0]}'s real careers page lists ${realAddr}. Compare it with the sender.`,
            recordLabel: "Careers page",
            record: realAddr,
            shownLabel: "Offer email",
            shown: fakeAddr,
            reward: `The offer came from ${fakeAddr}, a look-alike of ${company[0]}'s real address.`,
          },
          scam: true,
          loss: vendor,
          nextStep: steps(r, "The check already shows in her account. What should Priya do?", [
            { text: "Pay nothing, and ask her bank to check whether the check is real", correct: true, why: "Banks make deposits available fast, but a fake check can bounce weeks later, and you owe the money back." },
            { text: "Pay the vendor now, since the funds cleared", correct: false, why: "\"Available\" doesn't mean the check is good. When it bounces, she owes the bank all of it." },
            { text: "Pay half now and the rest after her first paycheck", correct: false, why: "Any money sent to the \"vendor\" goes to the scammer, and the check will still bounce." },
          ]),
          tells: [
            "A job offer after only a short text chat.",
            "The sender is a look-alike of the company's real address.",
            "Deposit a check, then pay someone out of it: the fake-check pattern.",
          ],
          tip: "Never pay anyone out of a check a stranger sent you. Funds being \"available\" doesn't mean the check is good.",
          source: SOURCES.fakeChecks,
        };
      },
    },

    {
      id: "crypto-release-fee",
      tier: 2,
      build(r) {
        const n = r.pick([NEIGHBORS.ines, NEIGHBORS.okafor]);
        const platform = r.pick(["CoinPort", "VaultRise", "BlockHarbor"]);
        const invested = r.money(500, 1200, 100);
        const balance = invested * r.int(5, 9);
        const fee = r.money(900, 1800, 100);
        const weeks = r.int(3, 8);
        const [helpNum] = phones(r, 1);
        return {
          neighbor: n,
          resident: `${n.name} says: "My online friend helped me put ${usd(invested)} in crypto on ${platform}. Now there's a fee to withdraw my profits. Should I pay it?"`,
          channel: "dm",
          from: "A new online friend",
          body: `"Great news, your account grew to ${usd(balance)}! ${platform} just needs a ${usd(fee)} release fee, sent in crypto to the same address. Then the profits are yours."`,
          history: [
            `${n.name} met this person online ${weeks} weeks ago and has never met them in person.`,
            "Yesterday a \"crypto recovery service\" messaged, offering to get money back for a fee.",
          ],
          directory: [
            { name: "Maple Hollow Consumer Help (saved contact)", contact: helpNum, result: "\"Fees to unlock profits are a hallmark of investment scams. Don't send more.\"" },
          ],
          scam: true,
          loss: fee,
          nextStep: steps(r, `${n.name} already sent ${usd(invested)} in crypto. What's the best next step?`, [
            { text: "Send nothing more, and report it to the company used to send the crypto", correct: true, why: "Crypto is hard to reverse, but report the fraud to the company you used and ask if they can stop it." },
            { text: `Pay the ${usd(fee)} fee so the profits come through`, correct: false, why: "The \"profits\" are fake numbers on a screen. Fees only lead to more fees." },
            { text: "Hire the recovery service that messaged", correct: false, why: "Recovery services that contact you asking for a fee are often the same scammers, back for more." },
          ]),
          tells: [
            "An online friend who turns the talk to investing.",
            "Big profits you can't withdraw without paying a fee.",
            "An unasked-for \"recovery service\" shows up right after a loss.",
          ],
          tip: "If you sent crypto to a scammer, contact the company you used right away and report it. Ignore anyone offering to recover it for a fee.",
          source: SOURCES.romance,
        };
      },
    },

    {
      id: "safe-account-call",
      tier: 2,
      build(r) {
        const n = r.pick([NEIGHBORS.rosa, NEIGHBORS.dev, NEIGHBORS.okafor]);
        const [cardNum] = phones(r, 1, true);
        const moved = r.money(500, 1500, 100);
        const agent = r.pick(["Daniel", "Karen", "Mr. Price", "Ms. Holt"]);
        const reached = r.chance(0.6);
        return {
          neighbor: n,
          resident: `${n.name} says: "Caller ID says it's my bank! I already moved ${usd(moved)} to their safe account, and he's on the other line asking for the rest."`,
          channel: "call",
          from: `Pinecrest Bank (${cardNum})`,
          body: `"This is ${agent} in Pinecrest's fraud department. Someone is trying to drain your account. Move your balance to the protected account I'll text you, and please don't discuss this at the branch while we investigate."`,
          inMessageCall: `"${agent}" texts a new account number and says the rest must move "in the next ten minutes."`,
          history: [
            `${n.name}'s banking app showed no strange charges this morning.`,
          ],
          directory: [
            {
              name: "Pinecrest Bank (number on back of card)",
              contact: cardNum,
              result: reached
                ? "\"We'd never ask anyone to move money to protect it. Hang up on that caller.\""
                : `Busy signal. (${n.name}'s line is tied up by the "bank" on hold.)`,
            },
          ],
          puzzle: {
            kind: "spot",
            tool: "COMPARE NUMBER",
            prompt: `Compare the caller ID with the number on the back of ${n.name}'s card.`,
            recordLabel: "Back of card",
            record: cardNum,
            shownLabel: "Caller ID",
            shown: cardNum,
            reward: "They match exactly. But caller ID can be faked, so a match proves nothing. Look at what the caller wants.",
          },
          scam: true,
          loss: r.money(1000, 2000, 100),
          nextStep: steps(r, `The "bank" is still on the line. What should ${n.name} do?`, [
            { text: "Hang up, call Pinecrest at the number on the card, and report the transfer", correct: true, why: "Since you placed that call, you know who's on the line. Report fast; the bank may be able to stop the transfer." },
            { text: "Stay on the line and ask for his employee ID", correct: false, why: "Scammers will happily make up a name, ID, or badge number." },
            { text: "Move the rest so it's all in one protected place", correct: false, why: "Every dollar sent to a \"safe account\" goes straight to the scammer." },
          ]),
          tells: [
            "Caller ID can be faked, even when it shows your bank's real number.",
            "Real banks never ask you to move money to a \"safe\" or \"protected\" account.",
            "Secrecy (\"don't discuss this at the branch\") keeps you from checking.",
          ],
          tip: "If a caller says to move money to protect it, hang up. Call your bank yourself using the number on your card.",
          source: SOURCES.impostor,
        };
      },
    },
  ]);
})();
