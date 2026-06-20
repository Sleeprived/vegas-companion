/* USD money + number formatting (spec: USD only). Pure, deterministic, shared by
   browser and tests. */

import { isFiniteNumber } from "./validate.js";

/* "$1,234.56" — always two decimals, comma thousands. Negative as -$1,234.56. */
export function usd(n) {
  if (!isFiniteNumber(n)) n = 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  // guard against 99.999 -> cents 100
  const fixedWhole = cents === 100 ? whole + 1 : whole;
  const fixedCents = cents === 100 ? 0 : cents;
  const withCommas = String(fixedWhole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${withCommas}.${String(fixedCents).padStart(2, "0")}`;
}

/* "+$120.00" / "-$80.00" — explicit sign, for net figures. Zero shows no sign. */
export function signedUsd(n) {
  if (!isFiniteNumber(n)) n = 0;
  if (n > 0) return `+${usd(n)}`;
  return usd(n); // usd() already prefixes the minus for negatives
}

/* Plain number with up to `dp` decimals, trailing zeros trimmed. */
export function num(n, dp = 1) {
  if (!isFiniteNumber(n)) n = 0;
  return String(Math.round(n * 10 ** dp) / 10 ** dp);
}
