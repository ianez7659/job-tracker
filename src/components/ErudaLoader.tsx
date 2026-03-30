"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// Mobile debug console: add ?debug=1 to the URL, or set NEXT_PUBLIC_ERUDA=true in env.
export default function ErudaLoader() {
  const searchParams = useSearchParams();
  const envOn = process.env.NEXT_PUBLIC_ERUDA === "true";
  const enabled =
    envOn || searchParams.get("debug") === "1";
  const inited = useRef(false);

  useEffect(() => {
    if (!enabled || inited.current) return;
    inited.current = true;

    let cancelled = false;
    void import("eruda").then((m) => {
      if (!cancelled) m.default.init();
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return null;
}
