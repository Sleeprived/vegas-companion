import { LANDMARKS, walkBetween, VERDICT_TEXT, MONORAIL_NOTE } from "../lib/walk.js";
import "../disclaimer.js";

const els = {
  origin: document.getElementById("origin"),
  dest: document.getElementById("dest"),
  swap: document.getElementById("swap"),
  minutes: document.getElementById("minutes"),
  miles: document.getElementById("miles"),
  verdict: document.getElementById("verdict"),
  verdictText: document.getElementById("verdict-text"),
  tram: document.getElementById("tram"),
  monorail: document.getElementById("monorail"),
};

const options = LANDMARKS.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
els.origin.innerHTML = options;
els.dest.innerHTML = options;
els.origin.value = "bellagio";
els.dest.value = "venetian";
els.monorail.textContent = MONORAIL_NOTE;

function recompute() {
  const r = walkBetween(els.origin.value, els.dest.value);
  if (!r) return;

  if (r.verdict === "same") {
    els.minutes.textContent = "0 min";
    els.miles.textContent = "0 mi";
  } else {
    els.minutes.textContent = `~${r.minutes} min`;
    els.miles.textContent = `${r.miles} mi`;
  }

  els.verdict.className = "verdict " + r.verdict;
  els.verdict.textContent =
    r.verdict === "walk" ? "🚶 Walk it" :
    r.verdict === "maybe" ? "🚶 / 🚝 Your call" :
    r.verdict === "ride" ? "🚗 Tram or rideshare" : "You're here";
  els.verdictText.textContent = VERDICT_TEXT[r.verdict] || "";

  if (r.sameTram && r.tram) {
    els.tram.classList.remove("hidden");
    els.tram.textContent = `Good news: the ${r.tram.name} connects these — skip the walk for free.`;
  } else {
    els.tram.classList.add("hidden");
  }
}

els.origin.addEventListener("change", recompute);
els.dest.addEventListener("change", recompute);
els.swap.addEventListener("click", () => {
  const o = els.origin.value;
  els.origin.value = els.dest.value;
  els.dest.value = o;
  recompute();
});

recompute();
