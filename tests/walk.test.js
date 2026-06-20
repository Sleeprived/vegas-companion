import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LANDMARKS,
  LANDMARK_IDS,
  TRAM_LINES,
  landmarkById,
  sharedTram,
  walkBetween,
} from "../js/lib/walk.js";

test("there are ~20-30 landmarks with unique ids", () => {
  assert.ok(LANDMARKS.length >= 20 && LANDMARKS.length <= 30, `got ${LANDMARKS.length}`);
  assert.equal(new Set(LANDMARK_IDS).size, LANDMARKS.length, "duplicate ids");
});

test("landmark positions increase south->north (sorted, no exact ties of name)", () => {
  for (let i = 1; i < LANDMARKS.length; i++) {
    assert.ok(LANDMARKS[i].mile >= LANDMARKS[i - 1].mile, `out of order at ${LANDMARKS[i].id}`);
  }
});

test("matrix is complete and symmetric for every pair", () => {
  for (const a of LANDMARK_IDS) {
    for (const b of LANDMARK_IDS) {
      const ab = walkBetween(a, b);
      const ba = walkBetween(b, a);
      assert.ok(ab && ba, `missing ${a}-${b}`);
      assert.equal(ab.minutes, ba.minutes, `asymmetric ${a}-${b}`);
      assert.equal(ab.miles, ba.miles, `asymmetric miles ${a}-${b}`);
    }
  }
});

test("all times are finite and within a sane range", () => {
  for (const a of LANDMARK_IDS) {
    for (const b of LANDMARK_IDS) {
      const r = walkBetween(a, b);
      assert.ok(Number.isFinite(r.minutes) && r.minutes >= 0 && r.minutes <= 150, `${a}-${b} = ${r.minutes}`);
      assert.ok(Number.isFinite(r.miles) && r.miles >= 0, `${a}-${b} miles`);
    }
  }
});

test("same origin and destination is zero", () => {
  const r = walkBetween("bellagio", "bellagio");
  assert.equal(r.minutes, 0);
  assert.equal(r.miles, 0);
  assert.equal(r.verdict, "same");
});

test("Bellagio -> Venetian is in the expected ballpark (~18 min)", () => {
  const r = walkBetween("bellagio", "venetian");
  assert.ok(r.minutes >= 15 && r.minutes <= 22, `got ${r.minutes}`);
});

test("farther is longer (monotonic from a fixed origin)", () => {
  const near = walkBetween("mgm", "bellagio").minutes;
  const far = walkBetween("mgm", "strat").minutes;
  assert.ok(far > near);
});

test("verdicts: adjacent = walk, end-to-end = ride", () => {
  assert.equal(walkBetween("excalibur", "tropicana").verdict, "walk");
  assert.equal(walkBetween("mandalay", "strat").verdict, "ride");
});

test("free tram detection", () => {
  assert.ok(sharedTram("bellagio", "parkmgm")); // Aria Express
  assert.ok(sharedTram("mirage", "ti")); // Mirage-TI
  assert.equal(sharedTram("mgm", "bellagio"), null);
  const r = walkBetween("bellagio", "parkmgm");
  assert.equal(r.sameTram, true);
  assert.ok(r.tram && r.tram.free === true);
});

test("tram lines reference only real landmark ids", () => {
  for (const line of TRAM_LINES) {
    assert.ok(line.stops.length >= 2);
    for (const id of line.stops) {
      assert.ok(landmarkById(id), `tram ${line.id} references unknown ${id}`);
    }
  }
});

test("unknown ids return null", () => {
  assert.equal(walkBetween("nope", "bellagio"), null);
  assert.equal(walkBetween("bellagio", "nope"), null);
  assert.equal(landmarkById("nope"), null);
});
