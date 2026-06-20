/* Bankroll & session tracker logic (spec §6). Pure, DOM-free, shared by UI and
   tests. All functions are non-mutating: state updates return new objects.

   A session is either OPEN (live: buy-in recorded, current stack tracked) or
   CLOSED (cash-out recorded). Net:
     open   -> (currentStack ?? buyIn) - buyIn   (unrealized)
     closed -> cashOut - buyIn
   Totals include the open session's unrealized net, so "remaining" reflects your
   live bankroll. Remaining = budget + totalNet (above budget when you're up).

   Money is clamped non-negative; labels are trimmed/length-capped (spec §8). */

import { toMoney, toLabel, toNumber } from "./validate.js";

export function defaultState() {
  return { budget: 0, dailyLimit: null, stopLoss: null, winGoal: null, sessions: [] };
}

/* A positive setting or null ("no limit"). */
function posOrNull(v) {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function normalizeSettings(input = {}) {
  return {
    budget: toMoney(input.budget, 0),
    dailyLimit: posOrNull(input.dailyLimit),
    stopLoss: posOrNull(input.stopLoss),
    winGoal: posOrNull(input.winGoal),
  };
}

let counter = 0;
function makeId(now) {
  counter += 1;
  return `s${now}_${counter}`;
}

/* Create a new OPEN session. */
export function newSession({ game, location, buyIn, now = Date.now() }) {
  const amt = toMoney(buyIn, 0);
  return {
    id: makeId(now),
    game: toLabel(game) || "Session",
    location: toLabel(location),
    buyIn: amt,
    currentStack: amt,
    cashOut: null,
    startedAt: now,
    endedAt: null,
    status: "open",
  };
}

/* Create a CLOSED session in one shot (the "quick log" path). */
export function quickLogSession({ game, location, buyIn, cashOut, now = Date.now() }) {
  const s = newSession({ game, location, buyIn, now });
  return closeSession(s, { cashOut, now });
}

/* Update the live stack of an open session (returns a new session). */
export function updateStack(session, currentStack) {
  if (session.status !== "open") return session;
  return { ...session, currentStack: toMoney(currentStack, session.currentStack) };
}

/* Close an open session with a cash-out (returns a new session). */
export function closeSession(session, { cashOut, now = Date.now() }) {
  const out = toMoney(cashOut, 0);
  return { ...session, cashOut: out, currentStack: out, endedAt: now, status: "closed" };
}

export function sessionNet(session) {
  if (!session) return 0;
  if (session.status === "closed") return round2(toMoney(session.cashOut, 0) - toMoney(session.buyIn, 0));
  const stack = session.currentStack == null ? session.buyIn : session.currentStack;
  return round2(toMoney(stack, 0) - toMoney(session.buyIn, 0));
}

export function totalNet(sessions = []) {
  return round2(sessions.reduce((sum, s) => sum + sessionNet(s), 0));
}

export function remaining(budget, sessions = []) {
  return round2(toMoney(budget, 0) + totalNet(sessions));
}

function sameLocalDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function todayNet(sessions = [], now = Date.now()) {
  return round2(
    sessions.filter((s) => sameLocalDay(s.startedAt, now)).reduce((sum, s) => sum + sessionNet(s), 0),
  );
}

export function isOverDailyLimit(sessions, dailyLimit, now = Date.now()) {
  const lim = posOrNull(dailyLimit);
  if (lim == null) return false;
  return todayNet(sessions, now) <= -lim;
}

/* Walk-away signal for a session given the trip's stop-loss / win-goal. */
export function sessionAlert(session, { stopLoss, winGoal } = {}) {
  const net = sessionNet(session);
  const win = posOrNull(winGoal);
  const stop = posOrNull(stopLoss);
  if (win != null && net >= win) {
    return { kind: "win", net, message: `Up ${money(net)} — you hit your win goal. Good time to walk.` };
  }
  if (stop != null && net <= -stop) {
    return { kind: "loss", net, message: `Down ${money(-net)} — you hit your stop-loss. Time to walk away.` };
  }
  return { kind: "none", net, message: "" };
}

export function summarize(state, now = Date.now()) {
  const s = { ...defaultState(), ...state };
  const sessions = Array.isArray(s.sessions) ? s.sessions : [];
  const nets = sessions.map(sessionNet);
  const closed = sessions.filter((x) => x.status === "closed");
  return {
    remaining: remaining(s.budget, sessions),
    totalNet: totalNet(sessions),
    todayNet: todayNet(sessions, now),
    overDaily: isOverDailyLimit(sessions, s.dailyLimit, now),
    count: sessions.length,
    openCount: sessions.filter((x) => x.status === "open").length,
    wins: closed.filter((x) => sessionNet(x) > 0).length,
    losses: closed.filter((x) => sessionNet(x) < 0).length,
    biggestWin: nets.length ? round2(Math.max(0, ...nets)) : 0,
    biggestLoss: nets.length ? round2(Math.min(0, ...nets)) : 0,
  };
}

function round2(n) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}
function money(n) {
  return `$${round2(n).toFixed(2)}`;
}
