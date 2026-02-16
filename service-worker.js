const CACHE_VERSION = "v1-shell-20260216-link-button-night";
const CACHE_NAME = `caraudio-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/link.js",
  "./assets/js/modules/broker-client.js",
  "./assets/js/modules/constants.js",
  "./assets/js/modules/storage.js",
  "./assets/js/modules/ui.js",
  "./assets/js/modules/navidrome.js",
  "./assets/js/modules/player.js",
  "./assets/js/modules/whats-new.js",
  "./assets/js/modules/i18n.js",
  "./assets/img/music-player.svg",
  "./assets/img/app-logo-a.png",
  "./assets/img/app-logo-b.png",
  "./assets/img/error-404-inspector.jpg",
  "./assets/img/github-mark-day.png",
  "./assets/img/github-mark-night.png",
  "./link/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match("./index.html");
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
