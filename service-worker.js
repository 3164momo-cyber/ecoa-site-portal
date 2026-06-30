const CACHE_NAME = "ecoa-site-portal-v9.0";
const STANDARD_DATA_PATH = "/data/sites.csv";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=9.0",
  "./app.js?v=9.0",
  "./manifest.json",
  "./sample-sites.csv",
  "./data/sites.csv",
  "./assets/ecoa-portal-logo.svg",
  "./assets/ecoa-portal-logo-white.svg",
  "./assets/ecoa-brand-guide.png",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./vendor/leaflet/images/marker-icon.png",
  "./vendor/leaflet/images/marker-icon-2x.png",
  "./vendor/leaflet/images/marker-shadow.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
  "./icons/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith(STANDARD_DATA_PATH)) {
    const standardDataUrl = new URL("./data/sites.csv", self.registration.scope).href;
    event.respondWith(
      fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(standardDataUrl, copy));
        return response;
      }).catch(() => caches.match(standardDataUrl))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
  );
});
