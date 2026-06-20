/* Generic input validation/coercion (spec §8). Every numeric input is coerced to
   a finite number and clamped before any math or storage; free text is trimmed and
   length-capped. No free-form text ever reaches innerHTML — the UI renders it via
   textContent. These helpers are pure and shared by both browser and tests. */

export function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

export function clamp(n, min, max) {
  if (!isFiniteNumber(n)) return min;
  if (isFiniteNumber(min) && n < min) return min;
  if (isFiniteNumber(max) && n > max) return max;
  return n;
}

/* Parse anything to a finite number, else the default. */
export function toNumber(v, def = 0) {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return def;
}

/* Non-negative money amount, rounded to whole cents. */
export function toMoney(v, def = 0) {
  const n = toNumber(v, def);
  const clamped = clamp(n, 0, Number.MAX_SAFE_INTEGER);
  return Math.round(clamped * 100) / 100;
}

/* Integer in [min, max]. */
export function toInt(v, def = 0, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = toNumber(v, def);
  return clamp(Math.round(n), min, max);
}

/* Percent value in [min, max] (default 0..100). Stored as a percent, not a
   fraction (e.g. 2.5 means 2.5%). */
export function toPct(v, def = 0, { min = 0, max = 100 } = {}) {
  const n = toNumber(v, def);
  return clamp(n, min, max);
}

/* A short, safe free-text label: coerced to string, trimmed, length-capped. */
export function toLabel(s, maxLen = 60) {
  if (s == null) return "";
  return String(s).trim().slice(0, maxLen);
}

/* True if id is one of the allowed enumerated values. */
export function isAllowed(id, allowedIds) {
  return allowedIds.includes(id);
}
