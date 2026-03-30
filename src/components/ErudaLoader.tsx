"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function debugEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ERUDA === "true") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function runErudaInit(mod: unknown) {
  const m = mod as { default?: { init?: () => void } };
  const api = m.default ?? mod;
  if (
    api &&
    typeof api === "object" &&
    typeof (api as { init?: () => void }).init === "function"
  ) {
    (api as { init: () => void }).init();
  }
}

/** `?debug=1` on the full URL bar, or NEXT_PUBLIC_ERUDA=true. Icon: small control bottom-right of the page. */
export default function ErudaLoader() {
  const pathname = usePathname();
  const inited = useRef(false);

  useEffect(() => {
    if (!debugEnabled() || inited.current) return;
    inited.current = true;

    let cancelled = false;
    void import("eruda").then((m) => {
      if (!cancelled) runErudaInit(m);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
