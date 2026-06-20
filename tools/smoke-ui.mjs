/* Dev-only import smoke for the browser UI modules. For each page it parses the
   REAL element ids out of that page's HTML, then stubs the DOM so getElementById
   returns a fake element ONLY for ids the page actually has (and null otherwise,
   like a browser). Importing each module runs its top-level setup, so a mis-wired
   id (typo, missing element) throws on a null deref and is reported here — bugs
   that `node --check` and `node --test` cannot catch. Not shipped behavior.

   Run with:  node tools/smoke-ui.mjs */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function idsInHtml(relPath) {
  const html = readFileSync(join(root, relPath), "utf8");
  const ids = new Set();
  for (const m of html.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

function makeFake() {
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "children") return [];
      if (prop === "dataset" || prop === "style") return {};
      if (prop === "classList")
        return { toggle() {}, contains() { return false; }, add() {}, remove() {} };
      if (prop === "value" || prop === "textContent" || prop === "innerHTML" || prop === "className")
        return "";
      if (prop === "disabled") return false;
      if (prop === Symbol.iterator) return [][Symbol.iterator].bind([]);
      return makeFake();
    },
    set() { return true; },
    apply() { return makeFake(); },
  });
}

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.confirm = () => true;
globalThis.alert = () => {};
globalThis.location = { reload() {} };

function installDom(ids) {
  globalThis.document = {
    getElementById: (id) => (ids.has(id) ? makeFake() : null),
    createElement: () => makeFake(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    readyState: "complete",
    documentElement: { dataset: {} },
    body: makeFake(),
  };
}

// page HTML -> the module it loads
const PAGES = [
  { html: "index.html", mod: "../js/hub.js" },
  { html: "comp/index.html", mod: "../js/ui/comp.js" },
  { html: "tipping/index.html", mod: "../js/ui/tipping.js" },
  { html: "bankroll/index.html", mod: "../js/ui/bankroll.js" },
  { html: "walk/index.html", mod: "../js/ui/walk.js" },
];

let failed = 0;
for (const p of PAGES) {
  try {
    installDom(idsInHtml(p.html));
    store.clear();
    await import(p.mod);
    console.log("ok  ", p.mod);
  } catch (e) {
    failed++;
    console.log("FAIL", p.mod, "\n    ", e.message);
  }
}
console.log(failed ? `\n${failed} module(s) threw on setup` : "\nall UI modules wired and ran setup cleanly");
process.exit(failed ? 1 : 0);
