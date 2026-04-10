// ═══════════════════════════════════════════
// GLUPP — Service Worker (PWA + Push)
// ═══════════════════════════════════════════

const CACHE_NAME = "glupp-v2";
const STATIC_ASSETS = [
  "/",
  "/duel",
  "/ranking",
  "/collection",
  "/map",
  "/social",
  "/profile",
];

// Install: cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/") || event.request.url.includes("supabase")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ═══════════════════════════════════════════
// Push Notifications
// ═══════════════════════════════════════════

self.addEventListener("push", (event) => {
  let data = { title: "Glupp", body: "Tu as une nouvelle notification !", icon: "/icon-192x192.png", url: "/" };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        url: payload.url || data.url,
      };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url },
    actions: [
      { action: "open", title: "Ouvrir" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("glupp.fr") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});