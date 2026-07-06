/** Block obvious private / local targets for server-side fetch. */

export function isSafePublicHttpUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return false;
    if (host === "0.0.0.0") return false;
    if (host.endsWith(".local")) return false;

    // IPv6 loopback and private ranges
    const bare = host.startsWith("[") ? host.slice(1, -1) : host;
    if (bare === "::1" || bare === "::") return false;
    if (/^f[cd][0-9a-f]{2}:/i.test(bare)) return false; // fc00::/7 (ULA)
    if (/^fe[89ab][0-9a-f]:/i.test(bare)) return false; // fe80::/10 (link-local)

    // IPv4 private ranges (simple checks)
    const parts = host.split(".").map((p) => parseInt(p, 10));
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      const [a, b] = parts;
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 0) return false;
      if (a === 169 && b === 254) return false;
      if (a === 192 && b === 168) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
}
