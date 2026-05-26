export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="h-7 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-52 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
