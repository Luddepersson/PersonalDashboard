const CACHE_NAME = "dashboard-v2";
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/login",
  "/register",
  "/manifest.json",
];

// Install: precache core routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Cache-first for Next.js static assets
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages and other requests
  const acceptHeader = event.request.headers.get("accept") || "";
  const isHTMLRequest =
    event.request.mode === "navigate" || acceptHeader.includes("text/html");

  if (isHTMLRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match("/")
          )
        )
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync: refetch cached pages when coming back online
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "ONLINE_AGAIN") {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((request) => {
          fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response);
              }
            })
            .catch(() => {
              // Refetch failed silently — keep stale cache
            });
        });
      });
    });
  }
});
