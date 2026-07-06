const store = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  ensureCleanup(windowMs);

  const now = Date.now();
  const timestamps = store.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    const oldest = valid[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - oldest),
    };
  }

  valid.push(now);
  store.set(key, valid);

  return {
    allowed: true,
    remaining: maxRequests - valid.length,
    retryAfterMs: null,
  };
}

export function rateLimitResponse(retryAfterMs: number | null) {
  const retryAfterSec = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60;
  return new Response(
    JSON.stringify({ message: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}

/** Visible for testing only. */
export function _resetStore() {
  store.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
