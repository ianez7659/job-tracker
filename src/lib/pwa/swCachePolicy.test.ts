/**
 * Tests the ACTUAL shipped `public/sw.js` by loading it from disk and running
 * it inside a mocked service worker scope. The service worker cannot import
 * from `src/`, so re-implementing its logic here would let the test drift from
 * the file that ships. Reading the real file makes that impossible.
 */
import fs from "node:fs";
import path from "node:path";

/** Real deployment origin, per docs/design-docs/pwa-chunk-error-remediation.md. */
const ORIGIN = "https://job-tracker-wheat.vercel.app";

type MockResponse = {
  ok: boolean;
  status: number;
  body: string | null;
  clone(): MockResponse;
};

type MockRequest = {
  url: string;
  method: string;
  mode: string;
};

type FetchEvent = {
  request: MockRequest;
  respondWith: jest.Mock;
  waitUntil: jest.Mock;
};

type Listener = (event: unknown) => void;

function makeResponse(
  body: string | null,
  init?: { status?: number },
): MockResponse {
  const status = init?.status ?? 200;
  const response: MockResponse = {
    ok: status >= 200 && status < 300,
    status,
    body,
    clone: () => makeResponse(body, { status }),
  };
  return response;
}

function makeRequest(url: string, init?: { method?: string; mode?: string }): MockRequest {
  return {
    url,
    method: init?.method ?? "GET",
    mode: init?.mode ?? "cors",
  };
}

/** Minimal in-memory stand-in for the CacheStorage API. */
function createCacheStorage() {
  const stores = new Map<string, Map<string, MockResponse>>();

  const cacheFor = (name: string) => {
    let store = stores.get(name);
    if (!store) {
      store = new Map<string, MockResponse>();
      stores.set(name, store);
    }
    return store;
  };

  return {
    stores,
    open: jest.fn(async (name: string) => {
      const store = cacheFor(name);
      return {
        match: async (request: MockRequest) => store.get(request.url),
        put: async (request: MockRequest, response: MockResponse) => {
          store.set(request.url, response);
        },
        addAll: async (urls: string[]) => {
          for (const url of urls) store.set(new URL(url, ORIGIN).toString(), makeResponse(`precached:${url}`));
        },
      };
    }),
    match: jest.fn(async (request: MockRequest) => {
      for (const store of stores.values()) {
        const hit = store.get(request.url);
        if (hit) return hit;
      }
      return undefined;
    }),
    keys: jest.fn(async () => [...stores.keys()]),
    delete: jest.fn(async (name: string) => stores.delete(name)),
  };
}

type Harness = {
  listeners: Map<string, Listener[]>;
  caches: ReturnType<typeof createCacheStorage>;
  fetchMock: jest.Mock;
  skipWaiting: jest.Mock;
  claim: jest.Mock;
  dispatchFetch(request: MockRequest): Promise<FetchEvent>;
  dispatch(type: string, event: Record<string, unknown>): Promise<void>;
};

