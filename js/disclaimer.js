/* Injects the always-on responsible-gambling disclaimer at the foot of every
   page (spec §2). Importing this module is all a page needs. */

const TEXT = `<strong>Play within your means.</strong> These tools help you track and
understand your Vegas spending — they do not change the odds or beat the house.
Every casino game still favors the house over time. Gamble responsibly, only with
money you can afford to lose. Problem gambling? Call the National Problem Gambling
Helpline: <strong>1-800-522-4700</strong> (call or text, 24/7).`;

function mount() {
  if (document.querySelector(".disclaimer")) return;
  const el = document.createElement("footer");
  el.className = "disclaimer";
  el.innerHTML = TEXT; // static, app-authored copy only — no user input
  document.body.appendChild(el);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
