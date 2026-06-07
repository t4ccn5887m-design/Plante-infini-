const CACHE_NAME = "wilder-v4";
const PRECACHE_URLS = [
  "/manifest.json?v=20250605",
  "/icon-192.png?v=20250605",
  "/icon-512.png?v=20250605",
  "/icon-180.png?v=20250605",
];

const BRANDING_PATHS = new Set([
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "/favicon-32.png",
  "/favicon.ico",
]);

function isBrandingAsset(pathname) {
  if (BRANDING_PATHS.has(pathname)) return true;
  return /\.(png|ico|svg|webp)$/i.test(pathname) && pathname.startsWith("/icon");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || caches.match("/")));
}

function networkOnly(request) {
  return fetch(request).catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate" || url.pathname === "/") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  if (isBrandingAsset(url.pathname) || url.pathname === "/manifest.json") {
    event.respondWith(networkOnly(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
