# Scam Shift

> **Shift+Verify before you trust.**

A cozy detective game about spotting impostor scams, made for [GitHub Game Off 2026](https://itch.io/jam/game-off-2026) (theme: **SHIFT**).

You run the Maple Hollow Help Desk. Neighbors forward you texts, emails and voicemails they're unsure about. Tap **SHIFT** to switch between the **Message**, the sender's **History**, and the trusted **Directory**. Verify, then decide: **Legit**, **Ignore**, or **Report**. Let a scam through and the town loses savings. Block a real message and you lose trust.

Every case is based on real scam patterns and links to official guidance (FTC, USPIS), so you leave knowing how to protect yourself and the people you care about.

## Play

- **Online:** coming soon on itch.io
- **Locally:** open `index.html` in a browser. There's no build step and nothing to install.

## Project structure

| File | What it does |
| --- | --- |
| `index.html` | Page layout and screens |
| `style.css` | 8-bit look (PICO-8-inspired palette) |
| `cases.js` | All shifts, cases, and sources. Add content here |
| `game.js` | Game logic: views, calls, scoring, debriefs |

## Roadmap

- [x] Shift 1: five cases (bank phishing, family emergency, delivery smishing, plus legit look-alikes)
- [ ] Shifts 2–3: new scam types (government impostor, tech support, job/romance, "move your money to protect it")
- [ ] Sound effects and music
- [ ] Expert replay with subtler tells
- [ ] Stretch: misinformation shift

## Credits

- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [VT323](https://fonts.google.com/specimen/VT323), SIL Open Font License
- Palette inspired by PICO-8
- Scam guidance: [FTC Consumer Advice](https://consumer.ftc.gov/), [U.S. Postal Inspection Service](https://www.uspis.gov/)

## AI disclosure

Developed with help from GitHub Copilot for code, brainstorming, and checking case content against official FTC and USPIS guidance. All case content is reviewed against the cited sources. No AI-generated art or audio is used, and the game makes no AI calls at runtime.

## License

[MIT](LICENSE)
