import {
  FLAT_SCENARIOS,
  PERCENT_SCENARIOS,
  flatScenarioById,
  percentScenarioById,
  flatTip,
  percentTip,
  splitBill,
} from "../lib/tipping.js";
import { usd } from "../lib/format.js";
import { toNumber } from "../lib/validate.js";
import "../disclaimer.js";

const els = {
  scenario: document.getElementById("scenario"),
  flatInputs: document.getElementById("flat-inputs"),
  pctInputs: document.getElementById("pct-inputs"),
  flatUnit: document.getElementById("flat-unit"),
  flatPerUnit: document.getElementById("flat-perunit"),
  flatCount: document.getElementById("flat-count"),
  pctBill: document.getElementById("pct-bill"),
  pctRate: document.getElementById("pct-rate"),
  scenarioTip: document.getElementById("scenario-tip"),
  scenarioNote: document.getElementById("scenario-note"),
  ref: document.getElementById("ref"),
  splitBill: document.getElementById("split-bill"),
  splitPct: document.getElementById("split-pct"),
  splitPeople: document.getElementById("split-people"),
  splitTip: document.getElementById("split-tip"),
  splitTotal: document.getElementById("split-total"),
  splitPp: document.getElementById("split-pp"),
};

// --- Scenario picker (flat per-unit vs percent of bill) ---
els.scenario.innerHTML =
  `<optgroup label="Per item">` +
  FLAT_SCENARIOS.map((s) => `<option value="${s.id}">${s.name}</option>`).join("") +
  `</optgroup><optgroup label="% of a bill">` +
  PERCENT_SCENARIOS.map((s) => `<option value="${s.id}">${s.name}</option>`).join("") +
  `</optgroup>`;

function loadScenario() {
  const id = els.scenario.value;
  const flat = flatScenarioById(id);
  const pct = flat ? null : percentScenarioById(id);
  if (flat) {
    els.flatInputs.classList.remove("hidden");
    els.pctInputs.classList.add("hidden");
    els.flatUnit.textContent = flat.unitLabel;
    els.flatPerUnit.value = String(flat.perUnit);
    els.scenarioNote.textContent = flat.note;
  } else if (pct) {
    els.flatInputs.classList.add("hidden");
    els.pctInputs.classList.remove("hidden");
    els.pctRate.value = String(pct.defaultPct);
    els.scenarioNote.textContent = pct.note;
  } else {
    return; // unknown selection — leave the UI as-is rather than crashing
  }
  recomputeScenario();
}

function recomputeScenario() {
  const id = els.scenario.value;
  let tip = 0;
  if (flatScenarioById(id)) {
    tip = flatTip(toNumber(els.flatPerUnit.value, 0), toNumber(els.flatCount.value, 0));
  } else if (percentScenarioById(id)) {
    tip = percentTip(toNumber(els.pctBill.value, 0), toNumber(els.pctRate.value, 0));
  }
  els.scenarioTip.textContent = usd(tip);
}

// --- Reference table ---
function renderRef() {
  const rows = [
    ...FLAT_SCENARIOS.map(
      (s) => `<tr><td>${s.name}</td><td class="num">$${s.range[0]}–${s.range[1]} / ${s.unitLabel}</td></tr>`,
    ),
    ...PERCENT_SCENARIOS.map(
      (s) => `<tr><td>${s.name}</td><td class="num">${s.range[0]}–${s.range[1]}%</td></tr>`,
    ),
  ];
  els.ref.innerHTML =
    `<thead><tr><th>Who</th><th class="num">Customary</th></tr></thead><tbody>${rows.join("")}</tbody>`;
}

// --- Split calculator ---
function recomputeSplit() {
  const r = splitBill(
    toNumber(els.splitBill.value, 0),
    toNumber(els.splitPct.value, 0),
    toNumber(els.splitPeople.value, 1),
  );
  els.splitTip.textContent = usd(r.tip);
  els.splitTotal.textContent = usd(r.total);
  els.splitPp.textContent = usd(r.perPerson);
}

els.scenario.addEventListener("change", loadScenario);
for (const id of ["flatPerUnit", "flatCount", "pctBill", "pctRate"]) {
  els[id].addEventListener("input", recomputeScenario);
}
for (const id of ["splitBill", "splitPct", "splitPeople"]) {
  els[id].addEventListener("input", recomputeSplit);
}

renderRef();
loadScenario();
recomputeSplit();
