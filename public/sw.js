self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler: we keep it simple for now.
// (This is enough to satisfy "service worker present" for installability.)
self.addEventListener("fetch", () => {});

