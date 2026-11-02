# Scam Shift

> **Shift+Verify before you trust.**

A cozy detective game about spotting impostor scams, made for [GitHub Game Off 2026](https://itch.io/jam/game-off-2026) (theme: **SHIFT**).

You run the Maple Hollow Help Desk. Neighbors forward you texts, emails and voicemails they're unsure about. Tap **SHIFT** to switch between the **Message**, the sender's **History** and the trusted **Directory**. Investigate, then decide: **Legit** or **Scam**. If it's a scam, pick the **safest next step** based on what the neighbor already did.

Work the desk for one week, Monday to Friday, with five cases a day. Every run is different: each day draws randomized cases from a pool of templates by difficulty, with new names, numbers, amounts and links, so memorizing answers won't help. Some cases are legit look-alikes ("twins") of common scams.

The clock is real. Each day has its own countdown (3:30 on Monday, up to 5:00 on Friday). Verifying a contact or contacting the sender costs 30 seconds, and not everyone picks up. 🔍 mini-games reveal extra clues:

- **Link untangler:** click the part of a URL that shows who really owns the site.
- **Spot the difference:** compare a number or address against the one on file.
- **Phone tree:** call the official number and navigate its keypad menu.
- **Statement audit:** find the line that doesn't belong on a bank or card statement.
- **Story check:** find the line in a caller's story that contradicts what's on file.
- **Shredded letter:** rebuild a torn letter strip by strip.
- **Spot the fake site:** compare two websites side by side.

Wrong moves cost time. On easy cases the mini-games are optional; on hard cases they hold the **KEY EVIDENCE**. When time runs out, the desk closes and everyone still waiting decides alone. Sometimes they get lucky; sometimes they don't.

Every case is based on real scam patterns and links to official guidance (FTC, USPIS), so you leave knowing how to protect yourself and the people you care about.

**Scoring**

| Event | Points |
| --- | --- |
| Correct Legit/Scam call | +100 |
| Wrong call, or a neighbor guessing wrong after time runs out | −100 |
| Safest next step after a correct Scam call | +50 / wrong step −50 |
| Finishing a day early | +1 per second left |

Reading a debrief or the end-of-day results pauses the clock. Missed scams also drain the town's **Savings**, which start at $5,000; losses grow each day. If Savings hit $0, the town council shuts down the Help Desk: **game over**. **QUIT** ends a run early. Score and Savings carry over between days. When the run ends (week finished, game over or quit), the Maple Hollow Gazette reports the result and you can save your initials to the local top-10 leaderboard, which is stored only in your browser and tags runs that went broke or quit. Restarting or reloading starts a new run.

Music starts when you start the game. Distinct sounds mark correct and incorrect decisions, including puzzle answers and neighbors' decisions after time runs out. The **SOUND** button mutes both music and effects, including during debriefs and time-out results, and remembers your preference in your browser when storage is available.

After a run ends, choose **PLAY AGAIN** for a fresh week or **MAIN MENU** to return to the title screen and leaderboard.

Maple Hollow's phone numbers and `.example` websites are fictional. In real life, use contact information you have independently verified.

## Play

- **Online:** [Play Scam Shift](https://sviera91.github.io/scam-shift/) on GitHub Pages.
- **Locally:** open `index.html` in a browser. There's no build step and nothing to install.

## Project structure

| File | What it does |
| --- | --- |
| `index.html` | Page layout and screens |
| `style.css` | 8-bit look (PICO-8-inspired palette) |
| `cases/core.js` | Case schema, neighbors, days, sources and the run randomizer |
| `cases/starter.js`, `cases/medium.js`, `cases/hard.js` | Case templates by difficulty tier. Add content here |
| `tools/check-cases.js` | Validates every case template: `node tools/check-cases.js` |
| `game.js` | Game logic: views, calls, scoring, debriefs |
| `audio.js` | Music, sound effects, and the sound setting |
| `assets/neighbors.png` | Pixel portraits and expressions for the neighbors |
| `assets/audio/` | Local music and sound effects |

Each case template is a function that builds a case from a seeded random generator. The schema is documented at the top of `cases/core.js`. Run `node tools/check-cases.js` after editing cases. To replay the same run, add `?seed=123` to the URL.

Each case references a neighbor defined in `cases/core.js`. To add a new portrait, add a column to the sprite sheet and update the `.portrait` background size and neighbor positions in `style.css`. Keep the four rows in order: worried, relieved, happy, and blinking.

## Releases and contributions

See [CHANGELOG.md](CHANGELOG.md) for release history. GitHub Pages publishes the root of `main` automatically.

All files are owned by [@sviera91](https://github.com/sviera91) through [CODEOWNERS](.github/CODEOWNERS). Changes to `main` require a pull request and codeowner approval. Repository administrators have a pull-request-only bypass so the solo maintainer can merge their own work without self-approval, which GitHub does not support. Direct pushes, force pushes and branch deletion are blocked.

## Roadmap

- [x] Shift 1: five cases (bank phishing, family emergency, delivery smishing, plus legit look-alikes)
- [x] Help-desk scene with neighbor portraits and reactions
- [x] Shifts 2–3: government impostors, tech support, jobs, romance investments, and "move your money to protect it"
- [x] Sound effects and music
- [x] Real-time shift timer, scoring, safest-next-step choices, inspection puzzles and local leaderboard
- [x] Five-day week of randomized cases, mini-games, quitting and game over
- [ ] Expert replay with subtler tells
- [ ] Stretch: misinformation shift

## Credits

- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [VT323](https://fonts.google.com/specimen/VT323), SIL Open Font License
- Palette inspired by PICO-8
- Neighbor portraits adapted and recolored from [32 × 32 Portraits](https://opengameart.org/content/32-x-32-portraits) by Seafood5040, CC0
- Music: "Asteroids" by Holizna, from [Chill Chiptunes](https://opengameart.org/content/chill-chiptunes-collection), CC0; re-encoded for the game
- Sound effects: [Interface Sounds](https://opengameart.org/content/interface-sounds) by Kenney, CC0; converted to MP3 for browser support
- Scam guidance: [FTC Consumer Advice](https://consumer.ftc.gov/), [U.S. Postal Inspection Service](https://www.uspis.gov/)

## AI disclosure

Developed with help from GitHub Copilot for code, brainstorming, and checking case content against official FTC and USPIS guidance. Copilot also assisted with the CSS scenery and code used to recolor and adapt the portrait expressions. No image-generation model or generative audio was used, and the game makes no AI calls at runtime. All case content is reviewed against the cited sources.

## License

[MIT](LICENSE)
