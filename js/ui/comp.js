import { GAMES, gameById, estimate } from "../lib/comp.js";
import { usd } from "../lib/format.js";
import { toNumber } from "../lib/validate.js";
import "../disclaimer.js";

const els = {
  game: document.getElementById("game"),
  avgbet: document.getElementById("avgbet"),
  hours: document.getElementById("hours"),
  basis: document.getElementById("basis"),
  edge: document.getElementById("edge"),
  comprate: document.getElementById("comprate"),
  gamenote: document.getElementById("gamenote"),
  dph: document.getElementById("dph"),
  theoloss: document.getElementById("theoloss"),
  compvalue: document.getElementById("compvalue"),
  explainer: document.getElementById("explainer"),
};

let basis = "average";

// Populate game dropdown from the enumerated list.
els.game.innerHTML = GAMES.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");

function currentGame() {
  return gameById(els.game.value) || GAMES[0];
}

// Reset the editable edge field to the preset for the current game + basis.
function setEdgePreset() {
  const g = currentGame();
  els.edge.value = String(basis === "optimal" ? g.optimalEdgePct : g.avgEdgePct);
}

function setBasis(next) {
  basis = next === "optimal" ? "optimal" : "average";
  for (const btn of els.basis.querySelectorAll("button")) {
    btn.setAttribute("aria-pressed", btn.dataset.basis === basis ? "true" : "false");
  }
  setEdgePreset();
  recompute();
}

function recompute() {
  const g = currentGame();
  els.gamenote.textContent = g.note || "";
  els.gamenote.classList.toggle("hidden", !g.note);
  els.dph.textContent = String(g.decisionsPerHour);

  const r = estimate({
    gameId: g.id,
    avgBet: toNumber(els.avgbet.value, 0),
    hours: toNumber(els.hours.value, 0),
    basis,
    edgePctOverride: els.edge.value,
    compRatePct: toNumber(els.comprate.value, 0),
  });

  els.theoloss.textContent = usd(r.theoLoss);
  els.compvalue.textContent = usd(r.compValue);

  els.explainer.textContent =
    `Casinos comp you based on average play — the ${g.avgEdgePct}% rating edge — not how well you actually play, ` +
    `so the comp figure stays the same when you switch to Optimal. ` +
    `Your theoretical loss above uses the ${basis} edge (${r.edgePctUsed}%) at ${g.decisionsPerHour} decisions/hour. ` +
    `Comps shown at a ${r.compRatePct}% reinvestment rate.`;
}

els.game.addEventListener("change", () => {
  setEdgePreset();
  recompute();
});
els.basis.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-basis]");
  if (btn) setBasis(btn.dataset.basis);
});
for (const id of ["avgbet", "hours", "edge", "comprate"]) {
  els[id].addEventListener("input", recompute);
}

setEdgePreset();
recompute();
