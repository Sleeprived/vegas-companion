# Vegas Companion

A phone-friendly, **offline** web app for a Las Vegas trip. Four small tools in one:

- **Bankroll Tracker** — set a trip budget, track gambling sessions live (with a
  stop-loss / win-goal "walk away" alert), or quick-log finished ones.
- **Tipping Calculator** — Vegas tipping norms by situation, plus a split-the-bill calc.
- **Strip Walk Times** — approximate walk times between major Strip landmarks, with a
  "walk / tram / rideshare" gut-check and the free-tram connections.
- **Comp Estimator** — estimate your theoretical loss and the comp value you've likely
  earned from your average bet, game, and hours.

Built as a static Progressive Web App (PWA): plain HTML/CSS/JavaScript, no servers,
no accounts, no internet required once loaded. **Nothing you enter ever leaves your
device.** This is a money-management and convenience tool — it does **not** change the
odds or beat the house.

---

## 1. Quick start

**Just use it (no setup):** open **https://sleeprived.github.io/vegas-companion/** in any
browser. On a phone, use **Add to Home Screen** to install it like an app; after the first
load it works fully offline.

**Run it locally instead (for development):** serve the folder over a tiny local web server
and open the address it gives you. The simplest one, if you have Python:

```
python -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

(Opening `index.html` directly as a `file://` path shows a blank page — browsers refuse
to load JavaScript modules and the offline service worker that way. Use the server.)

**Run the tests (optional):** with Node.js 18+ installed, from the project folder:

```
node --test
```

You should see `pass 56  fail 0`.

---

## 2. The four tools

### Bankroll Tracker
Set your **trip budget** and optional **limits** (daily loss limit, per-session
stop-loss, per-session win goal). Then either:

- **Start a live session** — enter the game, where, and your buy-in. While you play,
  update your current chips/cash; the app shows your session net and turns the banner
  into a **walk-away alert** the moment you hit your stop-loss or win goal. Close it to
  record your cash-out.
- **Quick-log** a finished session — just buy-in and cash-out.

The summary shows your **bankroll remaining** (budget ± net), today's net against your
daily limit, and your win/loss record. Everything is saved on your device and can be
cleared any time.

### Tipping Calculator
Pick a situation (cocktail server, dealer toke, valet, housekeeping, bellhop, bottle
service, spa, restaurant) and get a suggested amount — flat per-item for most, a
percentage of the bill for the rest. A reference card lists the customary ranges, and a
split-the-bill calculator divides a tab + tip across people.

### Strip Walk Times
Pick a **from** and **to** from ~25 major Strip landmarks for an **approximate** walk
time and distance, plus a verdict: walk it, your call, or take a tram/rideshare. When a
**free resort tram** connects the two spots, it tells you. These are straight-line Strip
estimates at a slow tourist pace — **not** live routing. They don't know about
construction, closures, or weather. Use them as a gut-check only.

### Comp Estimator
Enter your **average bet**, **game**, and **hours**. The app estimates your
**theoretical loss** (average bet × decisions-per-hour × hours × house edge) and the
**comp value** you've likely earned (theoretical loss at the average rating edge ×
reinvestment rate, default 33%). A play-style toggle (Average / Optimal) and an editable
edge let you see how good play lowers *your* loss — while comps stay based on average
play, which is how casinos actually rate you. A rough ballpark, not a guarantee; real
formulas vary by property.

---

## 3. Privacy & data

- **No network calls.** The app never contacts a server. There is nothing to log in to.
- **On-device only.** Your budget, limits, and sessions are stored in your browser's
  `localStorage`. They never leave your phone. Clearing site data, using private mode, or
  switching browsers/devices starts fresh.
- **Clear any time** from the hub ("Clear all saved data") or the Bankroll screen.
- The app keeps working even if storage is blocked (it just won't remember between
  visits).

---

## 4. Project layout

```
index.html              Hub (registers the service worker)
manifest.webmanifest    PWA metadata
sw.js                   Service worker (versioned offline cache)
css/                    theme.css (single dark theme) + base.css
js/lib/                 Pure, DOM-free logic — imported by both browser AND tests
js/ui/                  One module per page (DOM wiring)
js/                     Shared shell: storage.js, disclaimer.js, hub.js
<tool>/index.html       One page per tool (bankroll, tipping, walk, comp)
tests/                  node --test suite (mirrors js/lib)
icons/, tools/          App icons + the dev-only generator
```

### How correctness is checked
The pure logic in `js/lib/` is covered by `node --test` (56 tests): the comp formula and
per-game outputs (hand-checked), bankroll arithmetic and walk-away thresholds, tipping
math, the walk-time matrix's symmetry/completeness/sanity, and input validation/money
formatting. The UI itself is verified by hand on a device.

---

## 5. Requirements & deploying

- **To use:** any modern browser (Chrome, Edge, Firefox, Safari). For install + offline
  it must be served over `http://` or `https://` (a local server or GitHub Pages), not
  `file://`.
- **To develop/test:** Node.js 18+ (built-in `node:test`, no npm dependencies). Python 3
  only to regenerate icons (`python tools/make-icons.py`).
- **Deploying (GitHub Pages):** this is a static site. Push the folder to a public GitHub
  repo and enable Pages on the default branch. The `.nojekyll` file is included so the
  `js/` folder is served as-is. No build step. After a redeploy, bump `CACHE_VERSION` in
  `sw.js` so installed users pick up the update.

---

## 6. Disclaimer

Gambling tools like this help you **manage and understand** your play; they do not give
you an edge. Every casino game favors the house over time. Gamble responsibly, only with
money you can afford to lose. Problem gambling? Call the National Problem Gambling
Helpline: **1-800-522-4700** (call or text, 24/7).
