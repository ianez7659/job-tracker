export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col p-4 sm:px-6 sm:py-2 space-y-4">
      {/* Header skeleton */}
      <div className="animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 h-36 w-full" />

      {/* Main card skeleton */}
      <div className="animate-pulse flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
