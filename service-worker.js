// ===============================
// BULLETPROOF SERVICE WORKER
// Corrected to use relative paths
// ===============================

const CACHE_NAME = "awg-cache-v102";

// IMPORTANT — all paths are NOW RELATIVE
const FILES_TO_CACHE = [
  "./",
  "index.html",
  "style.css",
  "game.js",
  "speech-v2.js",
  "commands.js",
  "dictionary.js",
  "puzzle.js",
  "manifest.json",
  "words.txt"
];

async function safeCacheFiles(cache, files) {
  for (const file of files) {
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(res.status);
      await cache.put(file, res.clone());
      console.log("[SW] Cached:", file);
    } catch (err) {
      console.warn("[SW] Skipped:", file, err);
    }
  }
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => safeCacheFiles(cache, FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});