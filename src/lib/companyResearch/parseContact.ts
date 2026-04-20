const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s<>"')]+/gi;

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.jp",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
]);

export function extractEmailsFromText(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const matches = text.match(EMAIL_RE) ?? [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

export function extractHttpUrlsFromText(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const matches = text.match(URL_RE) ?? [];
  const cleaned = matches.map((u) => u.replace(/[.,;]+$/, ""));
  return [...new Set(cleaned)];
}

export function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const d = email.slice(at + 1).toLowerCase().trim();
  return d.length > 0 ? d : null;
}

export function isCorporateDomain(domain: string): boolean {
  return !FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

export function hostFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    return u.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}
