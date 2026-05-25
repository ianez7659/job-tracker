"use client";

export default function AdminOverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Failed to load overview data.
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {error.message ?? "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
      >
        Try again
      </button>
    </div>
  );
}
