import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GAMES,
  GAME_IDS,
  gameById,
  edgeForBasis,
  theoreticalLoss,
  estimate,
  COMP_RATE_DEFAULT_PCT,
} from "../js/lib/comp.js";

test("theoreticalLoss matches the hand formula", () => {
  // $25 avg bet, 70 hands/hr, 4 hrs, 2% edge = 25 * 70 * 4 * 0.02 = $140
  assert.equal(theoreticalLoss({ avgBet: 25, decisionsPerHour: 70, hours: 4, edgePct: 2 }), 140);
});

test("estimate: blackjack at average play (hand-checked)", () => {
  const r = estimate({ gameId: "blackjack", avgBet: 25, hours: 4, basis: "average" });
  assert.equal(r.theoLoss, 140);
  assert.equal(r.theoLossAvg, 140);
  // comps default 33% of theo (at average edge): 140 * 0.33 = 46.2
  assert.ok(Math.abs(r.compValue - 46.2) < 1e-9);
  assert.equal(r.compRatePct, COMP_RATE_DEFAULT_PCT);
});

test("optimal play lowers YOUR loss but not your comps", () => {
  const avg = estimate({ gameId: "blackjack", avgBet: 25, hours: 4, basis: "average" });
  const opt = estimate({ gameId: "blackjack", avgBet: 25, hours: 4, basis: "optimal" });
  // optimal edge 0.5%: 25*70*4*0.005 = 35
  assert.equal(opt.theoLoss, 35);
  // comps still figured at the average/rating edge -> identical to the average case
  assert.equal(opt.compValue, avg.compValue);
  assert.ok(opt.theoLoss < avg.theoLoss);
});

test("editable edge override is respected for your loss", () => {
  const r = estimate({ gameId: "blackjack", avgBet: 10, hours: 2, basis: "average", edgePctOverride: 1.0 });
  // 10 * 70 * 2 * 0.01 = 14
  assert.equal(r.theoLoss, 14);
  assert.equal(r.edgePctUsed, 1.0);
  // comps unaffected by the override (uses the game's avg edge 2%): 10*70*2*0.02*0.33
  assert.ok(Math.abs(r.compValue - 10 * 70 * 2 * 0.02 * 0.33) < 1e-9);
});

test("comp rate is configurable", () => {
  const r = estimate({ gameId: "slots", avgBet: 1, hours: 3, compRatePct: 50 });
  // slots: 1 * 600 * 3 * 0.08 = 144 theo; comps 50% = 72
  assert.equal(r.theoLossAvg, 144);
  assert.equal(r.compValue, 72);
});

test("out-of-range edge and comp rate are clamped (audit m1/m2)", () => {
  assert.equal(estimate({ gameId: "blackjack", avgBet: 10, hours: 1, edgePctOverride: 500 }).edgePctUsed, 100);
  assert.equal(estimate({ gameId: "blackjack", avgBet: 10, hours: 1, edgePctOverride: -5 }).edgePctUsed, 0);
  assert.equal(estimate({ gameId: "slots", avgBet: 1, hours: 1, compRatePct: 500 }).compRatePct, 100);
  assert.equal(estimate({ gameId: "slots", avgBet: 1, hours: 1, compRatePct: -20 }).compRatePct, 0);
});

test("no-skill games: average and optimal edge are equal", () => {
  for (const id of ["roulette", "slots"]) {
    const g = gameById(id);
    assert.equal(g.avgEdgePct, g.optimalEdgePct, `${id} should have equal edges`);
    const a = estimate({ gameId: id, avgBet: 5, hours: 2, basis: "average" });
    const o = estimate({ gameId: id, avgBet: 5, hours: 2, basis: "optimal" });
    assert.equal(a.theoLoss, o.theoLoss);
  }
});

test("every game produces finite, non-negative outputs", () => {
  for (const g of GAMES) {
    const r = estimate({ gameId: g.id, avgBet: 50, hours: 5 });
    assert.ok(Number.isFinite(r.theoLoss) && r.theoLoss >= 0, `${g.id} theoLoss`);
    assert.ok(Number.isFinite(r.compValue) && r.compValue >= 0, `${g.id} compValue`);
    assert.ok(r.decisionsPerHour > 0, `${g.id} dph`);
  }
});

test("edge data sanity: optimal <= average, edges in 0..100", () => {
  for (const g of GAMES) {
    assert.ok(g.optimalEdgePct <= g.avgEdgePct, `${g.id} optimal should be <= average`);
    for (const e of [g.avgEdgePct, g.optimalEdgePct]) {
      assert.ok(e >= 0 && e <= 100, `${g.id} edge out of range`);
    }
    assert.ok(g.decisionsPerHour > 0 && g.decisionsPerHour < 5000, `${g.id} dph range`);
  }
});

test("craps carries a low-precision note; others may be blank", () => {
  assert.ok(gameById("craps").note.length > 0);
});

test("gameById / GAME_IDS are consistent", () => {
  assert.equal(GAME_IDS.length, GAMES.length);
  assert.equal(gameById("nope"), null);
  assert.equal(estimate({ gameId: "nope", avgBet: 1, hours: 1 }), null);
  assert.equal(edgeForBasis(gameById("blackjack"), "optimal"), 0.5);
});

test("garbage inputs degrade to zero, never NaN", () => {
  const r = estimate({ gameId: "blackjack", avgBet: NaN, hours: -3 });
  assert.equal(r.theoLoss, 0);
  assert.equal(r.compValue, 0);
});
