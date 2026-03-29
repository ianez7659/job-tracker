const VERCEL_BLOB_URL_PATTERN = /blob\.vercel-storage\.com/i;

// After Vercel Blob upload, the public URL can briefly 404/403 for other servers (e.g. PDF worker).
// Poll with a tiny Range GET so match runs after the object is likely readable.
export async function waitUntilVercelBlobLikelyReadable(url: string): Promise<void> {
  if (!VERCEL_BLOB_URL_PATTERN.test(url)) return;
  for (let i = 0; i < 6; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 300 * i));
    }
    try {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 10_000);
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal: ac.signal,
      }).finally(() => clearTimeout(to));
      if (res.ok || res.status === 206) return;
    } catch {
      /* try again */
    }
  }
}
