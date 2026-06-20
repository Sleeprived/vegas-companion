/* Vegas tipping (spec §6). Pure, DOM-free, shared by UI and tests.

   Two scenario shapes:
     - FLAT scenarios: a per-unit dollar amount x a count (drinks, nights, cars...).
     - PERCENT scenarios: a percentage of a bill (bottle service, spa).
   Plus a generic bill/percent/split calculator.

   Amounts are customary U.S. tipping norms, not rules. Ranges are shown so you can
   adjust. Bottle service / spa often add an automatic gratuity — check the bill. */

import { toMoney, toInt, toPct, clamp } from "./validate.js";

export const FLAT_SCENARIOS = [
  { id: "cocktail", name: "Cocktail server", perUnit: 2, unitLabel: "drink", range: [1, 2], note: "$1–2 per drink, even free ones. Tip early and they find you faster." },
  { id: "dealer", name: "Table dealer (toke)", perUnit: 5, unitLabel: "color-up", range: [5, 25], note: "No fixed rule. Many tip ~$5 when coloring up, or place a small bet for the dealer on a good run." },
  { id: "valet", name: "Valet", perUnit: 3, unitLabel: "car", range: [2, 5], note: "$2–5 on return; tip more in bad weather or for a quick turnaround." },
  { id: "housekeeping", name: "Housekeeping", perUnit: 4, unitLabel: "night", range: [3, 5], note: "$3–5 per night, left daily (staff rotate) with a note so it reads as a tip." },
  { id: "bellhop", name: "Bellhop / luggage", perUnit: 3, unitLabel: "bag", range: [2, 5], note: "$2–5 per bag, a little more for heavy or many." },
];

export const PERCENT_SCENARIOS = [
  { id: "bottle", name: "Bottle service", defaultPct: 20, range: [18, 20], note: "18–20% of the tab. A gratuity is often AUTO-added — check before adding more." },
  { id: "spa", name: "Spa / salon", defaultPct: 20, range: [18, 20], note: "18–20% of the service price, unless already included." },
  { id: "restaurant", name: "Sit-down restaurant", defaultPct: 20, range: [18, 22], note: "18–22%. Larger parties may have gratuity added automatically." },
];

export const FLAT_IDS = FLAT_SCENARIOS.map((s) => s.id);
export const PERCENT_IDS = PERCENT_SCENARIOS.map((s) => s.id);

export function flatScenarioById(id) {
  return FLAT_SCENARIOS.find((s) => s.id === id) || null;
}
export function percentScenarioById(id) {
  return PERCENT_SCENARIOS.find((s) => s.id === id) || null;
}

/* perUnit dollars x whole count. */
export function flatTip(perUnit, count) {
  return toMoney(perUnit) * toInt(count, 0, { min: 0, max: 100000 });
}

/* percentage of a bill. */
export function percentTip(bill, pct) {
  return toMoney(bill) * (toPct(pct, 0, { min: 0, max: 100 }) / 100);
}

/* bill + percent split across people: returns tip, grand total, and per-person share. */
export function splitBill(bill, pct, people) {
  const b = toMoney(bill);
  const tip = percentTip(b, pct);
  const total = b + tip;
  const n = clamp(toInt(people, 1, { min: 1, max: 1000 }), 1, 1000);
  return {
    tip: Math.round(tip * 100) / 100,
    total: Math.round(total * 100) / 100,
    perPerson: Math.round((total / n) * 100) / 100,
    people: n,
  };
}
