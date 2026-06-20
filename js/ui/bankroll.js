import {
  defaultState,
  normalizeSettings,
  newSession,
  quickLogSession,
  updateStack,
  closeSession,
  sessionNet,
  sessionAlert,
  summarize,
} from "../lib/bankroll.js";
import { usd, signedUsd } from "../lib/format.js";
import { toNumber } from "../lib/validate.js";
import { getJSON, setJSON, remove } from "../storage.js";
import "../disclaimer.js";

const KEY = "bankroll";

let state = { ...defaultState(), ...(getJSON(KEY) || {}) };
if (!Array.isArray(state.sessions)) state.sessions = [];

const el = (id) => document.getElementById(id);
const els = {
  remaining: el("sum-remaining"), net: el("sum-net"), today: el("sum-today"),
  dailyWarning: el("daily-warning"), record: el("sum-record"),
  live: el("live-session"), noSession: el("no-session"),
  liveGame: el("live-game"), liveWhen: el("live-when"), liveBuyin: el("live-buyin"),
  liveStack: el("live-stack"), liveNet: el("live-net"), liveAlert: el("live-alert"),
  liveCashout: el("live-cashout"), closeBtn: el("close-session"),
  startGame: el("start-game"), startLoc: el("start-loc"), startBuyin: el("start-buyin"),
  startBtn: el("start-session"), qlBuyin: el("ql-buyin"), qlCashout: el("ql-cashout"), qlBtn: el("quick-log"),
  setBudget: el("set-budget"), setDaily: el("set-daily"), setStop: el("set-stop"), setWin: el("set-win"),
  saveBtn: el("save-settings"), savedHint: el("settings-saved"),
  history: el("history"), historyEmpty: el("history-empty"), clearBtn: el("clear-bankroll"),
};

const save = () => setJSON(KEY, state);
const openSession = () => state.sessions.find((s) => s.status === "open") || null;

