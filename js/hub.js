import { clearAll } from "./storage.js";
import "./disclaimer.js";

const TOOLS = [
  { href: "bankroll/", badge: "💵", name: "Bankroll Tracker", desc: "Budget, sessions & walk-away alerts" },
  { href: "tipping/", badge: "🪙", name: "Tipping Calculator", desc: "Vegas tipping, sorted out" },
  { href: "walk/", badge: "🚶", name: "Strip Walk Times", desc: "Walk, tram, or rideshare?" },
  { href: "comp/", badge: "🎁", name: "Comp Estimator", desc: "Theoretical loss & comp value" },
];

function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = TOOLS.map(
    (t) => `
    <a class="tile" href="${t.href}">
      <span class="badge">${t.badge}</span>
      <span class="name">${t.name}</span>
      <span class="stat">${t.desc}</span>
    </a>`,
  ).join("");
}

render();

document.getElementById("reset-all").addEventListener("click", () => {
  if (confirm("Clear ALL saved data (bankroll, sessions, saved inputs) from this device?")) {
    clearAll();
    location.reload();
  }
});
