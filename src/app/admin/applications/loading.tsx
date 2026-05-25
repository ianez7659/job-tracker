export default function AdminApplicationsLoading() {
  return (
    <div className="space-y-4">
      {/* Page header skeleton */}
      <div className="h-7 w-44 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-7 flex-1 min-w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="ml-auto h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        {/* Header row */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex gap-4">
            {[120, 160, 80, 80, 90, 90, 40, 40, 50].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Body rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-100 bg-white px-4 py-3 last:border-0 dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="space-y-1.5" style={{ width: 120 }}>
              <div className="h-3.5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="space-y-1.5" style={{ width: 160 }}>
              <div className="h-3.5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            {[80, 80, 90, 90, 40, 40, 50].map((w, j) => (
              <div key={j} className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
