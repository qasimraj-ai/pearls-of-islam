/* Service worker: lets Pearls Of Islam install like an app and open offline. */
const VERSION = "poi-v4";
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const SHELL_FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
const DATA_HOSTS = ["api.alquran.cloud", "api.aladhan.com", "fonts.googleapis.com", "fonts.gstatic.com",
  "cdn.jsdelivr.net", "fastly.jsdelivr.net", "gcore.jsdelivr.net", "raw.githubusercontent.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return; // let audio streaming go straight to the network
  const url = new URL(req.url);

  // Page navigation: network first, fall back to the cached app
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put("./index.html", copy)); } return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Our own files (JS, CSS, icons): cache first
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok && r.type === "basic") { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); } return r; })));
    return;
  }
  // Quran text, hadith books, prayer times, fonts: show the saved copy instantly, refresh in the background
  if (DATA_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(DATA).then(async (cache) => {
      const hit = await cache.match(req);
      const fresh = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || fresh;
    }));
  }
});

/* A prayer-time push arrives with no text; the text is fetched from the server for this phone */
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let alert = { title: "Prayer time", body: "Open Pearls Of Islam for the prayer time.", tag: "prayer" };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const cache = await caches.open(`${VERSION}-config`);
      const base = await cache.match("api-base").then((r) => (r ? r.text() : ""));
      if (sub && base) {
        const r = await fetch(`${base}/api/push/alert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        if (r.ok) alert = await r.json();
      }
    } catch { /* show the generic alert */ }
    await self.registration.showNotification(alert.title, {
      body: alert.body, tag: alert.tag || "prayer", icon: "./icons/icon-192.png", badge: "./icons/icon-192.png",
      requireInteraction: true, vibrate: [400, 200, 400],
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow("./"))));
});
