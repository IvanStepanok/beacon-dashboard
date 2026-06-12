/* Kill-switch service worker.
 *
 * This origin (localhost:3000 in dev, possibly the prod host too) has at
 * some point served other prototypes that registered offline-first service
 * workers (e.g. the CrisisMapper competitor clone — a Nuxt PWA that
 * precaches its whole shell and serves it instead of the network). Browsers
 * that still hold such a registration keep showing the dead app forever.
 *
 * Browsers re-fetch the controlling SW script on navigation; byte-diff
 * triggers an update. This replacement worker takes over immediately,
 * wipes every cache, unregisters itself, and reloads open tabs — after
 * which the origin is service-worker-free and always hits the network.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        /* cache API unavailable — nothing to clean */
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
