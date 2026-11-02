// cases/hard.js — tier-3 templates (Wednesday-Friday): clean-looking scams, scary-looking real messages,
// and a required mini-game whose reward settles every case.
(() => {
  addSources({
    hardBec: {
      label: "FBI: Business Email Compromise",
      url: "https://www.fbi.gov/how-we-can-help-you/common-frauds-and-scams/business-email-compromise",
    },
    hardBankFraud: {
      label: "FTC: Never move your money to \"protect it.\" That's a scam",
      url: "https://consumer.ftc.gov/consumer-alerts/2024/03/never-move-your-money-protect-it-thats-scam",
    },
    hardFraudText: {
      label: "FTC: Have you been getting scammy text messages?",
      url: "https://consumer.ftc.gov/consumer-alerts/2023/06/have-you-been-getting-scammy-text-messages",
    },
    hardIrs: {
      label: "IRS: How to know it's the IRS",
      url: "https://www.irs.gov/help/how-to-know-its-the-irs",
    },
    hardJury: {
      label: "U.S. Courts: Juror Scams",
      url: "https://www.uscourts.gov/court-programs/jury-service/juror-scams",
    },
    hardMedicare: {
      label: "FTC: Medicare fraud affects everyone, so here's what to know and do",
      url: "https://consumer.ftc.gov/consumer-alerts/2026/05/medicare-fraud-affects-everyone-so-heres-what-know-and-do",
    },
    hardVoiceClone: {
      label: "FTC: Scammers use AI to enhance their family emergency schemes",
      url: "https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes",
    },
    hardTaskJob: {
      label: "FTC: How to spot and avoid task scams",
      url: "https://consumer.ftc.gov/consumer-alerts/2025/08/how-spot-avoid-task-scams",
    },
    hardContractor: {
      label: "FTC: How To Avoid Scams After Weather Emergencies and Natural Disasters",
      url: "https://consumer.ftc.gov/articles/how-avoid-scams-after-weather-emergencies-and-natural-disasters",
    },
    hardDebt: {
      label: "FTC: Fake and Abusive Debt Collectors",
      url: "https://consumer.ftc.gov/articles/fake-abusive-debt-collectors",
    },
    hardSimSwap: {
      label: "FCC: Cell Phone Fraud (SIM swapping and port-out scams)",
      url: "https://www.fcc.gov/cell-phone-fraud",
    },
  });

  // Small helpers, kept inside this file's scope so they can't collide with other case files.
  const MONTHS = ["Oct", "Nov"];
  const date = (r, min = 2, max = 26) => `${r.pick(MONTHS)} ${r.int(min, max)}`;
  // A different fictional number that differs from `p` in exactly one of its last two digits.
  const nearPhone = (r, p) => {
    const i = p.length - r.int(1, 2);
    const d = (Number(p[i]) + r.int(1, 9)) % 10;
    return p.slice(0, i) + d + p.slice(i + 1);
  };
  const twoPhones = (r) => {
    const a = r.phone();
    let b = r.phone();
    while (b === a) b = r.phone();
    return [a, b];
  };
  // Look-alike of a domain that only touches the name, never ".example".
  const lookDomain = (r, slug) => `${r.lookalike(slug)}.example`;
  const cents = (r, min, max) => "$" + (r.int(min * 100, max * 100) / 100).toFixed(2);
  // Phone-menu level with shuffled keys, so players can't memorize the path.
  // items: [{ label: "For cards", next | goal | dead }]
  const menu = (r, intro, items) => {
    const order = r.shuffle(items);
    return {
      say: `${intro} ${order.map((it, i) => `${it.label}, press ${i + 1}.`).join(" ")}`,
      options: order.map((it, i) => {
        const key = String(i + 1);
        if (it.next) return { key, next: it.next };
        if (it.goal) return { key, goal: true };
        return { key, dead: it.dead };
      }),
    };
  };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const poss = (name) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

  addTemplates([
    // 1. Business email compromise: vendor "changed banks". Twin.
    {
      id: "hard-vendor-bank-change",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.dev;
        const scam = r.chance(0.55);
        const vendor = r.pick([
          { name: "Birchline Supply", slug: "birchline-supply" },
          { name: "Copperfield Tools", slug: "copperfield-tools" },
          { name: "Larkspur Lumber", slug: "larkspur-lumber" },
        ]);
        const realDom = `${vendor.slug}.example`;
        const fromDom = scam ? lookDomain(r, vendor.slug) : realDom;
        const amount = r.money(3200, 8800, 10);
        const inv = r.int(10400, 10999);
        const oldEnd = String(r.int(1000, 4999));
        const newEnd = String(r.int(5000, 9999));
        const newBank = r.pick(["Larch Valley Credit Union", "Riverbend Savings", "Northgate Bank"]);
        const [vendorPhone, bankPhone] = twoPhones(r);
        const effective = date(r, 1, 12);
        const header = `${vendor.name} · 22 Foundry Rd · Maple Hollow`;
        const lines = scam
          ? [
            header,
            `Monthly statement: invoice #${inv}, ${usd(amount)}, due Friday.`,
            `Remit to: account ending ${oldEnd}. Our bank details have not changed.`,
            `We will never change payment details by email. Call ${vendorPhone} to confirm any request.`,
            "Thank you for your business!",
          ]
          : [
            header,
            `Dear customer: as of ${effective}, we are moving our banking to ${newBank}.`,
            `Our new remittance account ends in ${newEnd}. New invoices will show it too.`,
            `Accounts will also email you. Questions? Call us at ${vendorPhone}.`,
            "Thank you for your business!",
          ];
        return {
          neighbor: n,
          resident: `Dev says: "${vendor.name} emailed new bank details, so I updated the payee and scheduled the ${usd(amount)} payment for Friday. Should I let it go through?"`,
          channel: "email",
          from: `Marta, Accounts <billing@${fromDom}>`,
          body: `Hi Dev, quick heads-up: we've moved our business banking to ${newBank}. Please send invoice #${inv} (${usd(amount)}) to our new account ending ${newEnd}. Updated details attached. Thanks so much! Marta`,
          history: [
            `Dev has paid ${vendor.name} every month for six years, always to the account ending ${oldEnd}.`,
            `${vendor.name} invoices come from billing@${realDom}.`,
            `Last week Dev's clerk ran a stack of mail through the shredder by mistake, including an envelope from ${vendor.name}.`,
          ],
          directory: [
            { name: `${vendor.name} (number on old invoices)`, contact: vendorPhone, result: "Voicemail: \"Our office is closed for inventory through Thursday. Please leave a message.\"" },
            { name: "Pinecrest Bank business desk", contact: bankPhone, result: "\"We can see the new payee you added, but we can't tell you who owns an account at another bank.\"" },
          ],
          puzzle: {
            kind: "shred",
            tool: "REASSEMBLE LETTER",
            required: true,
            prompt: `Tape the shredded ${vendor.name} letter back together, strip by strip.`,
            lines,
            reward: scam
              ? `It's ${poss(vendor.name)} real statement: pay the account ending ${oldEnd}, and "we will never change payment details by email." The email is an imposter.`
              : `It's ${poss(vendor.name)} own letter announcing the move to ${newBank}, account ending ${newEnd}. It matches the email. The change is real.`,
          },
          scam,
          loss: r.money(1200, 2000, 50),
          missedCost: `Dev kept paying the old, closed account. The money bounced back weeks later, and ${vendor.name} put the store on credit hold.`,
          nextStep: scam
            ? {
              prompt: "The payment goes out Friday. What should Dev do now?",
              options: [
                { text: `Cancel the scheduled payment, then confirm with ${vendor.name} at the number on his old invoices`, correct: true, why: "Confirm bank changes using a number you already trust, never the email. If money already went out, call your bank right away and report it at IC3.gov." },
                { text: "Reply to the email and ask Marta to confirm the change", why: "The reply goes straight to the imposter, who will happily \"confirm.\"" },
                { text: "Pay this one invoice, then ask for proof before the next", why: "Once it lands in the scammer's account, it's very hard to get back." },
              ],
            }
            : {
              prompt: "The payment goes out Friday. What should Dev do now?",
              options: [
                { text: "Cancel the payment and keep paying the old account" },
                { text: "Reply to the email and ask Marta to prove she works there" },
                { text: "Report the email to IC3.gov as fraud" },
              ],
            },
          tells: scam
            ? [
              `The email came from ${fromDom}, one character off from ${realDom}.`,
              `${poss(vendor.name)} real statement says to pay the account ending ${oldEnd} and that payment details never change by email.`,
              "Business email compromise uses a real vendor, a real invoice number, and a new account.",
            ]
            : [
              `${poss(vendor.name)} own mailed letter announced the same bank and account ending.`,
              `The email came from the vendor's usual address, ${realDom}.`,
              "The change was announced by mail first, with no rush or secrecy.",
            ],
          tip: "Before changing where you send money, confirm with the company using a phone number you already have, not one in the email.",
          source: SOURCES.hardBec,
        };
      },
    },

    // 2. Bank "fraud department" wants money moved to a "safe account". Scam; phone maze.
    {
      id: "hard-safe-account-call",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.rosa;
        const bank = r.pick(["Pinecrest Bank", "Hollow Valley Credit Union"]);
        const [bankPhone, agentPhone] = twoPhones(r);
        const moved = r.money(900, 2500, 100);
        const rest = r.money(4000, 9000, 500);
        const agent = r.pick(["Daniel", "Kyle", "Monica", "Grace"]);
        const tree = menu(r, `Thank you for calling ${bank}.`, [
          {
            label: "For balances and transfers",
            next: menu(r, "Balances and transfers.", [
              { label: "To hear your balance", dead: "A robot reads Rosa's balance, minus the money she already moved, then says goodbye." },
              {
                label: "For help with a transfer you made",
                next: menu(r, "Transfer help.", [
                  { label: "To change a scheduled transfer", dead: "\"You have no scheduled transfers.\" Click. Back to the start." },
                  { label: "For wires and transfers to another bank", dead: "\"We can't handle fraud here. From the main menu, choose cards, then fraud.\" Back to the start." },
                ]),
              },
            ]),
          },
          { label: "For loans and mortgages", dead: "\"Our loan officers are with other customers. Please call back during business hours.\"" },
          {
            label: "For debit and credit cards",
            next: menu(r, "Cards.", [
              { label: "To activate a card", dead: "\"Your card is already active.\" Back to the start." },
              { label: "To check a payment due date", dead: "\"Your payment is due on the 14th.\" Back to the start." },
              {
                label: "For lost, stolen, or fraud",
                next: menu(r, "Lost, stolen, or fraud.", [
                  { label: "To lock a lost card", dead: "\"Your card is now locked.\" That doesn't stop a transfer. Back to the start." },
                  { label: "To report fraud or a suspicious call", goal: true },
                ]),
              },
            ]),
          },
          {
            label: "For anything else",
            next: menu(r, "Other services.", [
              { label: "For business banking", dead: "\"Business banking is closed for the day.\" Back to the start." },
              { label: "For branch hours", dead: "A recording lists every branch's hours. All of them. Back to the start." },
              { label: "For an operator", dead: "\"All operators are busy. Estimated wait: 52 minutes.\" Rosa doesn't have 52 minutes." },
            ]),
          },
        ]);
        return {
          neighbor: n,
          resident: `Rosa says: "${bank}'s fraud team called from their real number. I moved ${usd(moved)} to a safe account like they said. They're calling back in ten minutes to move the other ${usd(rest)}. Do I do it?"`,
          channel: "call",
          from: `${bank} (${bankPhone})`,
          body: `"This is ${agent} in ${bank} fraud. Someone in another state is draining your account. We've opened a secure holding account in your name; let's move your money there. Please keep this quiet for now. We think someone at your branch is involved."`,
          inMessageCall: `You call ${agent}'s "direct line" (${agentPhone}). Calm and kind: "Let's finish the second transfer before the thief does. Do you have your app open?"`,
          history: [
            `The caller ID showed ${bankPhone}, the same number printed on the back of Rosa's card.`,
            `Rosa's banking app shows the ${usd(moved)} transfer as completed this morning.`,
          ],
          directory: [
            { name: `${bank}, Main St branch`, contact: r.phone(), result: "Recording: \"Our branch is closed for the day. For urgent help, call the number on the back of your card.\"" },
          ],
          puzzle: {
            kind: "phonetree",
            tool: "CALL THE REAL NUMBER",
            required: true,
            prompt: `Hang up, then call the number on the back of Rosa's card and reach the fraud department.`,
            number: bankPhone,
            menu: tree,
            reward: `${bank} fraud: "We didn't call Rosa. We never ask anyone to move money to a 'safe account.' That ${usd(moved)} went to a scammer, and we're trying to recall it now. Don't move anything else."`,
          },
          scam: true,
          loss: r.money(1400, 2000, 50),
          nextStep: {
            prompt: `${agent} calls back in ten minutes. What should Rosa do?`,
            options: [
              { text: "Ignore the callback, stay with the real fraud team to recall the transfer, then report it at ReportFraud.ftc.gov", correct: true, why: "Banks never move your money to \"protect\" it. Calling the real bank fast gives the best chance to recover it." },
              { text: "Move the rest so everything is in one protected place", why: "There is no safe account. The rest would be gone too." },
              { text: `Call ${agent}'s direct line and ask for an employee ID`, why: "Any ID is made up, and that line goes straight to the scammers." },
            ],
          },
          tells: [
            "Caller ID can be faked to show a bank's real number.",
            "No real bank asks you to move money to a \"safe account\" or to keep it secret from branch staff.",
            "The real fraud team, reached through the number on her card, said they never called.",
          ],
          tip: "Hang up and call the number on your card yourself. Anyone who says to move your money to protect it is a scammer.",
          source: SOURCES.hardBankFraud,
        };
      },
    },

    // 3. "Did you attempt $X at Y? Reply YES or NO." Real vs fake with a link. Twin; audit.
    {
      id: "hard-fraud-alert-text",
      tier: 3,
      build(r) {
        const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.rosa, NEIGHBORS.priya]);
        const scam = r.chance(0.5);
        const bank = r.pick([{ name: "Pinecrest Bank", slug: "pinecrestbank" }, { name: "Hollow Valley CU", slug: "hollowvalleycu" }]);
        const code = r.shortCode();
        const sender = scam ? r.lookalike(code) : code;
        const merchant = r.pick(["ElectroMart Online", "Skyline Air", "GameVault Store", "LuxeLane Boutique", "PrimeGadget Outlet"]);
        const amt = cents(r, 180, 980);
        const day = r.int(10, 20);
        const when = `Oct ${day}`;
        const normal = r.shuffle([
          { desc: "Maple Hollow Grocery", amount: cents(r, 30, 140) },
          { desc: "QuickFuel gas", amount: cents(r, 25, 60) },
          { desc: "Elm St Pharmacy", amount: cents(r, 8, 45) },
          { desc: "Hollow Bean Coffee", amount: cents(r, 4, 9) },
          { desc: "Town Water utility (autopay)", amount: cents(r, 40, 80) },
        ]).slice(0, 4).map((row, i) => ({ date: `Oct ${day - 3 + i}`, ...row }));
        const rows = (scam ? normal : [...normal, { date: when, desc: `${merchant} · DECLINED, held for fraud review`, amount: amt }])
          .sort((x, y) => Number(x.date.slice(4)) - Number(y.date.slice(4)));
        const answer = scam ? -1 : rows.findIndex((row) => row.desc.startsWith(merchant));
        const link = `secure.${lookDomain(r, bank.slug)}/alert`;
        return {
          neighbor: n,
          resident: `${n.name} says: "I got this fraud alert and haven't answered. ${n.id === "priya" ? "My roommate" : "My grandson"} says these are always scams. Should I just ignore it?"`,
          channel: "text",
          from: sender,
          body: scam
            ? `${bank.name} Fraud Alert: Did you attempt a ${amt} purchase at ${merchant} on ${when}? Reply YES or NO, or review it at ${link}`
            : `${bank.name} Fraud Alert: Did you attempt a ${amt} purchase at ${merchant} on ${when}? Reply YES or NO. We will never ask for your PIN or a code.`,
          history: [
            `${n.name}'s past ${bank.name} alerts came from short code ${code}.`,
            `${cap(n.he)} uses that card for groceries, gas and the pharmacy.`,
          ],
          directory: [
            { name: `${bank.name} (number on the card)`, contact: r.phone(), result: "\"Due to high call volume, your wait time is more than 45 minutes.\" (No time for that.)" },
          ],
          puzzle: {
            kind: "audit",
            tool: "AUDIT STATEMENT",
            required: true,
            prompt: `Open ${n.name}'s card activity in the bank's own app. Click a charge ${n.he} didn't make, or confirm ${n.he} made them all.`,
            noneLabel: "ALL MINE",
            rows,
            answer,
            reward: scam
              ? `${n.name} made every charge. There's no ${amt} attempt at ${merchant} anywhere, so the bank never saw one. The text is fake.`
              : `There it is: the same ${amt} attempt at ${merchant}, already declined and held for review. The text is ${bank.name}'s real alert.`,
          },
          scam,
          loss: r.money(600, 1400, 50),
          missedCost: `${n.name} ignored a real fraud alert. The bank couldn't confirm the charge, so ${n.his} card stayed frozen for a week while ${n.he} sorted it out at the branch.`,
          nextStep: scam
            ? {
              prompt: `What should ${n.name} do with the text?`,
              options: [
                { text: "Don't reply or tap the link; call the number on the card, then forward the text to 7726 (SPAM)", correct: true, why: "Check alerts through a number or app you trust. Reporting to 7726 helps the carrier block it." },
                { text: "Reply NO so the bank blocks the charge", why: "Replying tells the scammer the number is live, and a fake \"fraud team\" call usually follows." },
                { text: "Tap the link to check whether the card is safe", why: "The link leads to a look-alike page built to collect card numbers and codes." },
              ],
            }
            : {
              prompt: `What should ${n.name} do with the text?`,
              options: [
                { text: "Forward it to 7726 (SPAM) and ignore any follow-up" },
                { text: "Reply STOP so the texts end" },
                { text: "Ignore it; banks never text about charges" },
              ],
            },
          tells: scam
            ? [
              `The bank's own app shows no ${amt} attempt at all.`,
              `It came from ${sender}, not ${bank.name}'s usual short code ${code}.`,
              "It pushed a link. Real alerts ask for YES or NO, or tell you to call the number on your card.",
            ]
            : [
              `The bank's own app shows the same declined ${amt} attempt at ${merchant}.`,
              `It came from ${bank.name}'s usual short code ${code}.`,
              "It only asked for YES or NO: no link, and no request for a PIN or code.",
            ],
          tip: "Real fraud alerts exist. Check them in your bank's own app or at the number on your card, never through a link in the text.",
          source: SOURCES.hardFraudText,
        };
      },
    },

    // 4. IRS letter: real CP14-style notice vs fake demanding gift cards/wire/crypto. Twin; shred.
    {
      id: "hard-tax-letter",
      tier: 3,
      build(r) {
        const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.rosa, NEIGHBORS.dev]);
        const scam = r.chance(0.5);
        const amount = r.money(600, 4800, 1);
        const irsPhone = r.phone();
        const fakePhone = nearPhone(r, irsPhone);
        const due = date(r, 20, 28);
        const method = r.pick([
          { long: "gift cards (photos of the backs)", short: "gift cards" },
          { long: "a wire transfer", short: "wire transfers" },
          { long: "cryptocurrency at a Bitcoin ATM", short: "crypto" },
        ]);
        const lines = scam
          ? [
            "Internal Revenue Service · Final Notice · Tax year 2025",
            `You owe ${usd(amount)}. Unpaid balances may be referred to local police.`,
            `Pay by ${due} using ${method.long} only. Checks are not accepted.`,
            `Call your case officer at ${fakePhone} to make payment.`,
            "Do not contact other IRS offices; they cannot see this case.",
          ]
          : [
            "Internal Revenue Service · Notice CP14 · Tax year 2025",
            `You owe ${usd(amount)} because of a correction to your return.`,
            `Pay by ${due} through the official IRS website, or mail a check to "United States Treasury."`,
            `Questions? Call us at ${irsPhone}. Have this notice with you.`,
            "If you already paid, you can ignore this notice.",
          ];
        return {
          neighbor: n,
          resident: `${n.name} says: "This IRS letter came today. I panicked and fed it to the shredder, then wondered if it was real. I haven't called anyone or paid. Here are the strips."`,
          channel: "letter",
          from: "Department of the Treasury, Internal Revenue Service",
          body: `Notice of balance due for tax year 2025: ${usd(amount)}. Respond by ${due} to avoid further penalties and interest.`,
          history: [
            `${n.name} filed ${n.his} 2025 return in April and paid what the tax software said ${n.he} owed.`,
            `${cap(n.he)} hasn't set up an IRS Online Account yet.`,
          ],
          directory: [
            { name: "IRS (number listed on IRS.gov)", contact: irsPhone, result: "Recording: \"Due to high demand, we can't take your call. Please try again later.\"" },
            { name: `${n.name}'s tax preparer`, contact: r.phone(), result: "Auto-reply: \"Out of the office until next Monday.\"" },
          ],
          puzzle: {
            kind: "shred",
            tool: "REASSEMBLE LETTER",
            required: true,
            prompt: "Put the shredded notice back together, top to bottom.",
            lines,
            reward: scam
              ? `Reassembled: it demands ${method.long} and points to ${fakePhone}, not the IRS number ${irsPhone}. The IRS never takes ${method.short} and never sends police. Fake.`
              : `Reassembled: a CP14 notice that says to pay through the official IRS website or by check to "United States Treasury," and lists ${irsPhone}, the same number as IRS.gov. It's real.`,
          },
          scam,
          loss: r.money(800, 1600, 50),
          missedCost: `${n.name} ignored a real IRS notice, so penalties and interest kept growing on the ${usd(amount)}.`,
          nextStep: scam
            ? {
              prompt: `What should ${n.name} do about the letter?`,
              options: [
                { text: "Don't pay or call the letter's number; check with the IRS through IRS.gov, and report the letter to the IRS and the FTC", correct: true, why: "The IRS says to verify notices through IRS.gov or its listed number, and it never demands gift cards, wires or crypto." },
                { text: "Call the case officer to set up a smaller payment plan", why: "That number reaches the scammer, who'll still want gift cards, a wire or crypto." },
                { text: "Pay quickly to stop the police referral, then sort it out", why: "The IRS doesn't send police over a balance. Money sent that way is almost impossible to get back." },
              ],
            }
            : {
              prompt: `What should ${n.name} do about the letter?`,
              options: [
                { text: "Shred the rest and report it to the FTC" },
                { text: "Ignore it; the IRS only contacts people by phone" },
                { text: "Post a photo online to warn the neighbors" },
              ],
            },
          tells: scam
            ? [
              `The letter demands ${method.long}, which the IRS never accepts.`,
              `Its number, ${fakePhone}, isn't the IRS number ${irsPhone}.`,
              `It threatened police and told ${n.him} not to contact other IRS offices.`,
            ]
            : [
              "It says to pay through the official IRS website or by check to the U.S. Treasury.",
              `It lists ${irsPhone}, the same number the IRS shows on its website.`,
              "The IRS normally makes first contact by mail, just like this, without threats.",
            ],
          tip: "The IRS starts with a letter, but never demands gift cards, wires or crypto. Check any notice through IRS.gov, not the number on a suspicious letter.",
          source: SOURCES.hardIrs,
        };
      },
    },

    // 5. Jury duty "missed summons" call. Scam; story contradicts History.
    {
      id: "hard-jury-duty",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.okafor;
        const [deputyPhone, clerkPhone] = twoPhones(r);
        const deputy = r.pick(["Deputy Harlan", "Sergeant Price", "Deputy Moreno", "Lieutenant Shaw"]);
        const county = r.pick(["Alder", "Wexford", "Maple"]);
        const fine = r.money(450, 1500, 50);
        const house = r.int(12, 89);
        let wrongHouse = Number(String(house).split("").reverse().join(""));
        if (wrongHouse === house || wrongHouse < 10) wrongHouse = house + 10;
        const a = r.int(3, 10);
        const served = r.pick([2023, 2024]);
        const wrong = r.int(0, 2);
        const facts = [
          {
            ok: `"The summons was mailed to ${house} Alder Lane. That's you, right?"`,
            bad: `"The summons was mailed to ${wrongHouse} Alder Lane. That's you, right?"`,
            reward: `The "deputy" says the summons went to ${wrongHouse} Alder Lane, but Mr. Okafor lives at ${house}.`,
          },
          {
            ok: `"Records show it was delivered Oct ${a + 15}, and you didn't appear."`,
            bad: `"Records show you signed for it in person on Oct ${a + 5}."`,
            reward: `The "deputy" says Mr. Okafor signed for it in person on Oct ${a + 5}, but he was in Lagos and his mail was on hold.`,
          },
          {
            ok: `"I see you served once, back in ${served}. This one you missed."`,
            bad: "\"I see this would have been your first time serving.\"",
            reward: `The "deputy" says this would have been his first time serving, but Mr. Okafor served on a jury in ${served}.`,
          },
        ];
        const lines = [
          `"This is ${deputy} with the ${county} County Sheriff's Office."`,
          ...facts.map((f, i) => (i === wrong ? f.bad : f.ok)),
          `"A judge signed a warrant. You can clear it today with a ${usd(fine)} fine by card."`,
        ];
        return {
          neighbor: n,
          resident: `Mr. Okafor says: "A deputy left a message about a missed jury summons. I called back and he says I can clear a warrant with a ${usd(fine)} fine. I read him my card number but hung up before the security code. Was he real?"`,
          channel: "voicemail",
          from: `${deputy}, ${county} County Sheriff (${deputyPhone})`,
          body: `"Mr. Okafor, this is ${deputy} with the ${county} County Sheriff's Office about a missed jury summons. Please call me back today at ${deputyPhone} so we can resolve this before it goes back to the judge."`,
          inMessageCall: `${deputy} picks up on the first ring: "Glad you called, sir. Let's get that fine paid so nobody comes to your door tonight. Stay on the line with me."`,
          history: [
            `Mr. Okafor lives at ${house} Alder Lane.`,
            `He was visiting his sister in Lagos from Oct ${a} to Oct ${a + 12}; the post office held his mail.`,
            `He served on a county jury in ${served}.`,
          ],
          directory: [
            { name: "Clerk of Court jury office (court website)", contact: clerkPhone, result: "Voicemail: \"The jury office is closed for training today. Leave your juror number and we'll call back.\"" },
            { name: "Sheriff's non-emergency line", contact: r.phone(), result: "\"We can't look up warrants over the phone. You'd need to come in person.\"" },
          ],
          puzzle: {
            kind: "story",
            tool: "CHECK THE STORY",
            required: true,
            prompt: "Here's what the \"deputy\" told Mr. Okafor. Click the line that contradicts the History tab.",
            lines,
            answer: wrong + 1,
            reward: `${facts[wrong].reward} He's reading a script with made-up details. Real courts mail summonses and never collect fines by phone.`,
          },
          scam: true,
          loss: r.money(500, 1200, 50),
          nextStep: {
            prompt: "Mr. Okafor already gave out his card number. What now?",
            options: [
              { text: "Call his card company to cancel the card, check with the court using a number from its website, and report the call to the FTC", correct: true, why: "Courts don't collect fines by phone. Cancelling the card stops charges, and the court can confirm there's no warrant." },
              { text: "Call the deputy back and give the security code so it's settled", why: "That finishes the scam. The \"fine\" goes to a criminal." },
              { text: "Give the deputy his date of birth so they can look up the summons", why: "More personal info only helps the scammer, and the summons doesn't exist." },
            ],
          },
          tells: [
            "One detail in the caller's story didn't match what we know about Mr. Okafor.",
            "Courts contact jurors by mail and never demand payment by phone to clear a warrant.",
            "The caller pushed him to stay on the line and pay right away.",
          ],
          tip: "No court or sheriff collects jury fines by phone. Hang up and call the clerk using the number on the court's own website.",
          source: SOURCES.hardJury,
        };
      },
    },

    // 6. Health plan "activate your new card" mailer. Twin; phone maze.
    {
      id: "hard-medicare-card",
      tier: 3,
      build(r) {
        const n = r.pick([NEIGHBORS.ines, NEIGHBORS.okafor]);
        const scam = r.chance(0.5);
        const plan = r.pick(["Juniper Health Plan", "Evergreen Senior Health", "Bluestem Medicare Plan"]);
        const cardPhone = r.phone();
        const mailerPhone = scam ? nearPhone(r, cardPhone) : cardPhone;
        const by = date(r, 15, 30);
        const tree = menu(r, `Thank you for calling ${plan} member services.`, [
          {
            label: "To find a doctor or pharmacy",
            next: menu(r, "Find care.", [
              { label: "For doctors", dead: "A long list of doctors in Maple Hollow. Useful another day. Back to the start." },
              { label: "For pharmacies", dead: "\"Elm St Pharmacy is in network.\" Back to the start." },
            ]),
          },
          {
            label: "For claims and bills",
            next: menu(r, "Claims and bills.", [
              { label: "To check a claim", dead: "\"You have no open claims.\" Back to the start." },
              { label: "For a bill you don't recognize", dead: "\"For letters or calls you're unsure about, choose ID cards from the main menu.\" Back to the start." },
            ]),
          },
          {
            label: "For ID cards and your account",
            next: menu(r, "ID cards.", [
              { label: "To order a replacement card", dead: "\"A replacement card will arrive in 7 to 10 days.\" That's not the question. Back to the start." },
              {
                label: "For questions about a new card",
                next: menu(r, "New cards.", [
                  { label: "To activate a card you've received", dead: `"Please enter the 11-digit number on your new card." ${cap(n.he)} doesn't have one yet. Back to the start.` },
                  { label: "To ask about a letter or call from us", goal: true },
                ]),
              },
            ]),
          },
          { label: "To speak with a nurse", dead: "\"A nurse will call you back within the hour.\" Kind, but no help with mail. Back to the start." },
        ]);
        return {
          neighbor: n,
          resident: `${n.name} says: "My health plan sent a letter to activate my new card. I called the number, gave my name and birthday, and now they want my member ID number. I said I'd call back."`,
          channel: "letter",
          from: `${plan}, Member Services`,
          body: `Your new 2027 member ID card is on its way. To activate it, call ${mailerPhone} and confirm your member details. Please activate by ${by} to avoid a gap in coverage.`,
          history: [
            `${plan} sends new cards every fall.`,
            `${n.name} hasn't received a new card in the mail yet.`,
          ],
          directory: [
            { name: "Senior Medicare Patrol volunteer", contact: r.phone(), result: "Voicemail: \"We return calls within two business days.\"" },
            { name: `${n.name}'s pharmacy`, contact: r.phone(), result: "\"We can't see a new card until it's active. You'd have to ask your plan.\"" },
          ],
          puzzle: {
            kind: "phonetree",
            tool: "CALL THE REAL NUMBER",
            required: true,
            prompt: `Call member services using the number on the back of ${n.name}'s current card, and ask about the letter.`,
            number: cardPhone,
            menu: tree,
            reward: scam
              ? `Member services: "We didn't send that letter, and ${mailerPhone} isn't ours. Ours is the number on your card. Don't give them anything; we're flagging your account."`
              : `Member services: "Yes, that letter is ours, and ${mailerPhone} is our activation line. Your new card ships this week, and activating it with us is safe."`,
          },
          scam,
          loss: r.money(400, 900, 50),
          missedCost: `${n.name} never activated ${n.his} new card, and the pharmacy turned ${n.him} away in January.`,
          nextStep: scam
            ? {
              prompt: `What should ${n.name} do now?`,
              options: [
                { text: `Don't call them back; tell ${plan} (number on the card) what ${n.he} shared, and watch ${n.his} statements for services ${n.he} never got`, correct: true, why: "Scammers use Medicare and member numbers to bill fake services. Reviewing statements catches it early." },
                { text: "Call back and give the numbers so the card isn't delayed", why: "That hands the scammer exactly what they need to bill in your name." },
                { text: "Call back and ask them to mail proof first", why: "Scammers can mail fake proof too. That line is theirs." },
              ],
            }
            : {
              prompt: `What should ${n.name} do now?`,
              options: [
                { text: "Report the letter to Medicare as fraud" },
                { text: "Ignore it and keep using the old card" },
                { text: "Shred the letter and wait for the card to show up" },
              ],
            },
          tells: scam
            ? [
              `The letter's number, ${mailerPhone}, is one digit off from the card's ${cardPhone}.`,
              "Member services, reached through the card, says it never sent the letter.",
              "Fake \"new card\" letters and calls fish for Medicare and member numbers.",
            ]
            : [
              "Member services, reached through the number on the card, confirmed the letter.",
              `The letter's number, ${mailerPhone}, matches the card exactly.`,
              `${cap(n.he)} called the plan, not the other way around, and it only asked for details already on file.`,
            ],
          tip: "Only share your Medicare number when you've called a number you trust, like the one on your card. Check your statements for services you didn't get.",
          source: SOURCES.hardMedicare,
        };
      },
    },

    // 7. Voice-clone "Mateo" emergency call to Grandma Inés. Scam; story vs History.
    {
      id: "hard-voice-clone",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.ines;
        const bail = r.money(2000, 6000, 500);
        const nick = r.pick(["Abuelita", "Abue", "Lita"]);
        const town = r.pick(["Fairview", "Cedar Falls", "Lake Orin"]);
        const otherTown = r.pick(["Riverton", "Bellport", "Ashby"]);
        const camp = r.pick(["soccer", "science", "band"]);
        const [lawyerPhone, momPhone, mateoPhone] = r.shuffle(Array.from({ length: 100 }, (_, i) => `555-01${String(i).padStart(2, "0")}`)).slice(0, 3);
        const wrong = r.int(0, 2);
        const facts = [
          {
            ok: `"${nick}, it's me. Please don't be mad."`,
            bad: "\"Grandma, it's me. Please don't be mad.\"",
            reward: `Mateo never says "Grandma"; he always says "${nick}."`,
          },
          {
            ok: `"We snuck out of camp in ${town} to get pizza."`,
            bad: `"I'm in ${otherTown} with some friends from school."`,
            reward: `Mateo is at ${camp} camp in ${town} all week, not in ${otherTown}.`,
          },
          {
            ok: "\"My friend was driving, and we hit a parked truck.\"",
            bad: "\"I was driving, and I hit a parked truck.\"",
            reward: "Mateo is 15 and doesn't drive, but the caller says he was driving.",
          },
        ];
        return {
          neighbor: n,
          resident: `Grandma Inés says: "Mateo called crying. He's in jail after a crash and needs ${usd(bail)} for bail. It was his voice! I was so scared I forgot to ask our safe word. I'm at the bank to wire it now. Should I?"`,
          channel: "call",
          from: `Unknown number (${lawyerPhone})`,
          body: `A crying voice that sounds just like Mateo: "I'm in big trouble. Please help me, and don't tell Mom." Then a calm "lawyer" takes the phone and asks for ${usd(bail)} in bail, sent by wire today.`,
          inMessageCall: `You call the "lawyer" back. He's smooth: "Your grandson is very scared. The court closes at five. Do you have the account number ready?"`,
          history: [
            `Mateo is at ${camp} camp in ${town} all week. Camp keeps the kids' phones during the day.`,
            `Mateo always calls her "${nick}," never "Grandma."`,
            "Mateo is 15 and doesn't have a driver's license yet.",
          ],
          directory: [
            { name: "Mateo (his cell)", contact: mateoPhone, result: "Straight to voicemail. Camp has his phone until dinner." },
            { name: "Carla, Mateo's mom", contact: momPhone, result: "Voicemail: \"I'm in meetings all afternoon, leave a message!\"" },
          ],
          puzzle: {
            kind: "story",
            tool: "CHECK THE STORY",
            required: true,
            prompt: "Here's what \"Mateo\" said on the call. Click the line that contradicts the History tab.",
            lines: [
              wrong === 0 ? facts[0].bad : facts[0].ok,
              wrong === 1 ? facts[1].bad : facts[1].ok,
              wrong === 2 ? facts[2].bad : facts[2].ok,
              "\"The police took my phone, so I'm calling from the lawyer's.\"",
              "\"Please don't tell Mom. I'm so scared.\"",
            ],
            answer: wrong,
            reward: `${facts[wrong].reward} A cloned voice can sound exactly like him, but it doesn't know the family's details. This isn't Mateo.`,
          },
          scam: true,
          loss: r.money(1200, 2000, 50),
          nextStep: {
            prompt: "Inés is standing at the bank counter. What should she do?",
            options: [
              { text: "Don't send it; keep trying Mateo, his mom and the camp on numbers she knows, and report the call to the FTC", correct: true, why: "Don't trust the voice. A real emergency can wait ten minutes for a call to a number you know." },
              { text: "Wire half now and the rest once Mateo calls again", why: "Wired money is almost impossible to get back, and they'll just ask for more." },
              { text: "Call the \"lawyer\" back and ask him to put Mateo on", why: "The scammer will stall or play the clone again. That number is theirs." },
            ],
          },
          tells: [
            "A detail in the call didn't match what the family knows about Mateo.",
            "The caller wanted secrecy (\"don't tell Mom\") and a wire transfer today.",
            "Voice cloning can copy a voice from a short clip online. A family safe word, or a call to a known number, beats any voice.",
          ],
          tip: "Agree on a family safe word, and if a loved one calls in a panic, hang up and call them back on a number you know.",
          source: SOURCES.hardVoiceClone,
        };
      },
    },

    // 8. Gamified "task" job for Priya. Scam; compare sites.
    {
      id: "hard-task-job",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.priya;
        const brand = r.pick([
          { name: "Brightcart", slug: "brightcart" },
          { name: "Shopwell", slug: "shopwell" },
          { name: "Nimbus Market", slug: "nimbusmarket" },
        ]);
        const realDom = `${brand.slug}.example`;
        const fakeDom = lookDomain(r, brand.slug);
        const earned = r.money(1400, 3200, 10);
        const first = r.money(150, 400, 10);
        const deposit = r.money(600, 1500, 50);
        const small = r.int(8, 20);
        const sites = [
          {
            url: `https://${realDom}/careers`,
            title: `${brand.name} Careers`,
            lines: [
              "Apply only on this page. Every hire has a video interview.",
              "We never recruit by text, WhatsApp or Telegram.",
              "We will never ask you to pay, deposit, or buy crypto to work for us.",
            ],
          },
          {
            url: `https://${fakeDom}/careers`,
            title: `${brand.name} Careers`,
            lines: [
              "Join our remote Product Rating team. No interview needed!",
              "Our recruiters reach out on WhatsApp for faster hiring.",
              "Top up your work account in USDT to unlock higher-paying task sets.",
            ],
          },
        ];
        const shown = r.shuffle(sites);
        return {
          neighbor: n,
          resident: `Priya says: "I've been rating products for a ${brand.name} side job. My dashboard says I've earned ${usd(earned)}! To withdraw, I have to finish a 'combo task' by depositing ${usd(deposit)} in crypto. I already deposited ${usd(first)} last week. Is this normal?"`,
          channel: "dm",
          from: `Jenna · ${brand.name} Talent Team`,
          body: `Great work today, Priya! You're one combo task from VIP 2. Once it's done, your full balance unlocks for withdrawal. Your dashboard: ${fakeDom}/tasks`,
          history: [
            `Jenna first messaged Priya out of the blue on WhatsApp, and paid her $${small} on day one.`,
            "Priya never had an interview or filled out a tax form.",
          ],
          directory: [
            { name: `${brand.name} HR (from its real site)`, contact: r.phone(), result: "Auto-reply: \"Thanks for writing. We'll respond within 5 to 7 business days.\"" },
            { name: "Campus career center", contact: r.phone(), result: "\"We can't vouch for outside jobs. Can you bring it by during office hours tomorrow?\"" },
          ],
          puzzle: {
            kind: "site",
            tool: "COMPARE SITES",
            required: true,
            prompt: `Two "${brand.name} Careers" pages. Click the fake, or say they're both real.`,
            sites: shown,
            answer: shown.findIndex((s) => s.url.includes(fakeDom)),
            reward: `The real ${brand.name} page at ${realDom} says it never recruits on WhatsApp and never asks workers to deposit money. The "dashboard" lives on ${fakeDom}, a look-alike. Those earnings aren't real.`,
          },
          scam: true,
          loss: r.money(800, 1600, 50),
          nextStep: {
            prompt: "Jenna says the combo task expires tonight. What should Priya do?",
            options: [
              { text: "Stop paying, report it at ReportFraud.ftc.gov, and tell the crypto app she used", correct: true, why: "There are no real earnings. Reporting fast may help, and the crypto company should know about the scam." },
              { text: "Deposit once more so she can withdraw everything", why: "There's always another \"combo task.\" Only the scammers make money." },
              { text: "Ask Jenna to refund the first deposit", why: "She'll ask for a \"fee\" to process the refund. That money is gone too." },
            ],
          },
          tells: [
            "A job that makes you pay to get paid is a scam.",
            `The real ${brand.name} careers page says it never recruits on WhatsApp or asks for deposits.`,
            `The dashboard is on ${fakeDom}, not ${realDom}.`,
          ],
          tip: "Real employers don't hire by surprise WhatsApp message, and never make you deposit money to get your pay.",
          source: SOURCES.hardTaskJob,
        };
      },
    },

    // 9. Storm-damage roofer wants a deposit. Twin; license lookup vs roofer's page.
    {
      id: "hard-storm-contractor",
      tier: 3,
      build(r) {
        const n = r.pick([NEIGHBORS.dev, NEIGHBORS.rosa, NEIGHBORS.okafor, NEIGHBORS.ines]);
        const scam = r.chance(0.5);
        const co = r.pick([
          { name: "Summit Storm Roofing", slug: "summitstormroofing" },
          { name: "Ironclad Roof & Gutter", slug: "ironcladroof" },
          { name: "Blue Ridge Exteriors", slug: "blueridgeexteriors" },
        ]);
        const other = r.pick(["Pine Ridge Roofing LLC", "Crestview Home Repair", "A-1 Gutters Inc."]);
        const otherTown = r.pick(["Bellport", "Ashby", "Riverton"]);
        const lic = `RC-${r.int(10000, 99999)}`;
        const deposit = r.money(2500, 6000, 250);
        const since = r.int(1994, 2012);
        const addr = `${r.int(100, 980)} Mill Rd`;
        const crewPhone = r.phone();
        const lookup = {
          url: `https://lookup.state-licensing.example/?license=${lic}`,
          title: "State Contractor License Lookup",
          lines: scam
            ? [`License ${lic}: ${other}, ${otherTown}`, "Status: EXPIRED (2023). Roofing.", "Insurance on file: none."]
            : [`License ${lic}: ${co.name}, Maple Hollow`, "Status: ACTIVE. Roofing.", `Address: ${addr}. Insurance on file: yes.`],
        };
        const own = {
          url: `https://${co.slug}.example`,
          title: co.name,
          lines: scam
            ? [`Licensed & insured · License ${lic}`, "Storm response crews in your area now!", `Text the crew lead: ${crewPhone}`]
            : [`Licensed & insured · License ${lic}`, `Family owned, serving Maple Hollow since ${since}.`, `Office: ${addr}, Maple Hollow`],
        };
        const sites = r.shuffle([lookup, own]);
        return {
          neighbor: n,
          resident: `${n.name} says: "A roofer knocked after the hail and showed me photos of damage on my roof. I signed and wrote a ${usd(deposit)} deposit check. It hasn't been cashed yet. Did I mess up?"`,
          channel: "letter",
          from: `${co.name} (contract and door hanger)`,
          body: `After Tuesday's hail, we inspected your street and found roof damage. Licensed & insured, license ${lic}. A ${usd(deposit)} deposit (one third) holds your spot; crews start Monday.`,
          history: [
            "Tuesday's hailstorm damaged roofs all over Maple Hollow.",
            `The roofer gave ${n.name} a written contract with a license number and a one-third deposit.`,
          ],
          directory: [
            { name: "State contractor licensing board", contact: r.phone(), result: "Recording: \"Due to storm volume, please use our online license lookup.\"" },
            { name: "Maple Hollow Building Dept.", contact: r.phone(), result: "\"Everyone's out doing storm inspections. Leave a message.\"" },
          ],
          puzzle: {
            kind: "site",
            tool: "COMPARE SITES",
            required: true,
            prompt: "Compare the state license lookup with the roofer's own page. Click the one that's lying, or confirm the license checks out.",
            noneLabel: "LICENSE CHECKS OUT",
            sites,
            answer: scam ? sites.indexOf(own) : -1,
            reward: scam
              ? `License ${lic} belongs to ${other} in ${otherTown}, and it expired in 2023. ${co.name} is borrowing someone else's license.`
              : `License ${lic} is active, belongs to ${co.name}, and matches the local office on its own page. This roofer checks out.`,
          },
          scam,
          loss: r.money(1000, 2000, 50),
          missedCost: `${n.name} canceled a licensed local roofer. The next storm soaked ${n.his} attic before anyone else could come.`,
          nextStep: scam
            ? {
              prompt: "The check hasn't cleared. What should happen next?",
              options: [
                { text: `Call ${n.his} bank to stop payment on the check, then report the roofer to the state attorney general and ReportFraud.ftc.gov`, correct: true, why: "Stopping the check before it clears saves the money, and reports help stop storm chasers." },
                { text: "Let the check cash and hope they show up Monday", why: "Unlicensed storm chasers often take deposits and vanish." },
                { text: "Text the crew lead and ask for the deposit back", why: "He'll stall until the check clears." },
              ],
            }
            : {
              prompt: "The check hasn't cleared. What should happen next?",
              options: [
                { text: "Stop payment on the check and report the roofer" },
                { text: "Cancel and wait for a crew from out of state" },
                { text: "Tear up the contract and fix the roof alone" },
              ],
            },
          tells: scam
            ? [
              `License ${lic} belongs to ${other} and expired in 2023.`,
              "Storm chasers knock right after bad weather and push you to sign today.",
              "Checking the license with the state is what settles it.",
            ]
            : [
              `The state lookup shows license ${lic} active for ${co.name} at its local address.`,
              "A written contract and a one-third deposit, not payment in full up front.",
              "Its own page and the state record match.",
            ],
          tip: "After a storm, check a contractor's license with your state before paying, get a written contract, and never pay in full up front.",
          source: SOURCES.hardContractor,
        };
      },
    },

    // 10. Real vs fake debt collector. Twin; story vs the validation notice.
    {
      id: "hard-debt-collector",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.priya;
        const scam = r.chance(0.55);
        const creditor = r.pick(["Hillside Wireless", "Lakeview Electric", "Crestline Internet"]);
        const amount = r.money(180, 900, 1);
        const amount2 = amount + r.money(150, 600, 25);
        const end = String(r.int(1000, 9999));
        let end2 = r.lookalike(end);
        if (!/^\d+$/.test(end2)) end2 = String((Number(end) + r.int(11, 88)) % 9000 + 1000);
        const [fakeCallback, noticePhone] = twoPhones(r);
        const callback = scam ? fakeCallback : noticePhone;
        const agent = r.pick(["Sam", "Jordan", "Alex"]);
        const app = r.pick(["CashDrop", "ZipSend", "PayPeer"]);
        const wrong = r.int(0, 2);
        const facts = [
          {
            ok: `"This is about your ${creditor} account ending ${end}."`,
            bad: `"This is about your ${creditor} account ending ${end2}."`,
            reward: `The caller says the account ends in ${end2}, but the notice says ${end}.`,
          },
          {
            ok: `"The balance is ${usd(amount)}, same as the notice we mailed."`,
            bad: `"The balance is ${usd(amount2)}, same as the notice we mailed."`,
            reward: `The caller says the balance is ${usd(amount2)}, but the notice says ${usd(amount)}.`,
          },
          {
            ok: "\"We mailed your validation notice last month.\"",
            bad: "\"We haven't been able to mail you anything yet.\"",
            reward: "The caller says they never mailed anything, but Priya has Ridgeway's validation notice.",
          },
        ];
        const lines = [
          `"This is ${agent} with Ridgeway Recovery. This call is from a debt collector."`,
          ...facts.map((f, i) => (scam && i === wrong ? f.bad : f.ok)),
          "\"If you'd like to settle today, we can take a card payment now.\"",
        ];
        return {
          neighbor: n,
          resident: `Priya says: "A debt collector left a message about my old ${creditor} bill. I called back and gave my date of birth to confirm it's me. They want me to settle today. I haven't paid yet."`,
          channel: "voicemail",
          from: `Ridgeway Recovery (${callback})`,
          body: `"This message is for Priya. This is ${agent} with Ridgeway Recovery, a debt collector, about your ${creditor} account. Please call us back today at ${callback} to resolve the balance."`,
          inMessageCall: scam
            ? `${agent} gets sharp fast: "If this isn't paid by five, we file for a warrant. The quickest way is ${app}; I'll text you our handle."`
            : `${agent} is polite: "You can pay by card, by check to the address on the notice, or dispute it in writing by the date on the notice."`,
          history: [
            `Last month Priya got a validation notice by mail from Ridgeway Recovery: ${usd(amount)} owed to ${creditor}, account ending ${end}.`,
            `The notice lists Ridgeway's number as ${noticePhone} and gives her 30 days to dispute.`,
          ],
          directory: [
            { name: "Ridgeway Recovery (number on the notice)", contact: noticePhone, result: "\"All of our agents are helping other callers. Your wait is about 40 minutes.\"" },
            { name: creditor, contact: r.phone(), result: "\"That account was sold to a collector. We can't discuss it anymore.\"" },
          ],
          puzzle: {
            kind: "story",
            tool: "CHECK THE STORY",
            required: true,
            prompt: "Here's what the caller told Priya. Click the line that contradicts the History tab, or say the story holds up.",
            lines,
            answer: scam ? wrong + 1 : -1,
            reward: scam
              ? `${facts[wrong].reward} This isn't the real Ridgeway. Fake collectors buy partial details and fill in the rest.`
              : "Every detail matches the validation notice: collector, creditor, account and amount. This is the real collector. Priya can pay or dispute through the notice's address and number.",
          },
          scam,
          loss: r.money(400, 900, 50),
          missedCost: "Priya ignored a real, validated debt. Ridgeway took it to court, and fees piled on top.",
          nextStep: scam
            ? {
              prompt: "What should Priya do?",
              options: [
                { text: "Don't pay this caller; contact Ridgeway at the number on the mailed notice, and report the call to the FTC", correct: true, why: "Use the contact info on the validation notice. Fake collectors pressure and threaten; report them to the FTC, CFPB or state attorney general." },
                { text: "Pay today to make the calls stop", why: "Paying a fake collector doesn't touch the real debt, and they'll call again." },
                { text: "Pay by card but ask for an emailed receipt", why: "A receipt from a scammer means nothing, and now they have her card." },
              ],
            }
            : {
              prompt: "What should Priya do?",
              options: [
                { text: "Report Ridgeway to the FTC and block the number" },
                { text: "Ignore it; old bills just go away" },
                { text: "Hang up and change her phone number" },
              ],
            },
          tells: scam
            ? [
              "A detail on the call didn't match the validation notice Priya already has.",
              `Called back, they threatened a warrant and pushed ${app}. Real collectors can't threaten arrest.`,
              "The callback number wasn't the one on the notice.",
            ]
            : [
              "Every detail matched the validation notice Priya got by mail.",
              "The caller said it was a debt collector and offered normal ways to pay or dispute.",
              "No threats, no payment apps, no rush beyond the notice's own deadline.",
            ],
          tip: "A real collector must send a validation notice. Pay or dispute through the contact info on that notice, and hang up on anyone who threatens arrest.",
          source: SOURCES.hardDebt,
        };
      },
    },

    // 11. "Your number was moved to a new device." Real carrier notice vs SIM-swap phish. Twin; link.
    {
      id: "hard-sim-swap",
      tier: 3,
      build(r) {
        const n = NEIGHBORS.dev;
        const scam = r.chance(0.5);
        const carrier = r.pick([{ name: "Hollow Mobile", slug: "hollowmobile" }, { name: "Mapleton Wireless", slug: "mapletonwireless" }]);
        const realDom = `${carrier.slug}.example`;
        const code = r.shortCode();
        const phoneModel = r.pick(["Pixelon 9", "Orbit X2", "Nova S5"]);
        const day = r.pick(["Saturday", "Sunday"]);
        const url = scam
          ? r.pick([
            `https://account.${realDom}.device-check.example/review`,
            `https://account.${lookDomain(r, carrier.slug)}/review`,
            `https://${carrier.slug}-support.example/review`,
          ])
          : `https://account.${realDom}/devices/review`;
        const owner = url.split("/")[2].split(".").slice(-2).join(".");
        return {
          neighbor: n,
          resident: `Dev says: "I got this text about my number moving to a new phone. I tapped the link and it's asking me to sign in to my ${carrier.name} account. I haven't typed anything yet."`,
          channel: "text",
          from: code,
          body: `${carrier.name}: Your number was moved to a new device (${phoneModel}) on ${day}. If this wasn't you, review it now: ${url}`,
          history: [
            `Dev bought a new ${phoneModel} at the ${carrier.name} store on ${day}.`,
            `${carrier.name}'s website is ${realDom}.`,
          ],
          directory: [
            { name: `${carrier.name} store, Main St`, contact: r.phone(), result: "\"We're slammed with upgrades. Can you hold? ...\" (Twenty minutes of smooth jazz.)" },
          ],
          puzzle: {
            kind: "link",
            tool: "UNTANGLE LINK",
            required: true,
            prompt: "Click the part of the address that shows who really owns this site.",
            url,
            reward: scam
              ? `The site belongs to ${owner}, not ${realDom}. Scammers timed this to Dev's real upgrade to steal his login and take over his number.`
              : `The site belongs to ${realDom}, ${carrier.name}'s real website. It's a normal notice about Dev's own upgrade.`,
          },
          scam,
          loss: r.money(900, 1800, 50),
          missedCost: `Dev reported his own upgrade as fraud. ${carrier.name} froze his line for two days, and he missed supplier calls during a delivery rush.`,
          nextStep: scam
            ? {
              prompt: "What should Dev do now?",
              options: [
                { text: `Close the page, call ${carrier.name} at a number he trusts to add a port-out PIN, and forward the text to 7726`, correct: true, why: "A port-out PIN or lock makes it much harder to move his number. Reporting helps the carrier block the text." },
                { text: "Sign in quickly to make sure nobody else moved his number", why: "Signing in on that page hands the scammer his login, the first step of a SIM swap." },
                { text: "Reply STOP so the texts end", why: "Replying confirms his number is active, and the link is still out there." },
              ],
            }
            : {
              prompt: "What should Dev do now?",
              options: [
                { text: "Call the carrier and report a SIM swap" },
                { text: "Forward the text to 7726 and delete it" },
                { text: "Factory-reset the new phone to be safe" },
              ],
            },
          tells: scam
            ? [
              `The link's real owner is ${owner}, not ${realDom}.`,
              "Scammers send \"your number moved\" texts to catch people right after real upgrades.",
              "A stolen carrier login can be used to move your number and grab your bank codes.",
            ]
            : [
              `The link goes to ${realDom}, ${carrier.name}'s real site.`,
              `It matches what Dev did: a new ${phoneModel} on ${day}.`,
              "Carriers send these notices so you can spot a SIM swap you didn't ask for.",
            ],
          tip: "Ask your carrier for a port-out PIN or number lock, and check device alerts by typing the carrier's address yourself.",
          source: SOURCES.hardSimSwap,
        };
      },
    },
  ]);
})();
