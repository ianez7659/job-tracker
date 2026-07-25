"use client";

import { useEffect } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunkError";

// global-error replaces the ROOT layout when an error escapes it (including
// hydration / root-level failures that route-level error.tsx cannot catch —
// the exact case behind the framework "Application error: a client-side
// exception" screen). It must render its own <html>/<body> and cannot rely on
// app providers or global CSS, so styles are inlined.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#475569",
            maxWidth: "28rem",
            margin: "0 0 1.5rem",
          }}
        >
          A client error occurred. This can happen right after an update — try
          again or refresh the page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "none",
            borderRadius: "0.5rem",
            background: "#4f46e5",
            color: "#ffffff",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
