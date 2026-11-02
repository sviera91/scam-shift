// cases/medium.js — tier 1-2 templates: tolls, marketplace, rentals, prizes, utilities, charity, QR codes and more.

addSources({
  medToll: {
    label: "FTC: Got a text about unpaid tolls? It's probably a scam",
    url: "https://consumer.ftc.gov/consumer-alerts/2025/01/got-text-about-unpaid-tolls-its-probably-scam",
  },
  medOverpay: {
    label: "FTC: Selling stuff online? Here's how to avoid a scam",
    url: "https://consumer.ftc.gov/consumer-alerts/2022/07/selling-stuff-online-heres-how-avoid-scam",
  },
  medMystery: {
    label: "FTC: Mystery Shopping Scams",
    url: "https://consumer.ftc.gov/articles/mystery-shopping-scams",
  },
  medPrize: {
    label: "FTC: Fake Prize, Sweepstakes, and Lottery Scams",
    url: "https://consumer.ftc.gov/articles/fake-prize-sweepstakes-and-lottery-scams",
  },
  medUtility: {
    label: "FTC: Scammers Pretend To Be Your Utility Company",
    url: "https://consumer.ftc.gov/articles/scammers-pretend-be-your-utility-company",
  },
  medCharity: {
    label: "FTC: Donating Safely and Avoiding Scams",
    url: "https://consumer.ftc.gov/features/donating-safely-and-avoiding-scams",
  },
  medQr: {
    label: "FTC: See a QR code parked somewhere? Don't scan it...yet!",
    url: "https://consumer.ftc.gov/consumer-alerts/2026/09/see-qr-code-parked-somewhere-dont-scan-ityet",
  },
  medRefund: {
    label: "FTC: How to recognize a fake Geek Squad renewal scam",
    url: "https://consumer.ftc.gov/consumer-alerts/2022/10/how-recognize-fake-geek-squad-renewal-scam",
  },
});

const medCap = (s) => s[0].toUpperCase() + s.slice(1);

