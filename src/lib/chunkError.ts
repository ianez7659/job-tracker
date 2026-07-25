// Post-deploy chunk-load self-heal.
//
// After a new deployment, the old build's content-hashed JS chunks under
// /_next/static are removed. A client still running the old build requests a
// missing chunk (soft navigation / lazy import) and throws a ChunkLoadError,
// which surfaces as the framework "Application error" screen. A single hard
// reload pulls the latest HTML + asset manifest and recovers.
//
// This is the deploy-layer relief (Phase 1). It is independent of the service
// worker and complements Vercel Skew Protection.

const CHUNK_ERROR_PATTERNS = [
  "ChunkLoadError",
  "Loading chunk",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  // Safari / iOS wording for a failed module script fetch.
  "Importing a module script failed",
];

// sessionStorage key + cooldown for the reload guard. A timestamp (not a
// boolean) lets a genuinely broken deploy be blocked from looping while still
// allowing a later deploy in the same long-lived tab (common on iOS PWAs) to
// self-heal again once the cooldown has passed.
const RELOAD_TS_KEY = "chunk-reload-ts";
export const RELOAD_COOLDOWN_MS = 10_000;

function readMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

function readName(error: unknown): string {
  if (typeof error === "object" && error !== null && "name" in error) {
    return String((error as { name?: unknown }).name ?? "");
  }
  return "";
}

/** True when `error` looks like a failed dynamic chunk / module fetch. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const haystack = `${readName(error)} ${readMessage(error)}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern));
}

/**
 * Trigger at most one hard reload within the cooldown window to recover from a
 * chunk-load error. Guarded by sessionStorage so a persistently-broken deploy
 * cannot reload-loop. `now` and `reload` are injectable for testing.
 *
 * Returns true if a reload was scheduled.
 */
export function reloadOnceForChunkError(
  now: number = Date.now(),
  reload: () => void = () => window.location.reload(),
): boolean {
  if (typeof window === "undefined") return false;

  let last = 0;
  try {
    last = Number(window.sessionStorage.getItem(RELOAD_TS_KEY)) || 0;
  } catch {
    // sessionStorage unavailable (private mode / disabled). Without a guard we
    // cannot prevent a reload loop, so bail rather than risk one.
    return false;
  }

  // last === 0 means no prior reload recorded → allow. Otherwise enforce the
  // cooldown so a persistently-broken deploy cannot reload-loop.
  if (last > 0 && now - last < RELOAD_COOLDOWN_MS) return false;

  try {
    window.sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  } catch {
    return false;
  }

  reload();
  return true;
}
