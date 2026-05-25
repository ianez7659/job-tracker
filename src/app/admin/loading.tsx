export default function AdminOverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="h-7 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />

      {/* 6-card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-4 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