addTemplates([
  // 1. Unpaid toll text. Twin: sometimes it's the real agency (the card on file really expired).
  {
    id: "toll-notice-text",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.dev, NEIGHBORS.rosa, NEIGHBORS.okafor, NEIGHBORS.priya]);
      const scam = r.chance(0.55);
      const agency = r.pick([
        { name: "Lakeshore Express Pass", slug: "lakeshorepass" },
        { name: "Maple Valley Tollway", slug: "maplevalleytoll" },
        { name: "Ridgeline Bridge Authority", slug: "ridgelinebridge" },
      ]);
      const realDomain = `${agency.slug}.example`;
      const amount = `$${r.int(3, 14)}.${r.pick(["25", "50", "75"])}`;
      const fee = usd(r.pick([10, 15, 25]));
      const day = r.int(18, 27);
      const code = r.shortCode();
      const ref = r.int(10000, 99999);
      let url, owner, from;
      if (scam) {
        if (r.chance()) {
          owner = `${r.pick(["toll-balance", "pay-notice", "ezpay-center"])}.example`;
          url = `https://${realDomain}.${owner}/n/${ref}`;
        } else {
          owner = `${r.lookalike(agency.slug)}.example`;
          url = `https://${owner}/pay/${ref}`;
        }
        from = r.chance() ? `+1 (${r.int(201, 989)}) ${r.phone()}` : r.lookalike(code);
      } else {
        owner = realDomain;
        url = `https://${realDomain}/account/notices/${ref}`;
        from = code;
      }
      return {
        neighbor: n,
        resident: `${n.name} says: "I paid it through the link so I wouldn't get the late fee. Hope that was okay?"`,
        channel: "text",
        from,
        body: `${agency.name}: A ${amount} toll from Oct ${day} couldn't be charged to your account. Pay by Friday to avoid a ${fee} late fee: ${url}`,
        history: [
          `${n.name} has a ${agency.name} account and drove that road on Oct ${day}.`,
          scam
            ? `${medCap(n.he)} updated the card on ${n.his} toll account in the spring. Autopay has worked ever since.`
            : `${medCap(n.his)} bank mailed ${n.him} a new card last month. ${medCap(n.he)} hasn't updated it everywhere yet.`,
          `Real ${agency.name} alerts come from short code ${code}.`,
        ],
        directory: [
          {
            name: `${agency.name} customer service`,
            contact: r.phone(),
            result: "Recorded message: \"Wait times are over 45 minutes. You can also check your balance by logging in on our website.\"",
          },
        ],
        puzzle: {
          kind: "link",
          tool: "UNTANGLE LINK",
          prompt: "Click the part of the address that shows who really owns this payment page.",
          url,
          reward: scam
            ? `The page belongs to ${owner}, not ${realDomain}. ${agency.name} doesn't own it.`
            : `The page is on ${realDomain}, ${agency.name}'s real site. The rest is just a page on it.`,
        },
        scam,
        loss: r.money(400, 900, 50),
        missedCost: `${n.name} ignored it. The ${amount} toll picked up a ${fee} late fee and a second notice.`,
        nextStep: scam
          ? {
            prompt: `${n.name} already typed ${n.his} card into that page. What first?`,
            options: [
              { text: "Call the card company at the number on the back of the card, report it, and get a new card", correct: true, why: "The scammer has the card number now. The card company can block it and dispute any charges." },
              { text: "Go back to the link and cancel the payment", why: "That site belongs to the scammer. Going back only gives them another chance to collect info." },
              { text: "Reply STOP so they quit texting", why: "Replying tells scammers the number works, and it does nothing to protect the stolen card." },
            ],
          }
          : {
            prompt: `${n.name} already paid through the link. What should ${n.he} do now?`,
            options: [
              { text: "Call the card company and cancel the card" },
              { text: "Forward the text to 7726 (SPAM) and delete it" },
              { text: "Dispute the toll payment with the bank" },
            ],
          },
        tells: scam
          ? [
            `The link opens ${owner}, not ${realDomain}.`,
            `It came from ${from}, not ${agency.name}'s short code ${code}.`,
            `${medCap(n.his)} autopay card was up to date, so there was no reason for a toll to fail.`,
            "A small amount plus a late-fee deadline is meant to make you pay before you check.",
          ]
          : [
            `The link really opens ${realDomain}, the agency's own site.`,
            `It came from ${agency.name}'s real short code, ${code}.`,
            `${medCap(n.his)} card on file had just been replaced, which explains the failed charge.`,
          ],
        tip: "Don't pay a toll from a text link. Log in to the toll agency's site or app yourself, or call a number you know, and check your balance.",
        source: SOURCES.medToll,
      };
    },
  },

  // 2. Marketplace overpayment (fake check). Scam only.
  {
    id: "marketplace-overpay",
    tier: 2,
    build(r) {
      const n = NEIGHBORS.rosa;
      const price = r.money(250, 600, 25);
      const extra = r.money(300, 900, 50);
      const method = r.pick(["cashier's check", "business check"]);
      const buyer = r.pick(["Kyle M.", "Dana R.", "Marcus T.", "Jen P."]);
      const contradiction = r.pick([
        { fact: "The buyer said they live across town and would pick the oven up themselves.", line: "I'm traveling for work, so my mover will collect it." },
        { fact: "The buyer agreed to pay cash when they picked up the oven.", line: "I already mailed the check, like we agreed." },
        { fact: `The buyer offered the full ${usd(price)} asking price right away, no haggling.`, line: `Thanks again for coming down to ${usd(price - 50)} for me!` },
      ]);
      const lines = [
        "Hi! Is the oven still available? It's perfect for my catering business.",
        "Great, I'll take it. Could you hold it for me?",
        "Let me know once the check is deposited!",
      ];
      const answer = r.int(1, 3);
      lines.splice(answer, 0, contradiction.line);
      return {
        neighbor: n,
        resident: `Rosa says: "I deposited the buyer's ${method} for my old oven, and my bank app says the money is available. They want the extra ${usd(extra)} back. I was about to send it."`,
        channel: "dm",
        from: `${buyer} (Marketplace buyer)`,
        body: `So sorry! My assistant made the ${method} out for ${usd(price + extra)} instead of ${usd(price)}. Could you send the extra ${usd(extra)} back by payment app today? I'll sort out pickup this week.`,
        history: [
          `Rosa listed her old bakery oven for ${usd(price)} on a local marketplace.`,
          contradiction.fact,
        ],
        directory: [
          {
            name: "Rosa's bank (number on her card)",
            contact: r.phone(),
            result: "\"The deposit shows as available, but that only means we made the funds available. If the check turns out to be fake, it can bounce weeks from now and you'd owe it back.\"",
          },
        ],
        puzzle: {
          kind: "story",
          tool: "CHECK THE STORY",
          prompt: "Here's the buyer's chat with Rosa. Find the line that contradicts the History tab.",
          lines,
          answer,
          reward: `The buyer's story changed: "${contradiction.line}" doesn't match what they told Rosa before. A shifting story plus an overpayment is a fake check scam.`,
        },
        scam: true,
        loss: Math.min(2000, price + extra),
        nextStep: {
          prompt: "Rosa hasn't sent the money yet. What should she do?",
          options: [
            { text: "Send nothing, tell her bank the check may be fake, and report the buyer to the marketplace", correct: true, why: "Money that's 'available' isn't proof a check is good. If it bounces, every dollar she sent back comes out of her own pocket." },
            { text: `Send the ${usd(extra)} back, since the bank says the funds are available`, why: "Banks make deposits available fast, but a fake check can bounce weeks later. Then she'd owe the bank, and the buyer keeps what she sent." },
            { text: "Ask the buyer to mail a new check for the right amount", why: "The buyer is the scammer. A second check would be just as fake." },
          ],
        },
        tells: [
          "The buyer 'accidentally' overpaid and wants the difference back by payment app.",
          `The buyer's story changed: "${contradiction.line}"`,
          "'Available' in a bank app doesn't mean a check is good. Fake checks can bounce weeks later.",
        ],
        tip: "If a buyer pays more than your price and asks for the difference back, it's a scam. Don't send anything.",
        source: SOURCES.medOverpay,
      };
    },
  },

  // 3. Rental listing. Twin: copied listing + deposit before a showing, or a real manager with a tour.
  {
    id: "rental-deposit-first",
    tier: 2,
    build(r) {
      const n = NEIGHBORS.priya;
      const scam = r.chance(0.55);
      const address = `${r.int(12, 98)} ${r.pick(["Birch Ln", "Willow Ct", "Alder St", "Cedar Row"])}`;
      const rent = r.money(650, 900, 25);
      const realRent = scam ? rent + r.money(350, 600, 25) : rent;
      const manager = r.pick([
        { name: "Maple Realty", domain: "maplerealty.example" },
        { name: "Hollow Homes Co.", domain: "hollowhomes.example" },
        { name: "Stonebridge Rentals", domain: "stonebridgerentals.example" },
      ]);
      const agent = r.pick(["Jess", "Tom", "Aisha", "Luis"]);
      const poster = r.pick(["Mark", "Ellen", "Greg", "Nina"]);
      const feature = r.pick(["blue front door", "big bay window", "clawfoot tub", "brick fireplace"]);
      const time = r.pick(["10", "11", "1"]);
      const appFee = r.pick([25, 35, 40]);
      const listingId = r.int(10000, 99999);
      const board = {
        url: `https://rentboard.example/listing/${listingId}`,
        title: `${address} · ${usd(rent)}/mo`,
        lines: scam
          ? [`Contact: ${poster} (owner)`, "Deposit holds it, viewing after", `Photos: ${feature}`]
          : [`Contact: ${agent}, ${manager.name}`, `Tours Saturday at ${time}`, `Photos: ${feature}`],
      };
      const real = {
        url: `https://${manager.domain}/rentals`,
        title: `${address} · ${usd(realRent)}/mo`,
        lines: [`Managed by ${manager.name} (agent: ${agent})`, "In-person tours, then apply online", `Photos: ${feature}`],
      };
      const boardFirst = r.chance();
      return {
        neighbor: n,
        resident: `Priya says: "This place is way under budget! I already sent them my full name, phone and current address so they'd hold it. Haven't paid anything yet. Is it real?"`,
        channel: "dm",
        from: scam ? `${poster} (listing poster)` : `${agent} · ${manager.name} (listing poster)`,
        body: scam
          ? `Yes, ${address} is still available! Lots of interest, so I'm holding it for the first person who sends the ${usd(rent)} deposit. Once it's in, we'll set up a time for you to see it.`
          : `Yes, ${address} is still available! Lots of interest, so tours are Saturday at ${time}. If you like it, apply on our site. There's a $${appFee} application fee.`,
        history: [
          `Priya found the listing for ${usd(rent)}/month, well under similar places nearby.`,
          scam
            ? `In an earlier message, ${poster} said they took a job overseas and a friend has the keys.`
            : `The listing says the unit is managed by ${manager.name}, with an office on Main St.`,
        ],
        directory: [
          {
            name: `${manager.name} office`,
            contact: r.phone(),
            result: "Voicemail: \"You've reached the leasing office. We're out showing units. Leave a message and we'll call you back within two days.\"",
          },
        ],
        puzzle: {
          kind: "site",
          tool: "COMPARE SITES",
          prompt: `Compare the listing Priya found with the one on ${manager.name}'s own website. Is one of them fake?`,
          sites: boardFirst ? [board, real] : [real, board],
          answer: scam ? (boardFirst ? 0 : 1) : -1,
          reward: scam
            ? `The real listing is ${manager.name}'s, at ${usd(realRent)}/month with in-person tours. The cheap copy uses the same photos with a different contact.`
            : `Both listings match: same ${usd(rent)} rent, same ${manager.name} agent, in-person tours first.`,
        },
        scam,
        loss: r.money(600, 1200, 50),
        missedCost: `Priya skipped the tour and the apartment went to someone else. Her next place costs ${usd(r.money(150, 300, 25))} more a month.`,
        nextStep: scam
          ? {
            prompt: "Priya hasn't paid. What should she do?",
            options: [
              { text: "Don't send the deposit. Report the fake listing to the rental site and ReportFraud.ftc.gov, and watch for misuse of her info", correct: true, why: "Real landlords let you see the place before you pay. Reporting gets the copied listing taken down." },
              { text: "Send half the deposit to show she's serious", why: "Any amount goes straight to a scammer. There's no apartment for them to rent her." },
              { text: "Ask the poster for a video tour, then pay", why: "Scammers can send the real owner's photos or video. The listing is copied, so deal only with the real manager." },
            ],
          }
          : {
            prompt: "Priya is waiting for an answer. What should she do?",
            options: [
              { text: "Report the listing to the rental site as a scam" },
              { text: "Stop replying and look for a different place" },
              { text: "Ask them to mail her the keys so she can skip the tour" },
            ],
          },
        tells: scam
          ? [
            "They wanted the deposit before Priya could see the place.",
            "The 'owner' is overseas, a classic rental scam story.",
            `The same photos are listed by ${manager.name} for ${usd(realRent)}. The cheap copy is the fake.`,
          ]
          : [
            "The agent offered an in-person tour before asking for any money.",
            `The listing matches ${manager.name}'s own website: same price, same agent.`,
            "A small application fee on the manager's own site is normal for real rentals.",
          ],
        tip: "Never pay a deposit or rent for a place you haven't seen. Search the address to see if the listing shows up somewhere else with a different contact.",
        source: SOURCES.rental,
      };
    },
  },
  // 4. Mystery shopper fake check. Scam only.
  {
    id: "mystery-shopper-check",
    tier: 1,
    build(r) {
      const n = r.pick([NEIGHBORS.priya, NEIGHBORS.dev, NEIGHBORS.okafor]);
      const checkAmt = r.money(1800, 2900, 50);
      const cards = r.pick([2, 3, 4]);
      const cardVal = r.pick([300, 400, 500]);
      const pay = r.pick([250, 300, 350]);
      const store = r.pick(["Maple Mart", "Corner Pharmacy", "Hollow Market"]);
      const company = r.pick(["ShopEval Partners", "Secret Guest Services", "TrueVisit Insights"]);
      const payer = r.pick(["a dental office", "a roofing company", "a church"]);
      return {
        neighbor: n,
        resident: `${n.name} says: "I deposited the ${usd(checkAmt)} check and bought ${cards} gift cards like the sheet said. I haven't sent the card numbers yet. Easiest job ever?"`,
        channel: "email",
        from: `${company} <onboarding@${company.toLowerCase().replace(/[^a-z]/g, "")}.example>`,
        body: `Welcome to ${company}! Your first evaluation is at ${store}. Deposit the enclosed check, follow your assignment sheet, and keep ${usd(pay)} as your pay. Thanks for helping stores improve!`,
        history: [
          `${n.name} signed up on a "get paid to shop" website last week.`,
          `The check came in the mail from ${payer} in another state, not from ${company}.`,
        ],
        directory: [
          {
            name: `${medCap(n.his)} bank (number on the card)`,
            contact: r.phone(),
            result: "\"The check shows as available, but it's still being collected. If it bounces, you owe us the full amount.\"",
          },
        ],
        puzzle: {
          kind: "shred",
          tool: "REASSEMBLE LETTER",
          prompt: `${n.name} tore up the assignment sheet by accident. Put it back together.`,
          lines: [
            `${company} · Evaluator Assignment #1`,
            `Visit ${store} and buy ${cards} gift cards worth ${usd(cardVal)} each.`,
            "Rate the cashier's friendliness from 1 to 5.",
            "Scratch off each card and text photos of the codes to your agent.",
            `Keep ${usd(pay)} as your pay. Send the codes within 24 hours.`,
          ],
          reward: "The real 'assignment' is sending gift card codes. No real mystery shopping job asks for that. The check will bounce, and the money on those cards is really yours.",
        },
        scam: true,
        loss: cards * cardVal,
        nextStep: {
          prompt: `${n.name} has the cards but hasn't sent the codes. What now?`,
          options: [
            { text: "Don't send the codes, and tell the bank the check is probably fake", correct: true, why: "Once the codes are sent, the money is gone. The bank needs to know before the check bounces." },
            { text: `Send the codes and keep the ${usd(pay)}, since the check already cleared`, why: "'Available' isn't 'good.' A fake check can bounce weeks later, and the bank takes the whole amount back." },
            { text: "Wait a few days for the check to clear, then send the codes", why: "It can take weeks to spot a fake check. Waiting a few days proves nothing." },
          ],
        },
        tells: [
          "A job that sends you a check and asks you to buy gift cards is always a fake check scam.",
          `The check came from ${payer}, not the company that 'hired' ${n.him}.`,
          "The assignment sheet asks for photos of the gift card codes.",
        ],
        tip: "Never deposit a check from a 'job' and send money or gift card codes back. Real mystery shopping jobs don't work that way.",
        source: SOURCES.medMystery,
      };
    },
  },

  // 5. Raffle prize. Twin: a real raffle win with free pickup, or a fake "pay the fee first".
  {
    id: "raffle-prize-fee",
    tier: 1,
    build(r) {
      const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.ines]);
      const scam = r.chance(0.55);
      const org = r.pick([
        { name: "Maple Hollow Library", event: "Fall Fair raffle", desk: "front desk", slug: "mh-library" },
        { name: "Maple Hollow Fire Dept.", event: "Pancake Breakfast raffle", desk: "station office", slug: "mh-firedept" },
        { name: "Maple Hollow Rotary Club", event: "Harvest Dinner raffle", desk: "Rotary office on Elm St", slug: "mh-rotary" },
      ]);
      const prize = r.pick(["a $500 grocery gift card", "a new tablet", "a weekend at the Lakeview Inn"]);
      const stub = r.int(1000, 4999);
      const ticket = scam ? stub + r.int(100, 4000) : stub;
      let winner = scam ? (ticket + r.int(100, 900)) % 9000 + 1000 : ticket;
      if (scam && winner === stub) winner += 1;
      const fee = r.money(49, 149, 10);
      const slug = org.slug;
      const k = r.shuffle(["1", "2", "3"]);
      const k2 = r.shuffle(["1", "2", "3"]);
      return {
        neighbor: n,
        resident: `${n.name} says: "I did buy a raffle ticket! I already texted back my full name so they'd hold my prize. What do I do next?"`,
        channel: "text",
        from: r.phone(),
        body: scam
          ? `${org.name}: Congrats! Ticket #${ticket} won ${prize} in our ${org.event}! A ${usd(fee)} tax and delivery fee releases your prize: https://${slug}-prizes.example/claim`
          : `${org.name}: Congrats! Ticket #${ticket} won ${prize} in our ${org.event}! Bring your ticket stub to the ${org.desk} by Friday to pick it up.`,
        history: [
          `${n.name} bought one ticket at the ${org.event}. The stub on ${n.his} fridge reads #${stub}.`,
        ],
        directory: [
          {
            name: `${org.name} main line`,
            contact: "555-0160",
            result: "A volunteer answers: \"I'm just covering phones today, I don't know about the raffle. Try the menu for the events team.\"",
          },
        ],
        puzzle: {
          kind: "phonetree",
          tool: "CALL THE REAL NUMBER",
          prompt: "Call the main line and get through to the team that runs the raffle.",
          number: "555-0160",
          menu: {
            say: `Thanks for calling ${org.name}. For hours and directions, press ${k[0]}. For events and raffles, press ${k[1]}. For donations, press ${k[2]}.`,
            options: [
              { key: k[0], dead: "A recording reads the hours, then hangs up. Back to the start." },
              {
                key: k[1],
                next: {
                  say: `Events. For upcoming events, press ${k2[0]}. For raffle winners and prizes, press ${k2[1]}. To volunteer, press ${k2[2]}.`,
                  options: [
                    { key: k2[0], dead: "A long list of upcoming events plays. Back to the start." },
                    { key: k2[1], goal: true },
                    { key: k2[2], dead: "You reach the volunteer sign-up voicemail. Back to the start." },
                  ],
                },
              },
              { key: k[2], dead: "You reach the donations voicemail. Back to the start." },
            ].sort((a, b) => a.key.localeCompare(b.key)),
          },
          reward: scam
            ? `Raffle team: "The winning ticket was #${winner}, and winners just pick up at our desk. We never charge fees or text links."`
            : `Raffle team: "Yes! Ticket #${ticket} won ${prize}. Just bring the stub by Friday. There's nothing to pay."`,
        },
        scam,
        loss: r.money(400, 800, 50),
        missedCost: `${n.name} never picked up ${prize}, so it went to the backup winner.`,
        nextStep: scam
          ? {
            prompt: `${n.name} gave ${n.his} name but hasn't paid. What now?`,
            options: [
              { text: "Don't pay. Real prizes are free. Report the text to 7726 (SPAM) and ReportFraud.ftc.gov", correct: true, why: "Paying to collect a prize is the sign of a scam. Reporting helps stop the text from reaching neighbors." },
              { text: `Pay the fee with a gift card so ${n.his} bank card stays safe`, why: "Gift cards are a scammer's favorite payment. The money is gone and there's no prize." },
              { text: `Text back a photo of the ticket stub to prove it's ${n.his}`, why: "The ticket numbers don't even match. Replying keeps the scammer talking and invites more 'fees'." },
            ],
          }
          : {
            prompt: `${n.name} is waiting to hear back. What should ${n.he} do?`,
            options: [
              { text: "Forward the text to 7726 (SPAM) and delete it" },
              { text: "Block the number so they can't text again" },
              { text: "Ignore it. Nobody really wins raffles" },
            ],
          },
        tells: scam
          ? [
            "It asks for a fee to release the prize. Real prizes are free.",
            `The ticket number in the text (#${ticket}) isn't the one on ${n.his} stub (#${stub}).`,
            "The raffle team says winners pick up in person and never pay.",
          ]
          : [
            `The ticket number matches ${n.his} stub, #${stub}.`,
            "Pickup in person with the stub, and nothing to pay.",
            "The raffle team confirmed it through the main line.",
          ],
        tip: "If you have to pay to get a prize, it's not a prize. Real contests never charge fees, taxes or shipping up front.",
        source: SOURCES.medPrize,
      };
    },
  },

  // 6. Utility disconnect call. Twin: sometimes the autopay really bounced.
  {
    id: "utility-disconnect-call",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.rosa, NEIGHBORS.dev]);
      const biz = n === NEIGHBORS.rosa ? { name: "the bakery", goods: "bread" } : { name: "the hardware store", goods: "sales" };
      const scam = r.chance(0.55);
      const utility = r.pick(["Maple Hollow Power", "Valley Gas & Electric"]);
      const last4 = r.int(1000, 9999);
      const bill = r.money(180, 420, 1);
      const billNum = r.phone();
      const scamNum = r.phone();
      const months = [["Aug", 3], ["Sep", 3], ["Oct", 3]];
      const failIdx = r.int(0, 2);
      const switchMonth = months[failIdx][0];
      const rows = months.map(([m, d], i) => {
        const amt = bill + r.int(-40, 40);
        return !scam && i === failIdx
          ? { date: `${m} ${d}`, desc: `${utility} autopay: RETURNED, account not found`, amount: "$0.00" }
          : { date: `${m} ${d}`, desc: `${utility} autopay`, amount: `-${usd(amt)}` };
      });
      rows.push(
        { date: `${r.pick(["Aug", "Sep"])} ${r.int(10, 28)}`, desc: r.pick(["Flour & Co. supplies", "Hollow Lumber wholesale"]), amount: `-${usd(r.money(300, 900, 10))}` },
        { date: `Oct ${r.int(10, 28)}`, desc: "Card sales deposit", amount: `+${usd(r.money(1200, 3000, 10))}` },
      );
      const monthOrder = { Aug: 0, Sep: 1, Oct: 2 };
      const key = (row) => monthOrder[row.date.slice(0, 3)] * 100 + Number(row.date.slice(4));
      const failed = rows[failIdx];
      rows.sort((a, b) => key(a) - key(b));
      const failMonth = months[failIdx][0];
      const due = scam ? r.money(220, 640, 1) : bill;
      const cutDay = `Nov ${r.int(12, 20)}`;
      return {
        neighbor: n,
        resident: `${n.name} says: "If the power goes out, I lose a whole day of ${biz.goods}. I haven't paid anything yet. Is this real?"`,
        channel: "voicemail",
        from: scam ? `${utility} (${r.chance() ? billNum : scamNum})` : `${utility} (${billNum})`,
        body: scam
          ? `"This is ${utility} calling for account ending ${last4}. Your balance of ${usd(due)} is past due, and a crew is scheduled to disconnect service today at ${r.pick(["2", "3", "4"])} PM. Call our billing desk at ${scamNum} right away to keep your service on."`
          : `"This is ${utility} calling for account ending ${last4}. Your balance of ${usd(due)} is past due, and service may be disconnected on ${cutDay}. Pay online, at our office, or call the number on your bill to set up a payment plan."`,
        inMessageCall: scam
          ? `A calm "billing agent" says the only way to stop today's crew is a payment app transfer or prepaid cards, and asks ${n.him} to stay on the line while ${n.he} buys them.`
          : undefined,
        history: [
          `${n.name} pays ${utility} by autopay for ${biz.name}. The account number ends in ${last4}.`,
          `${medCap(n.he)} moved ${biz.name}'s banking to a new account in ${switchMonth}.`,
          `The customer service number on ${n.his} bill is ${billNum}.`,
        ],
        directory: [
          {
            name: `${utility} (number on the bill)`,
            contact: billNum,
            result: "Hold music... \"Due to storm repairs, wait times are over 30 minutes.\" (No answer yet.)",
          },
        ],
        puzzle: {
          kind: "audit",
          tool: "AUDIT STATEMENT",
          prompt: `Check ${biz.name}'s bank statement. Did any ${utility} payment fail to go through?`,
          rows,
          answer: scam ? -1 : rows.indexOf(failed),
          noneLabel: "ALL PAID",
          reward: scam
            ? `Every ${utility} autopay went through, including this month's. There's no past-due balance.`
            : `The ${failMonth} autopay was returned after the bank switch, so ${usd(due)} really is past due.`,
        },
        scam,
        loss: r.money(500, 1200, 50),
        missedCost: `${n.name} ignored it. The power was cut on ${cutDay}, and ${biz.name} lost a day of ${biz.goods} plus a reconnection fee.`,
        nextStep: scam
          ? {
            prompt: `${n.name} hasn't paid. What should ${n.he} do?`,
            options: [
              { text: `Ignore the number in the message and call ${utility} at the number on the bill`, correct: true, why: "Check your balance with the company directly, using a number you know is real." },
              { text: `Call ${scamNum} back and pay half to buy time`, why: "That's the scammer's line. Any amount sent by payment app or gift card is gone." },
              { text: "Pay by payment app, since it's the fastest way to stop the crew", why: "Real utilities don't demand payment app, wire or gift card payments. Only scammers do." },
            ],
          }
          : {
            prompt: `${n.name} is worried. What should ${n.he} do?`,
            options: [
              { text: "Ignore it. Real utilities never call" },
              { text: "Report the call to ReportFraud.ftc.gov and block the number" },
              { text: "Wait for a paper bill before doing anything" },
            ],
          },
        tells: scam
          ? [
            "A same-day shutoff with a separate 'billing desk' number is pressure, not a real notice.",
            "The 'agent' wanted a payment app transfer or prepaid cards.",
            "The bank statement shows every autopay went through.",
            "Caller ID and the last four account digits can be faked or stolen. They're not proof.",
          ]
          : [
            "It gave a shutoff date days away and pointed to normal ways to pay.",
            `The ${failMonth} autopay bounced after the bank switch.`,
            "No gift cards, no payment apps, no special number to call.",
          ],
        tip: "Real utilities don't demand same-day payment by gift card or payment app. Call the number on your bill to check.",
        source: SOURCES.medUtility,
      };
    },
  },
  // 7. Storm relief drive. Twin: a brand-new "relief fund" or the real local food bank.
  {
    id: "storm-relief-drive",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.ines, NEIGHBORS.rosa]);
      const scam = r.chance(0.55);
      const storm = r.pick(["Saturday's ice storm", "last week's flood", "Tuesday's windstorm"]);
      const fund = r.pick([
        { name: "Maple Hollow Storm Relief Fund", slug: "mh-stormrelief" },
        { name: "Hollow Neighbors Recovery Fund", slug: "hollowrecovery" },
        { name: "Maple Families First Relief", slug: "maplefamiliesfirst" },
      ]);
      const bank = { name: "Maple Hollow Food Bank", domain: "maplehollowfoodbank.example" };
      const gift = r.pick([50, 100, 150, 200]);
      const per = r.pick([25, 30, 40]);
      const days = r.int(2, 5);
      const sender = scam ? fund.name : bank.name;
      const page = scam
        ? {
          url: `https://${fund.slug}.example/give`,
          title: `${fund.name}: Give now`,
          lines: [`Started ${days} days ago`, "Pay by card, payment app or gift card", "No street address or staff names listed"],
        }
        : {
          url: `https://${bank.domain}/storm`,
          title: `${bank.name}: Storm drive`,
          lines: ["Serving Maple Hollow since 1987", "Food boxes handed out at 22 Mill St", "Gifts matched by Maple Grocers through Friday"],
        };
      const home = {
        url: `https://${bank.domain}`,
        title: `${bank.name}: Home`,
        lines: ["Serving Maple Hollow since 1987", "Storm drive: food boxes at 22 Mill St", "Annual report and board members listed"],
      };
      const pageFirst = r.chance();
      return {
        neighbor: n,
        resident: `${n.name} says: "I gave ${usd(gift)} through the link right away. Those poor families! Did it go to the right place?"`,
        channel: r.pick(["email", "dm"]),
        from: sender,
        body: `After ${storm}, dozens of families lost power and everything in their fridges. $${per} restocks one family's groceries. ${scam ? "Gifts are matched today only" : "Gifts are matched through Friday"}: ${page.url}`,
        history: scam
          ? [`${n.name} usually gives to the ${bank.name}.`, `${medCap(n.he)} hadn't heard of the ${fund.name} before this message.`]
          : [`${n.name} has given to the ${bank.name}'s winter drive for years.`, `${medCap(n.he)} hadn't seen a storm drive from them before this message.`],
        directory: [
          {
            name: "State charity regulator (registry search)",
            contact: "state charity registry website",
            result: scam
              ? `No record of the ${fund.name}. (Brand-new groups can take a while to register, so this alone isn't proof.)`
              : `${bank.name}: registered and in good standing.`,
          },
        ],
        puzzle: {
          kind: "site",
          tool: "COMPARE SITES",
          prompt: `Compare the donation page from the message with the ${bank.name} website ${n.name} looked up. Is one of them fake?`,
          sites: pageFirst ? [page, home] : [home, page],
          answer: scam ? (pageFirst ? 0 : 1) : -1,
          reward: scam
            ? `The "${fund.name}" is ${days} days old, has no address or staff, and takes gift cards. The real food bank has its own storm drive at 22 Mill St.`
            : `Both pages are the ${bank.name}'s own site: same address, same storm drive.`,
        },
        scam,
        loss: r.money(400, 900, 50),
        missedCost: `${n.name} disputed the ${usd(gift)} gift, and the food bank lost it (and the match) in the middle of the storm drive.`,
        nextStep: scam
          ? {
            prompt: `${n.name} already gave ${usd(gift)} by card. What now?`,
            options: [
              { text: "Call the card company to report the charge, then report the fund to ReportFraud.ftc.gov and the state charity regulator", correct: true, why: "The card company may be able to reverse it. Reports help shut the fake fund down before it reaches more neighbors." },
              { text: "Email the fund and ask for a tax receipt", why: "A fake charity will happily send a fake receipt, and now it knows the email works." },
              { text: "Wait for a thank-you note to see if it was real", why: "Waiting makes a dispute harder. Act now while the charge is fresh." },
            ],
          }
          : {
            prompt: `${n.name} is worried about the donation. What should ${n.he} do?`,
            options: [
              { text: "Call the card company and dispute the donation" },
              { text: "Report the message to the state charity regulator" },
              { text: "Ask the food bank for the money back" },
            ],
          },
        tells: scam
          ? [
            `The ${fund.name} popped up ${days} days ago and isn't registered with the state.`,
            "It takes gift cards and payment apps, and the 'match' is today only.",
            "No address, no staff, no details on how the money is used.",
          ]
          : [
            `The link goes to the ${bank.name}'s real website.`,
            "It's registered with the state and has a real address and storm drive.",
            "Card payment through its own site, and a match that runs for days, not hours.",
          ],
        tip: "After a disaster, give to charities you already know, or research a new one first. Never donate by gift card, wire or cash.",
        source: SOURCES.medCharity,
      };
    },
  },

  // 8. "Hi Abuela, new number." Twin: sometimes it really is Lucía, confirmed by her mom.
  {
    id: "grandma-new-number",
    tier: 2,
    build(r) {
      const n = NEIGHBORS.ines;
      const scam = r.chance(0.55);
      const oldNum = r.phone();
      let newNum = r.phone();
      if (newNum === oldNum) newNum = oldNum.replace(/\d$/, (d) => String((Number(d) + 1) % 10));
      const cities = ["Denver", "Austin", "Boston", "Tucson"];
      const city = r.pick(cities);
      const pets = ["Pepa", "Churro", "Luna", "Bizcocho"];
      const pet = r.pick(pets);
      const lines = [
        `Classes in ${city} are crazy right now 😅`,
        `${pet} chewed my old phone, that's why I switched lol`,
        "Mom says hi! Save me some flan for Thanksgiving 💛",
      ];
      let answer = -1;
      let lie = "";
      if (scam) {
        answer = r.int(0, 1);
        lines[answer] = answer === 0
          ? `Classes in ${r.pick(cities.filter((c) => c !== city))} are crazy right now 😅`
          : `My cat knocked my old phone in the sink, that's why I switched lol`;
        lie = lines[answer];
      }
      return {
        neighbor: n,
        resident: `Grandma Inés says: "I already saved Lucía's new number and deleted the old one. She wants to ask me something. Can I text her back?"`,
        channel: "text",
        from: newNum,
        body: "Hi Abuela! It's Lucía 💛 I got a new phone, so this is my number now. You can delete the old one. Text me back when you're free, I want to ask you something!",
        history: [
          `Lucía's saved number is ${oldNum}.`,
          `Lucía is away at college in ${city}. She has a dog named ${pet}.`,
        ],
        directory: [
          { name: "Lucía (old saved number)", contact: oldNum, result: "Straight to voicemail: \"Hi, it's Lucía! Leave a message!\"" },
          {
            name: "Ana (Lucía's mom, saved contact)",
            contact: r.phone(),
            result: scam
              ? "Voicemail: \"Hi, it's Ana, I'm at work until six. Leave a message!\""
              : `"Yes, Mamá! Lucía got a new phone on Tuesday. Her new number is ${newNum}."`,
          },
        ],
        puzzle: {
          kind: "story",
          tool: "CHECK THE STORY",
          prompt: "Inés asked how she's been. Here's what 'Lucía' texted back. Does anything contradict the History tab?",
          lines,
          answer,
          reward: scam
            ? `"${lie}" doesn't fit. Lucía is at college in ${city} and has a dog named ${pet}. This isn't Lucía.`
            : `Everything fits: college in ${city}, her dog ${pet}, and home for Thanksgiving.`,
        },
        scam,
        loss: r.money(500, 1500, 100),
        missedCost: "Inés blocked the new number, and Lucía couldn't reach her for a week. She'd wanted to invite her abuela to her graduation recital.",
        nextStep: scam
          ? {
            prompt: "Inés hasn't replied yet. What should she do?",
            options: [
              { text: "Don't reply. Re-save Lucía's old number and call Lucía or Ana on the numbers she already had", correct: true, why: "Check with family using numbers you know are real. Scammers use 'new number' texts to set up a request for money." },
              { text: "Text back and ask what the favor is", why: "That opens the door. The next message will be an urgent request for money or gift cards." },
              { text: "Keep chatting on the new number, but don't send money", why: "Staying in touch lets the scammer build trust and learn about the family for a bigger ask later." },
            ],
          }
          : {
            prompt: "Inés is waiting. What should she do?",
            options: [
              { text: "Block the new number and report it as spam" },
              { text: "Ignore it until Lucía calls from her old number" },
              { text: "Forward the text to 7726 (SPAM)" },
            ],
          },
        tells: scam
          ? [
            "A 'new number' text from family is a common setup for a money request.",
            `"${lie}" contradicts what Inés knows about Lucía.`,
            "Nobody on a trusted number could confirm the switch.",
          ]
          : [
            "Ana confirmed the new number on a contact Inés already had saved.",
            "Every detail matched: college, her dog, Thanksgiving.",
            "No request for money, codes or secrecy.",
          ],
        tip: "When a family member texts from a new number, check with them or a relative on a number you already have before you reply.",
        source: SOURCES.familyEmergency,
      };
    },
  },

  // 9. QR sticker on a parking meter. Twin: fake sticker or the real city parking app.
  {
    id: "parking-meter-qr",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.dev, NEIGHBORS.rosa, NEIGHBORS.priya, NEIGHBORS.okafor]);
      const scam = r.chance(0.55);
      const real = "parkmaple.example";
      const meter = r.int(100, 999);
      const street = r.pick(["Main St", "Mill St", "Elm St"]);
      const rate = r.pick(["1.50", "2.00", "2.50"]);
      const paid = `$${r.int(3, 6)}.${r.pick(["00", "50"])}`;
      let url, owner;
      if (scam) {
        if (r.chance()) {
          owner = `${r.pick(["pay-meter", "citypark-pay", "meterpass"])}.example`;
          url = `https://${real}.${owner}/m/${meter}`;
        } else {
          owner = `${r.lookalike("parkmaple")}.example`;
          url = `https://${owner}/m/${meter}`;
        }
      } else {
        owner = real;
        url = r.chance() ? `https://pay.${real}/m/${meter}` : `https://${real}/m/${meter}`;
      }
      return {
        neighbor: n,
        resident: `${n.name} says: "I scanned the code on the parking meter and paid ${paid} with my card. Now I'm second-guessing it. Was that the real city site?"`,
        channel: "popup",
        from: `Page opened by the QR code on meter #${meter}`,
        body: `Maple Hollow Parking · ${street}, meter #${meter}. Enter your plate and card to start your session. $${rate}/hour + $0.35 convenience fee.`,
        history: [
          `The meters on ${street} have a QR sticker that says "Scan to pay."`,
          "Maple Hollow's parking signs say to pay with the ParkMaple app or at the kiosk.",
        ],
        directory: [
          {
            name: "City parking office",
            contact: r.phone(),
            result: scam
              ? `"All our meters use ParkMaple, at ${real}. We've had a few reports of tampered meters downtown this month."`
              : `"All our meters use ParkMaple, at ${real}. The QR stickers on ${street} are ours."`,
          },
        ],
        puzzle: {
          kind: "link",
          tool: "UNTANGLE LINK",
          prompt: "Here's the address the QR code opened. Click the part that shows who really owns the site.",
          url,
          reward: scam
            ? `The page belongs to ${owner}, not ${real}. Someone stuck a fake code over the city's.`
            : `It's ${real}, the city's real ParkMaple site. Anything before it is just part of that site.`,
        },
        scam,
        loss: r.money(400, 900, 50),
        missedCost: `${n.name} canceled ${n.his} card over a real ${paid} parking payment and spent a week without it.`,
        nextStep: scam
          ? {
            prompt: `${n.name} already typed ${n.his} card into that page. What first?`,
            options: [
              { text: "Call the card company at the number on the back of the card, report it, and watch the statement", correct: true, why: "The scammer has the card number. The card company can block it and reverse charges." },
              { text: "Go back to the page and ask for a refund", why: "That site is the scammer's. Anything typed there goes straight to them." },
              { text: "Peel the sticker off and forget about it", why: "Telling the city helps neighbors, but the card number is still stolen. Call the card company first." },
            ],
          }
          : {
            prompt: `${n.name} is worried. What should ${n.he} do?`,
            options: [
              { text: "Cancel the card right away" },
              { text: "Peel off the sticker and report the meter to the police" },
              { text: "Pay again at the kiosk to be safe" },
            ],
          },
        tells: scam
          ? [
            `The QR code opened ${owner}, not the city's ${real}.`,
            "The city has had reports of tampered meters downtown.",
            "A sticker on a meter is easy for anyone to cover with their own.",
          ]
          : [
            `The QR code opened ${real}, the city's real ParkMaple site.`,
            `The parking office confirmed the stickers on ${street} are theirs.`,
          ],
        tip: "Before paying through a QR code, read the address it opens. When in doubt, use the official parking app or the kiosk instead.",
        source: SOURCES.medQr,
      };
    },
  },
  // 10. Fake antivirus renewal + refund overpayment. Scam only.
  {
    id: "antivirus-refund",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.okafor, NEIGHBORS.ines, NEIGHBORS.dev]);
      const brand = r.pick(["SafeHarbor Antivirus", "GuardPoint Security", "TotalShield PC"]);
      const slug = brand.toLowerCase().replace(/[^a-z]/g, "");
      const charge = r.pick([349, 399, 449]);
      const over = charge * 10;
      const num = r.phone();
      const savings = r.int(1000, 9999);
      const today = r.int(3, 9);
      const rows = [
        { date: `Oct ${r.int(20, 24)}`, desc: "Maple Grocers", amount: `-${usd(r.money(40, 140, 1))}` },
        { date: `Oct ${r.int(25, 29)}`, desc: "Corner Pharmacy", amount: `-${usd(r.money(12, 60, 1))}` },
        { date: "Nov 1", desc: r.pick(["Pension deposit", "Payroll deposit", "Social Security deposit"]), amount: `+${usd(r.money(1200, 2400, 10))}` },
        { date: `Nov ${today}`, desc: `Online transfer from SAVINGS ••${savings}`, amount: `+${usd(over)}` },
      ];
      if (r.chance()) rows.splice(2, 0, { date: "Oct 30", desc: "Hollow Water Utility", amount: `-${usd(r.money(40, 90, 1))}` });
      const answer = rows.length - 1;
      return {
        neighbor: n,
        resident: `${n.name} says: "I called to cancel and let their tech connect to my computer for the refund. He sent ${usd(over)} by mistake instead of ${usd(charge)}, and it's really in my account! I'm buying gift cards to pay back the difference."`,
        channel: "email",
        from: `${brand} Billing <invoice@${slug}-billing.example>`,
        body: `Thanks for renewing ${brand} Total Protection! ${usd(charge)} will be charged to your card on file today. Didn't authorize this? Call ${num} within 24 hours to cancel.`,
        inMessageCall: "A friendly agent offers an instant refund. He just needs you to install a remote-access app and log in to your online banking.",
        history: [
          `${n.name} isn't sure what security software ${n.his} computer has. A relative set it up years ago.`,
          `While connected, the "tech" asked ${n.him} to log in to online banking "so we can see the refund land."`,
        ],
        directory: [
          {
            name: `${medCap(n.his)} card company (number on the card)`,
            contact: r.phone(),
            result: `"I don't see any ${brand} charge, pending or posted. For anything about checking or savings, call your bank."`,
          },
        ],
        puzzle: {
          kind: "audit",
          tool: "AUDIT STATEMENT",
          prompt: `The "tech" says the refund is on ${n.name}'s checking statement. Find the row that isn't what he claims.`,
          rows,
          answer,
          reward: `The "${usd(over)} refund" is a transfer from ${n.his} own savings account. The scammer moved ${n.his} money while connected. No refund ever came.`,
        },
        scam: true,
        loss: r.money(1200, 2000, 100),
        nextStep: {
          prompt: `${n.name} is at the gift card rack. What should ${n.he} do?`,
          options: [
            { text: "Stop, buy nothing. Call the bank at the number on the card, then remove the remote app and change passwords", correct: true, why: `The 'refund' was ${n.his} own money. The bank can lock accounts, and removing the app and changing passwords shuts the scammer out.` },
            { text: "Buy the cards, but only for the difference", why: "There's no difference to pay back. Any gift card number sent is gone for good." },
            { text: "Let the tech reconnect so he can reverse the mistake", why: "Reconnecting hands the scammer the keys again. That's how more money disappears." },
          ],
        },
        tells: [
          `There's no ${brand} charge on ${n.his} card at all.`,
          `The "refund" came from ${n.his} own savings account.`,
          "Remote access plus 'we refunded too much, pay us back in gift cards' is a classic refund scam.",
        ],
        tip: "Never let someone who contacted you get remote access to your computer. If a 'refund' is too big and they want the difference back, it's a scam.",
        source: SOURCES.medRefund,
      };
    },
  },

  // 11. Missed delivery by email or DM. Twin: real carrier reschedule, or a fee-collecting copy.
  {
    id: "missed-delivery-fee",
    tier: 2,
    build(r) {
      const n = r.pick([NEIGHBORS.dev, NEIGHBORS.priya, NEIGHBORS.rosa, NEIGHBORS.okafor]);
      const scam = r.chance(0.55);
      const carrier = r.pick([
        { name: "ParcelPoint", slug: "parcelpoint", prefix: "PP" },
        { name: "SwiftShip Courier", slug: "swiftship", prefix: "SS" },
      ]);
      const real = `${carrier.slug}.example`;
      const item = r.pick(["a new laptop", "a replacement phone", "a box of prescription refills", "a tile saw"]);
      const realTracking = `${carrier.prefix}${r.int(100000000, 999999999)}`;
      const tracking = scam ? `${carrier.prefix}${r.int(100000000, 999999999)}` : realTracking;
      const fee = r.pick(["$0.99", "$1.49", "$2.99"]);
      const channel = r.pick(["email", "dm"]);
      const fakeHost = r.chance() ? "redeliver-now.example" : `${r.lookalike(carrier.slug)}.example`;
      const fakeUrl = fakeHost === "redeliver-now.example"
        ? `https://${carrier.slug}.${fakeHost}/${tracking}`
        : `https://${fakeHost}/reschedule/${tracking}`;
      const page = scam
        ? { url: fakeUrl, title: "Reschedule delivery", lines: [`Package ${tracking}: held at depot`, `Redelivery fee: ${fee} (card required)`, "Enter name, address, card number and expiration"] }
        : { url: `https://${real}/reschedule/${tracking}`, title: "Reschedule delivery", lines: [`Package ${tracking}: delivery attempted today`, "Pick a new day: free", "Or sign a release so we can leave it"] };
      const typed = {
        url: `https://${real}/track`,
        title: `${carrier.name}: Track a package`,
        lines: [`Package ${realTracking}: delivery attempted today`, "We'll try again tomorrow, or pick a day: free", "Signature required"],
      };
      const pageFirst = r.chance();
      return {
        neighbor: n,
        resident: `${n.name} says: "I clicked the button and typed in my name and address to pick a new day. Should I finish?"`,
        channel,
        from: channel === "email" ? `${carrier.name} Delivery Team` : `${carrier.name} Support (verified-looking badge)`,
        body: `We tried to deliver your package (${tracking}) today, but a signature was needed and no one was home. Choose a new delivery day with the Reschedule button below.`,
        history: [
          `${n.name} is waiting on ${item} that needs a signature. ${medCap(n.he)} wasn't home today.`,
          `The store's shipping email gave tracking number ${realTracking}.`,
        ],
        directory: [
          {
            name: `${carrier.name} customer line`,
            contact: r.phone(),
            result: "Automated voice: \"For tracking and rescheduling, please visit our website. Goodbye.\"",
          },
        ],
        puzzle: {
          kind: "site",
          tool: "COMPARE SITES",
          prompt: `Compare the page the button opened with ${real}, which ${n.name} typed in. Is one of them fake?`,
          sites: pageFirst ? [page, typed] : [typed, page],
          answer: scam ? (pageFirst ? 0 : 1) : -1,
          reward: scam
            ? `The button opened a copy that charges a ${fee} "redelivery fee." ${carrier.name}'s real site reschedules for free.`
            : `Both pages are on ${real}, and both say rescheduling is free.`,
        },
        scam,
        loss: r.money(400, 900, 50),
        missedCost: `${n.name} ignored it, and ${item} went back to the sender after three tries. ${medCap(n.he)} paid to ship it again.`,
        nextStep: scam
          ? {
            prompt: `${n.name} shared ${n.his} name and address but no card. What now?`,
            options: [
              { text: `Close the page, reschedule on ${real} typed in by hand, and report the message as phishing`, correct: true, why: "Use the carrier's real site to manage the delivery. Reporting helps block the fake page." },
              { text: `Pay the ${fee} fee. It's tiny and gets the package moving`, why: "The fee is bait. The real goal is the card number, and the package isn't even held." },
              { text: "Reply to the message and ask them to cancel the fee", why: "Replying tells scammers they've found a live target. Expect more messages." },
            ],
          }
          : {
            prompt: `${n.name} is waiting. What should ${n.he} do?`,
            options: [
              { text: "Report the message as phishing and delete it" },
              { text: "Call the bank to freeze the card" },
              { text: "Close the page and never reschedule" },
            ],
          },
        tells: scam
          ? [
            `The tracking number (${tracking}) isn't the one from the store (${realTracking}).`,
            `The button opened ${fakeHost}, not ${real}.`,
            `It charged a ${fee} "redelivery fee." The real site reschedules for free.`,
          ]
          : [
            "The tracking number matches the store's shipping email.",
            `The button opened ${real}, the carrier's real site.`,
            "Rescheduling was free, and no card was needed.",
          ],
        tip: "Delivery problem? Type the carrier's site yourself and enter the tracking number from the store. Real carriers don't charge small fees through a link.",
        source: SOURCES.phishing,
      };
    },
  },
]);
