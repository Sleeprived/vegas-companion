import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isFiniteNumber,
  clamp,
  toNumber,
  toMoney,
  toInt,
  toPct,
  toLabel,
  isAllowed,
} from "../js/lib/validate.js";

test("isFiniteNumber", () => {
  assert.equal(isFiniteNumber(3), true);
  assert.equal(isFiniteNumber(NaN), false);
  assert.equal(isFiniteNumber(Infinity), false);
  assert.equal(isFiniteNumber("3"), false);
});

test("clamp bounds and rejects non-numbers", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(50, 0, 10), 10);
  assert.equal(clamp(NaN, 2, 10), 2);
});

test("toNumber parses strings and falls back", () => {
  assert.equal(toNumber("12.5"), 12.5);
  assert.equal(toNumber("  7 "), 7);
  assert.equal(toNumber("abc", 3), 3);
  assert.equal(toNumber("", 9), 9);
  assert.equal(toNumber(NaN, 1), 1);
});

test("toMoney is non-negative and cent-rounded", () => {
  assert.equal(toMoney("100"), 100);
  assert.equal(toMoney(-50), 0);
  assert.equal(toMoney(12.345), 12.35);
  assert.equal(toMoney("nope", 0), 0);
});

test("toInt rounds and clamps", () => {
  assert.equal(toInt("3.6"), 4);
  assert.equal(toInt(-2, 0, { min: 0 }), 0);
  assert.equal(toInt(99, 0, { min: 0, max: 10 }), 10);
});

test("toPct clamps to 0..100 by default", () => {
  assert.equal(toPct("20"), 20);
  assert.equal(toPct(-5), 0);
  assert.equal(toPct(150), 100);
});

test("toLabel trims, caps length, handles null", () => {
  assert.equal(toLabel("  hi  "), "hi");
  assert.equal(toLabel(null), "");
  assert.equal(toLabel("x".repeat(80)).length, 60);
  assert.equal(toLabel("ab", 1), "a");
});

test("isAllowed checks membership", () => {
  assert.equal(isAllowed("a", ["a", "b"]), true);
  assert.equal(isAllowed("z", ["a", "b"]), false);
});
