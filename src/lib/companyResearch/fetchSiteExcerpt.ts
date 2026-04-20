import { isSafePublicHttpUrl } from "./ssrf";

const MAX_BYTES = 48_000;
const TIMEOUT_MS = 8_000;

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best-effort fetch of public page text for grounding. Returns null on failure.
 */
export async function fetchPublicPageExcerpt(urlStr: string): Promise<string | null> {
  if (!isSafePublicHttpUrl(urlStr)) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "JobflowCompanyResearch/1.0 (interview prep; +https://example.invalid)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const plain = stripHtmlToText(text);
    return plain.length > 80 ? plain.slice(0, 12_000) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
