"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on mount (HTTPS or localhost only).
 * Place once in the root layout. No UI — side-effect only.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  return null;
}
