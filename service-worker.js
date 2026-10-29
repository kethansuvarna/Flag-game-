/*
 * Louise's Flag Game - Service Worker
 *
 * Strategy:
 *  - The HTML shell (this page itself) is "network-first, falling back to
 *    cache": online, you always get the latest deployed version; offline,
 *    you get the last version that successfully loaded. This is what
 *    prevents the app from getting permanently stuck on stale HTML after
 *    an update is deployed.
 *  - Everything else needed to actually play (the D3/topojson libraries,
 *    the world map data, Google Fonts, the manifest, and the icons) is
 *    "cache-first, falling back to network": once it has loaded
 *    successfully one time, it is served instantly from cache afterwards
 *    and works fully offline, while still being refreshed in the
 *    background whenever the network is available.
 *  - Non-GET requests and the Firebase realtime-database traffic (used
 *    only for the optional shared leaderboard) are never cached - that
 *    data is inherently live/online-only, and caching it would be both
 *    pointless and could leak stale leaderboard data.
 *
 * IMPORTANT: bump CACHE_VERSION every time you redeploy changed files.
 * Old caches are deleted automatically on activate, and skipWaiting() +
 * clients.claim() below mean a redeploy takes effect on next launch
 * rather than leaving the installed app stuck on an old version.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = "flag-game-cache-" + CACHE_VERSION;

// Same-origin files that make up the installable "app shell". Paths are
// relative so this works unmodified under a GitHub Pages project path
// like /Flag-game-/ as well as at a domain root.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon-180.png"
];

// Third-party origins that are safe (and useful) to cache for offline play.
// Firebase's realtime-database traffic is deliberately NOT in this list.
const CACHEABLE_CROSS_ORIGIN_HOSTS = [
  "cdn.jsdelivr.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "www.gstatic.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can individually so one missing/renamed file (e.g.
      // if you haven't added icons yet) doesn't abort the whole install.
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[service-worker] could not precache", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("flag-game-cache-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigationOrHtmlRequest(request) {
  if (request.mode === "navigate") return true;
  const url = new URL(request.url);
  return url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
}

function isCacheableCrossOrigin(url) {
  return CACHEABLE_CROSS_ORIGIN_HOSTS.some((host) => url.hostname === host);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever cache simple GET requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never touch Firebase's live database traffic (or anything else we
  // haven't explicitly allow-listed) - let it go straight to the network.
  if (!sameOrigin && !isCacheableCrossOrigin(url)) return;

  if (sameOrigin && isNavigationOrHtmlRequest(request)) {
    // Network-first for the app's own HTML, so a redeploy is picked up
    // the next time the player has a connection.
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else (JS libraries, map JSON, fonts, icons,
  // manifest): instant + offline-capable once cached, refreshed in the
  // background whenever a network fetch succeeds.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          // Cache opaque (no-cors) cross-origin responses too - we can't
          // read them, but the browser can still serve them from cache.
          if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => undefined);

      return cached || networkFetch;
    })
  );
});
