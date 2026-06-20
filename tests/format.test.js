import { test } from "node:test";
import assert from "node:assert/strict";
import { usd, signedUsd, num } from "../js/lib/format.js";

test("usd formats with commas and two decimals", () => {
  assert.equal(usd(0), "$0.00");
  assert.equal(usd(5), "$5.00");
  assert.equal(usd(1234.5), "$1,234.50");
  assert.equal(usd(1000000), "$1,000,000.00");
});

test("usd handles negatives", () => {
  assert.equal(usd(-80), "-$80.00");
  assert.equal(usd(-1234.56), "-$1,234.56");
});

test("usd rounds cents correctly (no 99.999 -> .100 bug)", () => {
  assert.equal(usd(0.1 + 0.2), "$0.30");
  assert.equal(usd(99.999), "$100.00");
  assert.equal(usd(1.256), "$1.26"); // rounds up
  assert.equal(usd(1.254), "$1.25"); // rounds down
});

test("usd guards non-finite", () => {
  assert.equal(usd(NaN), "$0.00");
  assert.equal(usd(Infinity), "$0.00");
});

test("signedUsd shows an explicit + for gains, - for losses, none for zero", () => {
  assert.equal(signedUsd(50), "+$50.00");
  assert.equal(signedUsd(-50), "-$50.00");
  assert.equal(signedUsd(0), "$0.00");
});

test("num trims trailing zeros to dp", () => {
  assert.equal(num(1.5), "1.5");
  assert.equal(num(2.0), "2");
  assert.equal(num(0.7, 1), "0.7");
});