function fmtTime(ts) {
  if (!Number.isFinite(ts)) return "";
  try {
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function setValue(node, text, cls) {
  node.textContent = text;
  node.classList.remove("gain", "loss");
  if (cls) node.classList.add(cls);
}
const netClass = (n) => (n > 0 ? "gain" : n < 0 ? "loss" : "");

// --- Summary + live-session derived values (safe to call mid-typing) ---
function refreshDerived() {
  const sum = summarize(state, Date.now());
  setValue(els.remaining, usd(sum.remaining), sum.remaining < toNumber(state.budget, 0) ? "loss" : "");
  setValue(els.net, signedUsd(sum.totalNet), netClass(sum.totalNet));
  setValue(els.today, signedUsd(sum.todayNet), netClass(sum.todayNet));

  if (sum.overDaily) {
    els.dailyWarning.classList.remove("hidden");
    els.dailyWarning.textContent = `Daily loss limit reached (${signedUsd(sum.todayNet)} today). Consider calling it.`;
  } else {
    els.dailyWarning.classList.add("hidden");
  }
  els.record.textContent = `${sum.wins}W / ${sum.losses}L across ${sum.count} session${sum.count === 1 ? "" : "s"}`;

  const open = openSession();
  if (open) {
    const n = sessionNet(open);
    setValue(els.liveNet, signedUsd(n), netClass(n));
    const a = sessionAlert(open, { stopLoss: state.stopLoss, winGoal: state.winGoal });
    els.liveAlert.classList.remove("win", "loss", "neutral");
    if (a.kind === "none") {
      els.liveAlert.classList.add("neutral");
      els.liveAlert.textContent = state.stopLoss || state.winGoal
        ? "On track — no walk-away trigger yet."
        : "Set a stop-loss and win goal in Limits to get a walk-away alert.";
    } else {
      els.liveAlert.classList.add(a.kind);
      els.liveAlert.textContent = a.message;
    }
  }
}

// --- Session panel (start forms vs live block); sets input values, so NOT called mid-typing ---
function renderSession() {
  const open = openSession();
  els.live.classList.toggle("hidden", !open);
  els.noSession.classList.toggle("hidden", !!open);
  if (open) {
    els.liveGame.textContent = open.location ? `${open.game} · ${open.location}` : open.game;
    els.liveWhen.textContent = fmtTime(open.startedAt);
    els.liveBuyin.textContent = usd(open.buyIn);
    els.liveStack.value = String(open.currentStack);
    els.liveCashout.value = String(open.currentStack);
  }
}

function renderHistory() {
  els.history.innerHTML = "";
  const sessions = [...state.sessions].reverse(); // newest first
  els.historyEmpty.classList.toggle("hidden", sessions.length > 0);
  for (const s of sessions) {
    const li = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "meta";
    const game = document.createElement("div");
    game.className = "game";
    game.textContent = s.location ? `${s.game} · ${s.location}` : s.game; // textContent: user text never parsed as HTML
    const when = document.createElement("div");
    when.className = "when";
    when.textContent = fmtTime(s.startedAt) + (s.status === "open" ? " · live" : "");
    meta.append(game, when);

    const n = sessionNet(s);
    const net = document.createElement("div");
    net.className = "net " + netClass(n);
    net.textContent = signedUsd(n);

    const rm = document.createElement("button");
    rm.className = "btn ghost";
    rm.textContent = "✕";
    rm.setAttribute("aria-label", "Remove session");
    rm.addEventListener("click", () => removeSession(s.id));

    li.append(meta, net, rm);
    els.history.appendChild(li);
  }
}

function fillSettingsInputs() {
  els.setBudget.value = state.budget ? String(state.budget) : "";
  els.setDaily.value = state.dailyLimit ? String(state.dailyLimit) : "";
  els.setStop.value = state.stopLoss ? String(state.stopLoss) : "";
  els.setWin.value = state.winGoal ? String(state.winGoal) : "";
}

function renderAll() {
  renderSession();
  renderHistory();
  refreshDerived();
}

// --- Actions ---
els.startBtn.addEventListener("click", () => {
  if (openSession()) {
    alert("Close your current live session before starting another.");
    return;
  }
  const s = newSession({
    game: els.startGame.value,
    location: els.startLoc.value,
    buyIn: toNumber(els.startBuyin.value, 0),
  });
  state.sessions.push(s);
  save();
  renderAll();
});

els.liveStack.addEventListener("input", () => {
  const open = openSession();
  if (!open) return;
  const i = state.sessions.findIndex((s) => s.id === open.id);
  state.sessions[i] = updateStack(open, toNumber(els.liveStack.value, open.currentStack));
  save();
  refreshDerived();
  renderHistory(); // open session's net in the list follows the stack
});

els.closeBtn.addEventListener("click", () => {
  const open = openSession();
  if (!open) return;
  const i = state.sessions.findIndex((s) => s.id === open.id);
  state.sessions[i] = closeSession(open, { cashOut: toNumber(els.liveCashout.value, 0) });
  save();
  renderAll();
});

els.qlBtn.addEventListener("click", () => {
  const s = quickLogSession({
    game: els.startGame.value,
    location: els.startLoc.value,
    buyIn: toNumber(els.qlBuyin.value, 0),
    cashOut: toNumber(els.qlCashout.value, 0),
  });
  state.sessions.push(s);
  save();
  renderAll();
});

els.saveBtn.addEventListener("click", () => {
  const next = normalizeSettings({
    budget: els.setBudget.value,
    dailyLimit: els.setDaily.value,
    stopLoss: els.setStop.value,
    winGoal: els.setWin.value,
  });
  Object.assign(state, next);
  save();
  fillSettingsInputs();
  els.savedHint.classList.remove("hidden");
  setTimeout(() => els.savedHint.classList.add("hidden"), 1500);
  refreshDerived();
});

function removeSession(id) {
  state.sessions = state.sessions.filter((s) => s.id !== id);
  save();
  renderAll();
}

els.clearBtn.addEventListener("click", () => {
  if (!confirm("Delete your budget, limits, and all logged sessions on this device?")) return;
  remove(KEY);
  state = defaultState();
  fillSettingsInputs();
  renderAll();
});

fillSettingsInputs();
renderAll();