/** Loads public/sw.js into a fresh mocked ServiceWorkerGlobalScope. */
function loadServiceWorker(): Harness {
  const swPath = path.join(process.cwd(), "public", "sw.js");
  const source = fs.readFileSync(swPath, "utf8");

  const listeners = new Map<string, Listener[]>();
  const cacheStorage = createCacheStorage();
  const fetchMock = jest.fn(async (request: MockRequest) => makeResponse(`network:${request.url}`));
  const skipWaiting = jest.fn();
  const claim = jest.fn(async () => undefined);

  const scope = {
    addEventListener: (type: string, listener: Listener) => {
      const existing = listeners.get(type) ?? [];
      existing.push(listener);
      listeners.set(type, existing);
    },
    location: { origin: ORIGIN },
    skipWaiting,
    clients: { claim },
  };

  // sw.js is a classic worker script: give it exactly the globals it uses.
  const factory = new Function(
    "self",
    "caches",
    "fetch",
    "Response",
    "URL",
    source,
  );
  factory(scope, cacheStorage, fetchMock, makeResponse, URL);

  const dispatch = async (type: string, event: Record<string, unknown>) => {
    for (const listener of listeners.get(type) ?? []) listener(event);
    // Let floating cache writes inside the handlers settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const dispatchFetch = async (request: MockRequest) => {
    const event: FetchEvent = {
      request,
      respondWith: jest.fn(),
      waitUntil: jest.fn(),
    };
    for (const listener of listeners.get("fetch") ?? []) listener(event);
    if (event.respondWith.mock.calls.length > 0) {
      await event.respondWith.mock.calls[0][0];
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    return event;
  };

  return {
    listeners,
    caches: cacheStorage,
    fetchMock,
    skipWaiting,
    claim,
    dispatch,
    dispatchFetch,
  };
}

/** Every URL stored across all caches. */
function cachedUrls(harness: Harness): string[] {
  const urls: string[] = [];
  for (const store of harness.caches.stores.values()) urls.push(...store.keys());
  return urls;
}

describe("public/sw.js — RSC payloads must never be cached", () => {
  /**
   * Reproduction test for the manual CACHE_NAME bump.
   *
   * Next 15.5.13 builds RSC request URLs via setCacheBustingSearchParam
   * (fetch-server-response.js:189). The `_rsc` value is hashed from router
   * state headers only — computeCacheBustingSearchParam (cache-busting-search-
   * param.js:12) includes NO build id — so the same navigation yields a
   * byte-identical URL across deploys. Caching it means the previous build's
   * payload is replayed after a redeploy, which is exactly what forced a
   * CACHE_NAME bump on every deploy.
   */
  it("does not cache an RSC payload request", async () => {
    const sw = loadServiceWorker();

    await sw.dispatchFetch(makeRequest(`${ORIGIN}/dashboard?_rsc=a1b2c3`));

    expect(cachedUrls(sw)).not.toContain(`${ORIGIN}/dashboard?_rsc=a1b2c3`);
  });

  it("does not hand a stale RSC payload back on a later identical request", async () => {
    const sw = loadServiceWorker();
    const url = `${ORIGIN}/dashboard?_rsc=a1b2c3`;

    // First load, e.g. before a deploy.
    sw.fetchMock.mockResolvedValueOnce(makeResponse("old-build-payload"));
    await sw.dispatchFetch(makeRequest(url));

    // Same navigation after a deploy: identical URL, new payload on the network.
    sw.fetchMock.mockResolvedValueOnce(makeResponse("new-build-payload"));
    const second = await sw.dispatchFetch(makeRequest(url));

    // The worker must stay out of the way so the browser gets the new payload.
    expect(second.respondWith).not.toHaveBeenCalled();
  });

  it("ignores an RSC request that has no _rsc value", async () => {
    // computeCacheBustingSearchParam returns '' for a plain navigation fetch,
    // in which case setCacheBustingSearchParam appends a bare `_rsc`.
    const sw = loadServiceWorker();

    const event = await sw.dispatchFetch(makeRequest(`${ORIGIN}/dashboard?_rsc`));

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(cachedUrls(sw)).toHaveLength(0);
  });
});

describe("public/sw.js — requests the worker must not intercept", () => {
  it.each([
    ["a top-level navigation", makeRequest(`${ORIGIN}/dashboard`, { mode: "navigate" })],
    ["a route without an extension", makeRequest(`${ORIGIN}/settings`)],
    ["a Next.js internal chunk", makeRequest(`${ORIGIN}/_next/static/chunks/main-abc123.js`)],
    ["a Next.js internal font", makeRequest(`${ORIGIN}/_next/static/media/inter.woff2`)],
    ["an API route", makeRequest(`${ORIGIN}/api/jobs`)],
    ["the PWA icon endpoint", makeRequest(`${ORIGIN}/api/pwa/icon?size=192`)],
    ["a non-GET request", makeRequest(`${ORIGIN}/manifest.json`, { method: "POST" })],
    ["a cross-origin asset", makeRequest("https://avatars.githubusercontent.com/u/1.png")],
  ])("leaves %s to the browser", async (_label, request) => {
    const sw = loadServiceWorker();

    const event = await sw.dispatchFetch(request);

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(cachedUrls(sw)).toHaveLength(0);
  });
});

describe("public/sw.js — static assets use stale-while-revalidate", () => {
  const assets = [
    `${ORIGIN}/manifest.json`,
    `${ORIGIN}/landing/hero.webp`,
    `${ORIGIN}/icons/badge.svg`,
    `${ORIGIN}/next.svg`,
  ];

  it.each(assets)("caches %s on first request", async (url) => {
    const sw = loadServiceWorker();

    const event = await sw.dispatchFetch(makeRequest(url));

    expect(event.respondWith).toHaveBeenCalled();
    expect(cachedUrls(sw)).toContain(url);
  });

  it("serves the cached copy on the second request", async () => {
    const sw = loadServiceWorker();
    const url = `${ORIGIN}/landing/hero.webp`;

    sw.fetchMock.mockResolvedValueOnce(makeResponse("first"));
    await sw.dispatchFetch(makeRequest(url));

    sw.fetchMock.mockResolvedValueOnce(makeResponse("second"));
    const event = await sw.dispatchFetch(makeRequest(url));
    const served = (await event.respondWith.mock.calls[0][0]) as MockResponse;

    expect(served.body).toBe("first");
  });

  it("revalidates the cache in the background after serving a stale copy", async () => {
    const sw = loadServiceWorker();
    const url = `${ORIGIN}/landing/hero.webp`;

    sw.fetchMock.mockResolvedValueOnce(makeResponse("first"));
    await sw.dispatchFetch(makeRequest(url));

    sw.fetchMock.mockResolvedValueOnce(makeResponse("second"));
    await sw.dispatchFetch(makeRequest(url));

    // Third load picks up what the background revalidation stored — this is
    // what removes the need for a manual cache-version bump.
    sw.fetchMock.mockResolvedValueOnce(makeResponse("third"));
    const event = await sw.dispatchFetch(makeRequest(url));
    const served = (await event.respondWith.mock.calls[0][0]) as MockResponse;

    expect(served.body).toBe("second");
  });

  it("keeps the background revalidation alive via waitUntil", async () => {
    const sw = loadServiceWorker();

    const event = await sw.dispatchFetch(makeRequest(`${ORIGIN}/next.svg`));

    expect(event.waitUntil).toHaveBeenCalled();
  });

  it("does not cache a failed response", async () => {
    const sw = loadServiceWorker();
    sw.fetchMock.mockResolvedValueOnce(makeResponse(null, { status: 404 }));

    await sw.dispatchFetch(makeRequest(`${ORIGIN}/missing.svg`));

    expect(cachedUrls(sw)).toHaveLength(0);
  });

  it("answers 503 instead of rejecting when the network fails and nothing is cached", async () => {
    const sw = loadServiceWorker();
    sw.fetchMock.mockRejectedValueOnce(new Error("offline"));

    const event = await sw.dispatchFetch(makeRequest(`${ORIGIN}/next.svg`));
    const served = (await event.respondWith.mock.calls[0][0]) as MockResponse;

    expect(served.status).toBe(503);
  });

  it("still serves the cached copy when the network fails", async () => {
    const sw = loadServiceWorker();
    const url = `${ORIGIN}/next.svg`;

    sw.fetchMock.mockResolvedValueOnce(makeResponse("cached-copy"));
    await sw.dispatchFetch(makeRequest(url));

    sw.fetchMock.mockRejectedValueOnce(new Error("offline"));
    const event = await sw.dispatchFetch(makeRequest(url));
    const served = (await event.respondWith.mock.calls[0][0]) as MockResponse;

    expect(served.body).toBe("cached-copy");
  });
});

describe("public/sw.js — lifecycle", () => {
  it("takes over immediately so iOS clients are not stranded on the old worker", async () => {
    const sw = loadServiceWorker();

    await sw.dispatch("install", {});
    await sw.dispatch("activate", { waitUntil: (p: Promise<unknown>) => p });

    expect(sw.skipWaiting).toHaveBeenCalled();
    expect(sw.claim).toHaveBeenCalled();
  });

  it("purges the legacy jobflow-v31 cache on activate", async () => {
    const sw = loadServiceWorker();
    // Seed a cache written by the previous, manually versioned worker.
    const legacy = await sw.caches.open("jobflow-v31");
    await legacy.put(makeRequest(`${ORIGIN}/dashboard?_rsc=a1b2c3`), makeResponse("stale"));
    expect(sw.caches.stores.has("jobflow-v31")).toBe(true);

    const pending: Promise<unknown>[] = [];
    await sw.dispatch("activate", {
      waitUntil: (p: Promise<unknown>) => pending.push(p),
    });
    await Promise.all(pending);

    expect(sw.caches.stores.has("jobflow-v31")).toBe(false);
  });

  it("precaches nothing on install", async () => {
    const sw = loadServiceWorker();

    await sw.dispatch("install", { waitUntil: (p: Promise<unknown>) => p });

    expect(cachedUrls(sw)).toHaveLength(0);
  });
});

describe("public/sw.js — cache name is fixed", () => {
  it("carries no version suffix, so deploys never need it edited", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");
    const match = source.match(/const CACHE_NAME = "([^"]+)"/);

    expect(match).not.toBeNull();
    expect(match?.[1]).not.toMatch(/v\d+$/);
  });
});
