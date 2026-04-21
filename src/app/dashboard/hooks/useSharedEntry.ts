"use client";

import { useEffect } from "react";
import { useSharedDataStore } from "@/stores/useSharedDataStore";

/** Keywords that suggest text is a job description */
const JD_KEYWORDS = [
  "responsibilities",
  "requirements",
  "qualifications",
  "experience",
  "salary",
  "benefits",
  "apply",
  "position",
  "job description",
  "we are looking",
  "you will",
  "must have",
  "nice to have",
  "full-time",
  "part-time",
  "remote",
];

function isLikelyJd(text: string): boolean {
  if (text.length >= 200) return true;
  const lower = text.toLowerCase();
  return JD_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Runs once on dashboard mount.
 * 1. Captures ?share_url from the URL (Web Share Target).
 * 2. Attempts silent clipboard read and validates it as a JD.
 * 3. If either succeeds, populates the shared data store.
 */
export function useSharedEntry() {
  const { setSharedData, isSharedEntry } = useSharedDataStore();

  useEffect(() => {
    // Already processed a share in this session — don't re-trigger
    if (isSharedEntry) return;

    async function run() {
      let url = "";
      let jd = "";

      // --- 1. Capture share_url query param (Web Share Target) ---
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const shareUrl = params.get("share_url");
        const shareTitle = params.get("share_title");
        if (shareUrl) {
          url = shareUrl;
          // Clean up query params from the address bar without a navigation
          const clean = window.location.pathname;
          window.history.replaceState(null, "", clean);
        }
        // share_title is informational; not stored separately for now
        void shareTitle;
      }

      // --- 2. Auto-read clipboard (silent; permission errors are swallowed) ---
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          const trimmed = text?.trim() ?? "";
          if (trimmed && isLikelyJd(trimmed)) {
            jd = trimmed;
          }
        }
      } catch {
        // NotAllowedError or NotFoundError — silently ignore
      }

      // --- 3. Persist to store only when we have something useful ---
      if (url || jd) {
        setSharedData(url, jd);
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only once on mount
}
