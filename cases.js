// All game content lives here, separate from the game logic in game.js.
// To add a case, copy one object below and edit it. Every case must cite a real source.
//
// Case fields:
//   resident      who forwarded the message to the help desk, and what they ask
//   channel       "text" | "email" | "voicemail" | "dm"
//   from          sender as shown to the resident
//   body          the message itself
//   inMessageCall optional: what happens if you call the number IN the message (a trap for scams)
//   history       what we know about past contact with this sender / situation
//   directory     trusted contacts; each has a `result` revealed when you call it
//   scam          true if it's a scam
//   loss          savings lost if a scam is marked LEGIT
//   missedCost    what goes wrong if a legit message is ignored/reported
//   tells         clues that reveal the truth (shown in the debrief)
//   tip           one real-life takeaway
//   source        { label, url } of the real-world guidance

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
};

const SHIFTS = [
  {
    title: "SHIFT 1: MONDAY",
    intro:
      "Welcome to your first day at the Maple Hollow Help Desk! Folks in town " +
      "will forward you messages they're unsure about. Some are real. Some are " +
      "impostors. Check the History, call trusted numbers from the Directory, " +
      "and make the call. The town is counting on you.",
    cases: [
      {
        resident: "Mr. Okafor (retired teacher) asks: \"Is this text real? I don't want to fall for anything.\"",
        channel: "text",
        from: "555-0142",
        body: "Maple Hollow Pharmacy: Your prescription is ready for pickup at the Elm St counter. Reply STOP to opt out.",
        history: [
          "Mr. Okafor gets a refill reminder from 555-0142 about once a month.",
          "He called in a refill to the pharmacy last Friday.",
        ],
        directory: [
          { name: "Maple Hollow Pharmacy", contact: "555-0142", result: "\"Yes, Mr. Okafor's refill is ready. See you soon!\"" },
        ],
        scam: false,
        missedCost: "Mr. Okafor skipped picking up his medication for a week.",
        tells: [
          "The number matches the pharmacy in your trusted Directory.",
          "It matches what he expected: he requested a refill.",
          "No link, no payment, no request for personal info, no pressure.",
        ],
        tip: "Real messages usually match contact info you already have and don't rush you. When unsure, contact the business using a number you know is real.",
        source: SOURCES.phishing,
      },
      {
        resident: "Rosa (owner of Rosa's Bakery) asks: \"My bank says my account will be locked! Should I call?\"",
        channel: "text",
        from: "88472",
        body: "PINECREST BANK ALERT: Suspicious login detected on your account. Your account will be LOCKED in 30 minutes. Call 1-888-555-0199 now to verify your identity.",
        inMessageCall:
          "A very friendly \"agent\" answers. He asks Rosa for her online banking password and \"the 6-digit code we just texted you, to cancel the lock.\"",
        history: [
          "Pinecrest Bank texts Rosa from short code 72166, never 88472.",
          "Past bank texts never asked her to call a number. They said \"log in to the app\".",
        ],
        directory: [
          { name: "Pinecrest Bank (number on back of card)", contact: "555-0110", result: "\"We see no alerts or locks on Rosa's account. That text did not come from us.\"" },
        ],
        scam: true,
        loss: 4200,
        tells: [
          "Urgent threat: \"LOCKED in 30 minutes\" is designed to make you panic.",
          "Unknown sender: different from the bank's usual short code.",
          "It pushes you to call the number IN the message, not the bank's real number.",
          "Asking for a password or one-time code is a huge red flag. Real banks don't.",
        ],
        tip: "If a message says there's a problem with your account, contact the company using the number on your card or its official website, never the one in the message.",
        source: SOURCES.phishing,
      },
      {
        resident: "Priya (college student) asks: \"I got a link from the library. Safe to click?\"",
        channel: "email",
        from: "holds@maplehollowlibrary.org",
        body: "Hi Priya! Your hold \"Intro to Game Design\" is ready. Pick it up within 7 days or manage your holds at maplehollowlibrary.org/account. Happy reading!",
        history: [
          "Priya placed a hold on \"Intro to Game Design\" on Oct 28.",
          "She's received hold notices from holds@maplehollowlibrary.org before.",
        ],
        directory: [
          { name: "Maple Hollow Library", contact: "555-0123 · maplehollowlibrary.org", result: "\"Yep, her book is on the hold shelf!\"" },
        ],
        scam: false,
        missedCost: "Priya's hold expired and the book went to the next person on the waitlist.",
        tells: [
          "She expected this: she placed the hold herself.",
          "The sender and the link both use the library's real domain from the Directory.",
          "No payment, no password request, no threat.",
        ],
        tip: "Not every link is a trap. Check that the message is expected and the web address exactly matches the organization's real site. If anything's off, type the site address yourself.",
        source: SOURCES.phishing,
      },
      {
        resident: "Grandma Inés asks: \"My grandson left this voicemail! I need to help him, right?\"",
        channel: "voicemail",
        from: "Unknown number (555-0911)",
        body:
          "\"Abuela? It's me... I'm in trouble. I crashed the car and I'm at the police station. " +
          "Please don't tell Mom, she'll be so mad. My lawyer, Mr. Grant, is going to call you. " +
          "He says bail is $3,000 and gift cards are the fastest way. Please hurry!\"",
        inMessageCall:
          "\"Mr. Grant\" answers right away. He tells Grandma Inés to buy $3,000 in gift cards at the pharmacy and read him the numbers on the back. \"And remember, don't tell anyone, for your grandson's sake.\"",
        history: [
          "Her grandson Mateo usually calls from 555-0177.",
          "Mateo texted her yesterday: \"see you sunday abuela!!\"",
        ],
        directory: [
          { name: "Mateo (grandson)", contact: "555-0177", result: "\"Abuela? I'm at soccer practice! I'm totally fine. That wasn't me!\"" },
          { name: "Lucía (Mateo's mom)", contact: "555-0178", result: "\"Mateo's at practice, I just dropped him off. That's a scam, Mamá!\"" },
        ],
        scam: true,
        loss: 3000,
        tells: [
          "An emergency + \"don't tell anyone\" is the classic family-emergency scam setup.",
          "Payment by gift card. No real lawyer, court or police department asks for that.",
          "Unknown number, not Mateo's usual one.",
          "Scammers can fake or clone a loved one's voice, so a familiar voice isn't proof.",
        ],
        tip: "If a \"loved one\" calls in an emergency, hang up and call them (or another family member) at a number you know. Anyone demanding gift cards is a scammer.",
        source: SOURCES.familyEmergency,
      },
      {
        resident: "Dev (runs the hardware store) asks: \"I AM waiting on a package. Should I pay this?\"",
        channel: "text",
        from: "+1 (302) 555-0186",
        body: "USPS: Your package is on hold due to an incomplete address. Please pay the $1.99 redelivery fee within 24h to avoid return: usps-redeliver-help.co/track",
        inMessageCall: "There's no number to call, only the link. The page asks for Dev's full card number, expiration date and security code.",
        history: [
          "Dev ordered shelf brackets online last week, and they ship via USPS.",
          "He never signed up for USPS text alerts with a tracking number.",
        ],
        directory: [
          { name: "USPS tracking (official site)", contact: "usps.com", result: "Dev types usps.com himself and enters his tracking number: \"Out for delivery today.\" No fees, no address problem." },
        ],
        scam: true,
        loss: 850,
        tells: [
          "The link is NOT usps.com. \"usps-redeliver-help.co\" just looks official.",
          "USPS doesn't text you unless you signed up with a tracking number, and those texts contain no links.",
          "A tiny fee is bait to steal your full card details.",
          "Scammers time these to match real life: lots of people really are expecting packages.",
        ],
        tip: "Don't click links in unexpected delivery texts. Go to the carrier's real website yourself and enter your tracking number. Forward spam texts to 7726 (SPAM).",
        source: SOURCES.uspsSmishing,
      },
    ],
  },
];
