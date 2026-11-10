"use client";

import { useEffect } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunkError";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
    // Post-deploy chunk-load failures self-heal with a single hard reload
    // instead of stranding the user on the fallback (esp. iOS standalone PWA,
    // which has no address bar / refresh button).
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-canvas">
      <h1 className="text-lg font-semibold text-ink mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-sm text-ink-muted text-center max-w-md mb-6">
        A client error occurred. Try again, refresh the page, or open the site in your
        device&apos;s main browser if you followed a link from email or chat.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-signal-solid hover:bg-signal-deep text-white px-5 py-2.5 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
