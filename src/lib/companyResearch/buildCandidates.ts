import { createHash } from "crypto";
import type { CompanyCandidate, CompanyResearchCandidatesResponse } from "./types";
import {
  domainFromEmail,
  extractEmailsFromText,
  extractHttpUrlsFromText,
  hostFromUrl,
  isCorporateDomain,
} from "./parseContact";

function stableCandidateId(c: {
  displayName: string;
  primaryDomain: string | null;
  canonicalUrl: string | null;
}): string {
  return createHash("sha256")
    .update(`${c.displayName}|${c.primaryDomain ?? ""}|${c.canonicalUrl ?? ""}`)
    .digest("hex")
    .slice(0, 24);
}

export type BuildCandidatesInput = {
  companyName: string;
  jd?: string | null;
  emails?: string[];
  companyWebsite?: string | null;
};

export function buildCandidates(input: BuildCandidatesInput): CompanyResearchCandidatesResponse {
  const displayName = input.companyName.trim();
  const jd = input.jd ?? "";
  const fromJdEmails = extractEmailsFromText(jd);
  const mergedEmails = [
    ...new Set([...(input.emails ?? []).map((e) => e.toLowerCase()), ...fromJdEmails]),
  ];

  const domainsFromEmail = new Set<string>();
  for (const e of mergedEmails) {
    const d = domainFromEmail(e);
    if (d && isCorporateDomain(d)) domainsFromEmail.add(d);
  }

  const urlsFromText = extractHttpUrlsFromText(jd);
  if (input.companyWebsite?.trim()) {
    urlsFromText.push(input.companyWebsite.trim());
  }

  const urlHosts = new Set<string>();
  for (const u of urlsFromText) {
    const h = hostFromUrl(u);
    if (h) urlHosts.add(h);
  }

  const candidates: CompanyCandidate[] = [];
  const seen = new Set<string>();

  const push = (c: Omit<CompanyCandidate, "candidateId">) => {
    const candidateId = stableCandidateId({
      displayName: c.displayName,
      primaryDomain: c.primaryDomain,
      canonicalUrl: c.canonicalUrl,
    });
    if (seen.has(candidateId)) return;
    seen.add(candidateId);
    candidates.push({ ...c, candidateId });
  };

  for (const domain of domainsFromEmail) {
    const canonicalUrl = `https://${domain}`;
    push({
      displayName,
      primaryDomain: domain,
      canonicalUrl,
      snippet: `Email domain @${domain} suggests this organization.`,
      sources: [],
      confidence: "high",
    });
  }

  for (const u of urlsFromText) {
    try {
      const host = hostFromUrl(u);
      if (!host) continue;
      const canonicalUrl = u.startsWith("http") ? u : `https://${u}`;
      push({
        displayName,
        primaryDomain: host,
        canonicalUrl,
        snippet: `URL found in notes: ${canonicalUrl}`,
        sources: [{ title: "User-provided URL", url: canonicalUrl }],
        confidence: domainsFromEmail.has(host) ? "high" : "medium",
      });
    } catch {
      /* skip */
    }
  }

  for (const host of urlHosts) {
    if (domainsFromEmail.has(host)) continue;
    const canonicalUrl = `https://${host}`;
    const already = candidates.some((c) => c.primaryDomain === host);
    if (!already) {
      push({
        displayName,
        primaryDomain: host,
        canonicalUrl,
        snippet: `Website host from notes: ${host}`,
        sources: [],
        confidence: "medium",
      });
    }
  }

  if (candidates.length === 0) {
    push({
      displayName,
      primaryDomain: null,
      canonicalUrl: null,
      snippet:
        "No corporate email domain or website was found. Confirm the company name before generating tips.",
      sources: [],
      confidence: "low",
    });
  }

  const derivedEmailDomain =
    domainsFromEmail.size > 0 ? [...domainsFromEmail][0]! : null;
  const derivedWebsiteHost = urlHosts.size > 0 ? [...urlHosts][0]! : null;

  const queryUsed = [displayName, derivedEmailDomain, derivedWebsiteHost]
    .filter(Boolean)
    .join(" ");

  return {
    queryUsed,
    derivedEmailDomain,
    derivedWebsiteHost,
    candidates,
    disclaimers: [
      "Candidates are inferred from your card text (email domain, URLs). Pick the one that matches the employer you met.",
      "This is not a guarantee of company identity; verify before interviews.",
    ],
  };
}
