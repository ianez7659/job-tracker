/** Ephemeral company research (not persisted). */

export type CompanyCandidate = {
  candidateId: string;
  displayName: string;
  primaryDomain: string | null;
  canonicalUrl: string | null;
  snippet: string;
  sources: { title: string; url: string }[];
  confidence: "high" | "medium" | "low";
};

export type CompanyResearchCandidatesResponse = {
  queryUsed: string;
  derivedEmailDomain: string | null;
  derivedWebsiteHost: string | null;
  candidates: CompanyCandidate[];
  disclaimers: string[];
};

export type EmphasisPoint = {
  text: string;
  basis: "page_excerpt" | "general";
};

export type CompanyInterviewReportResponse = {
  entity: {
    displayName: string;
    primaryDomain: string | null;
    canonicalUrl: string | null;
  };
  emphasisPoints: EmphasisPoint[];
  topicsToVerify: string[];
  disclaimers: string[];
  groundingExcerptUsed: boolean;
};
