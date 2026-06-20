/* Service worker: offline app shell with a VERSIONED cache. Bump CACHE_VERSION on
   every deploy; old caches are deleted on activate and the new worker claims
   clients, so a redeploy reaches installed users on next load. */

const CACHE_VERSION = "vegas-v1";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/theme.css",
  "./css/base.css",
  "./js/hub.js",
  "./js/storage.js",
  "./js/disclaimer.js",
  "./js/lib/validate.js",
  "./js/lib/format.js",
  "./js/lib/comp.js",
  "./js/lib/tipping.js",
  "./js/lib/bankroll.js",
  "./js/lib/walk.js",
  "./js/ui/comp.js",
  "./js/ui/tipping.js",
  "./js/ui/bankroll.js",
  "./js/ui/walk.js",
  "./comp/index.html",
  "./tipping/index.html",
  "./bankroll/index.html",
  "./walk/index.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* Cache-first for same-origin GETs, with a network fallback that also fills the
   cache for anything not precached. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(handle(req));
});

async function handle(req) {
  const hit = await caches.match(req);
  if (hit) return hit;

  /* A navigation to a directory URL (e.g. /comp/) does not match the precached
     /comp/index.html — resolve to that key before hitting the network, so the
     correct page loads offline instead of falling back to the hub. */
  if (req.mode === "navigate") {
    const indexHit = await caches.match(new URL("index.html", req.url).href);
    if (indexHit) return indexHit;
  }

  try {
    const res = await fetch(req);
    const copy = res.clone();
    caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
    return res;
  } catch {
    return (await caches.match("./index.html")) || Response.error();
  }
}
