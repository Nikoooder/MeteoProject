const SHELL = "ecomonitor-shell-v1";
const MAP = "ecomonitor-map-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", event => event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isMap = url.hostname === "tiles.openfreemap.org" || url.hostname.endsWith("openfreemap.org");
  if (isMap) {
    event.respondWith(caches.open(MAP).then(async cache => {
      const cached = await cache.match(request);
      const network = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; });
      return cached || network;
    }));
    return;
  }
  if (url.origin === location.origin) {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(SHELL).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(found => found || caches.match("/index.html"))));
  }
});
