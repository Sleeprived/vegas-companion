import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultState,
  normalizeSettings,
  newSession,
  quickLogSession,
  updateStack,
  closeSession,
  sessionNet,
  totalNet,
  remaining,
  todayNet,
  isOverDailyLimit,
  sessionAlert,
  summarize,
} from "../js/lib/bankroll.js";

// Deterministic local-time timestamps (built in local TZ so the date math is stable).
const T1 = new Date(2026, 5, 16, 10, 0, 0).getTime(); // Jun 16 2026, morning
const T1_EVE = new Date(2026, 5, 16, 21, 0, 0).getTime(); // same day, night
const T2 = new Date(2026, 5, 17, 10, 0, 0).getTime(); // next day

test("newSession starts open with zero net", () => {
  const s = newSession({ game: "Blackjack", location: "Bellagio", buyIn: 100, now: T1 });
  assert.equal(s.status, "open");
  assert.equal(s.buyIn, 100);
  assert.equal(s.currentStack, 100);
  assert.equal(s.cashOut, null);
  assert.equal(sessionNet(s), 0);
});

test("updateStack drives unrealized net (non-mutating)", () => {
  const s = newSession({ game: "Craps", buyIn: 100, now: T1 });
  const s2 = updateStack(s, 175);
  assert.equal(sessionNet(s2), 75);
  assert.equal(sessionNet(s), 0); // original untouched
});

test("closeSession records cash-out and realized net", () => {
  const s = closeSession(newSession({ game: "x", buyIn: 100, now: T1 }), { cashOut: 60, now: T1_EVE });
  assert.equal(s.status, "closed");
  assert.equal(s.cashOut, 60);
  assert.equal(sessionNet(s), -40);
});

test("quickLogSession logs a finished session in one step", () => {
  const s = quickLogSession({ game: "Slots", buyIn: 50, cashOut: 80, now: T1 });
  assert.equal(s.status, "closed");
  assert.equal(sessionNet(s), 30);
});

test("totalNet and remaining combine sessions", () => {
  const sessions = [
    quickLogSession({ game: "a", buyIn: 100, cashOut: 160, now: T1 }), // +60
    quickLogSession({ game: "b", buyIn: 100, cashOut: 70, now: T1 }), //  -30
  ];
  assert.equal(totalNet(sessions), 30);
  assert.equal(remaining(500, sessions), 530); // up 30 -> above budget
});

test("todayNet counts only same-day sessions", () => {
  const sessions = [
    quickLogSession({ game: "today1", buyIn: 100, cashOut: 50, now: T1 }), // -50 today
    quickLogSession({ game: "today2", buyIn: 100, cashOut: 130, now: T1_EVE }), // +30 today
    quickLogSession({ game: "tomorrow", buyIn: 100, cashOut: 0, now: T2 }), // -100 next day
  ];
  assert.equal(todayNet(sessions, T1_EVE), -20); // -50 + 30
});

test("isOverDailyLimit triggers when today's loss meets the limit", () => {
  const sessions = [quickLogSession({ game: "x", buyIn: 200, cashOut: 0, now: T1 })]; // -200 today
  assert.equal(isOverDailyLimit(sessions, 150, T1_EVE), true);
  assert.equal(isOverDailyLimit(sessions, 250, T1_EVE), false);
  assert.equal(isOverDailyLimit(sessions, null, T1_EVE), false); // no limit set
  assert.equal(isOverDailyLimit(sessions, 150, T2), false); // different day
});

test("sessionAlert fires win, loss, or none", () => {
  const base = (stack) => updateStack(newSession({ game: "x", buyIn: 100, now: T1 }), stack);
  assert.equal(sessionAlert(base(170), { winGoal: 50, stopLoss: 50 }).kind, "win");
  assert.equal(sessionAlert(base(40), { winGoal: 50, stopLoss: 50 }).kind, "loss");
  assert.equal(sessionAlert(base(120), { winGoal: 50, stopLoss: 50 }).kind, "none");
  assert.equal(sessionAlert(base(120), {}).kind, "none"); // no thresholds set
});

test("summarize rolls up the trip", () => {
  const state = {
    ...defaultState(),
    budget: 1000,
    sessions: [
      quickLogSession({ game: "a", buyIn: 100, cashOut: 160, now: T1 }), // +60 win
      quickLogSession({ game: "b", buyIn: 100, cashOut: 70, now: T1 }), //  -30 loss
      updateStack(newSession({ game: "c", buyIn: 100, now: T1 }), 110), // +10 open
    ],
  };
  const sum = summarize(state, T1_EVE);
  assert.equal(sum.totalNet, 40);
  assert.equal(sum.remaining, 1040);
  assert.equal(sum.count, 3);
  assert.equal(sum.openCount, 1);
  assert.equal(sum.wins, 1);
  assert.equal(sum.losses, 1);
  assert.equal(sum.biggestWin, 60);
  assert.equal(sum.biggestLoss, -30);
});

test("normalizeSettings: zero/negative become null (no limit), positive kept", () => {
  const s = normalizeSettings({ budget: 500, dailyLimit: 0, stopLoss: -10, winGoal: 200 });
  assert.equal(s.budget, 500);
  assert.equal(s.dailyLimit, null);
  assert.equal(s.stopLoss, null);
  assert.equal(s.winGoal, 200);
});

test("garbage inputs never produce NaN", () => {
  const s = quickLogSession({ game: "x", buyIn: "abc", cashOut: null, now: T1 });
  assert.ok(Number.isFinite(sessionNet(s)));
  assert.ok(Number.isFinite(remaining("nope", [s])));
  const sum = summarize({ budget: "x", sessions: "not-an-array" }, T1);
  assert.ok(Number.isFinite(sum.remaining));
  assert.equal(sum.count, 0);
});
