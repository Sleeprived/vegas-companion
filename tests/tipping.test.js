import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLAT_SCENARIOS,
  PERCENT_SCENARIOS,
  flatScenarioById,
  percentScenarioById,
  flatTip,
  percentTip,
  splitBill,
} from "../js/lib/tipping.js";

test("flatTip multiplies per-unit by a whole count", () => {
  assert.equal(flatTip(2, 5), 10); // $2/drink x 5 drinks
  assert.equal(flatTip(4, 3), 12); // $4/night x 3 nights
  assert.equal(flatTip(3, 0), 0);
});

test("flatTip floors fractional counts and ignores negatives", () => {
  assert.equal(flatTip(2, 3.9), 8); // count rounds (toInt) -> 4? check rounding
  assert.equal(flatTip(5, -2), 0);
  assert.equal(flatTip(-5, 3), 0);
});

test("percentTip computes a percent of the bill", () => {
  assert.equal(percentTip(100, 20), 20);
  assert.equal(percentTip(50, 18), 9);
  assert.equal(percentTip(0, 20), 0);
});

test("splitBill returns tip, total, and per-person share", () => {
  const r = splitBill(200, 20, 4); // tip 40, total 240, /4 = 60
  assert.equal(r.tip, 40);
  assert.equal(r.total, 240);
  assert.equal(r.perPerson, 60);
  assert.equal(r.people, 4);
});

test("splitBill clamps people to at least 1 (no divide-by-zero)", () => {
  const r = splitBill(100, 20, 0);
  assert.equal(r.people, 1);
  assert.equal(r.perPerson, 120);
  assert.ok(Number.isFinite(r.perPerson));
});

test("splitBill rounds per-person to cents", () => {
  const r = splitBill(100, 20, 3); // total 120 / 3 = 40 exactly
  assert.equal(r.perPerson, 40);
  const r2 = splitBill(100, 15, 3); // total 115 / 3 = 38.333... -> 38.33
  assert.equal(r2.perPerson, 38.33);
});

test("garbage inputs never produce NaN", () => {
  assert.equal(percentTip("abc", "xyz"), 0);
  const r = splitBill("nope", null, undefined);
  assert.ok(Number.isFinite(r.perPerson));
});

test("scenario data is well-formed", () => {
  assert.ok(FLAT_SCENARIOS.length >= 4);
  assert.ok(PERCENT_SCENARIOS.length >= 2);
  for (const s of FLAT_SCENARIOS) {
    assert.ok(s.id && s.name && s.unitLabel);
    assert.ok(s.perUnit > 0);
    assert.ok(s.range[0] <= s.range[1]);
  }
  for (const s of PERCENT_SCENARIOS) {
    assert.ok(s.id && s.name);
    assert.ok(s.defaultPct > 0 && s.defaultPct <= 100);
  }
});

test("lookups by id work and reject unknowns", () => {
  assert.equal(flatScenarioById("cocktail").perUnit, 2);
  assert.equal(percentScenarioById("bottle").defaultPct, 20);
  assert.equal(flatScenarioById("nope"), null);
  assert.equal(percentScenarioById("nope"), null);
});
