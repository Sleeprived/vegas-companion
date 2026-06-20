# Changelog

## 2026-06-16 — fixes from vegas-companion-build-audit.md
### Fixed
- Offline navigation: the service worker now resolves a directory URL (e.g.
  `/comp/`) to its precached `index.html`, so opening a tool offline for the
  first time loads that tool instead of falling back to the hub (M1).
- Comp estimator: the editable house-edge is now clamped to 0–100% and the
  reinvestment rate capped at 0–100%, so out-of-range typed values can't produce
  nonsense estimates (m1, m2).
- Bankroll: history timestamps guard against a non-finite value, avoiding an
  "Invalid Date" row if stored data is ever malformed (m6).
### Notes
- Ratified (kept as built): the extra tipping scenarios (bellhop, restaurant),
  the craps average edge of 1.5% (keeps optimal ≤ average), and "bankroll
  remaining = budget + net" (shows above budget when you're up).

## 2026-06-16 — vegas-companion.md (initial build)

### Added
- **Offline installable PWA** (hub + four tools), vanilla HTML/CSS/JS, no framework,
  no build step. Versioned service worker (`vegas-v1`) caches the full app shell for
  offline use; web manifest + generated die icons for "Add to Home Screen".
- **Hub** with four tiles and a "Clear all saved data" control.
- **Bankroll Tracker:** trip budget; optional daily-loss limit, per-session stop-loss
  and win goal; live sessions (buy-in, game/where, live stack updates) with a real-time
  walk-away alert on hitting stop-loss/win-goal; quick-log for finished sessions; trip
  summary (bankroll remaining, net so far, today's net vs daily limit, W/L record);
  per-session and full-data clearing. Saved on-device in localStorage.
- **Tipping Calculator:** per-situation suggestions (cocktail server, dealer toke,
  valet, housekeeping, bellhop) and percentage situations (bottle service, spa,
  restaurant); a customary-norms reference card; and a split-the-bill calculator
  (bill + tip % across N people).
- **Strip Walk Times:** ~25 curated Strip landmarks with approximate walk time and
  distance from a position-based model, a walk/tram/rideshare verdict, free resort-tram
  detection (Aria Express, Mirage–TI, Mandalay Bay), a paid-Monorail note, and a clear
  "approximate, no live routing" disclaimer.
- **Comp Estimator:** theoretical-loss and comp-value estimates from average bet, game,
  and hours; per-game documented house edges (Average/Optimal) and decisions-per-hour;
  an editable edge and configurable comp reinvestment rate (default 33%); explainer that
  comps are rated on average play.
- **Privacy:** no network calls of any kind; all data stays in localStorage on the
  device; defensive storage that degrades gracefully if blocked.
- **Responsible-gambling disclaimer** on every screen with the National Problem Gambling
  Helpline (1-800-522-4700).
- **Tests:** 56 `node --test` cases covering comp math, bankroll arithmetic and
  thresholds, tipping math, the walk-time matrix (symmetry/completeness/sanity), input
  validation, and money formatting.
