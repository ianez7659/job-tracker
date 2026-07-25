/**
 * Jobflow service worker.
 *
 * CACHE_NAME is intentionally NOT versioned. Nothing mutable is cached, so
 * there is never anything to invalidate — do not add a version suffix and do
 * not bump this on deploy. Changing it only serves to purge caches written by
 * an older worker (see the activate handler).
 */
const CACHE_NAME = "jobflow-static";

/**
 * Only these are cached. This is an allowlist by design: a blocklist would
 * silently start caching Next.js internals again if their URL scheme changed.
 *
 * Everything else is left alone entirely — no respondWith — so the browser
 * fetches it from the network as usual. That deliberately includes App Router
 * RSC payloads: their request URLs (e.g. /dashboard?_rsc=a1b2c3) carry no
 * build id, so they are byte-identical across deploys. Caching them replays a
 * previous build's payload after a redeploy, which is what used to force a
 * manual cache-version bump on every release.
 */
const STATIC_ASSET = /\.(?:svg|png|jpe?g|webp|gif|ico|json|woff2?|ttf)$/i;

self.addEventListener("install", () => {
  // Nothing is precached: the cache fills lazily on first use. Precaching "/"
  // was dead weight — navigations are never served from the cache.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Next.js internals ship their own immutable cache headers, and API
  // responses must never be cached.
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations and RSC payloads fall out here: their pathnames carry no
  // static asset extension.
  if (!STATIC_ASSET.test(url.pathname)) return;

  // Stale-while-revalidate: answer from cache instantly, refresh in the
  // background. A changed asset therefore lands on the next load without any
  // cache-version bump.
  const networkUpdate = fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => undefined);

  event.waitUntil(networkUpdate);

  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.match(request))
      .then(
        (cached) =>
          cached ??
          networkUpdate.then(
            (response) =>
              response ??
              new Response(null, {
                status: 503,
                statusText: "Service Unavailable",
              }),
          ),
      ),
  );
});
