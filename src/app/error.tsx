"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-200 to-slate-50 dark:from-slate-950 dark:to-slate-800">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
        A client error occurred. Try again, refresh the page, or open the site in your
        device&apos;s main browser if you followed a link from email or chat.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-5 py-2.5 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
