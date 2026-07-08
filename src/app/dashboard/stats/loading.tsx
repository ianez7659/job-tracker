export default function StatsLoading() {
  return (
    <div className="space-y-6 p-4">
      {/* Page title */}
      <div className="h-7 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-slate-700" />

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-600 pb-1">
        <div className="h-8 w-20 animate-pulse rounded-t bg-gray-200 dark:bg-slate-700" />
        <div className="h-8 w-24 animate-pulse rounded-t bg-gray-100 dark:bg-slate-800" />
      </div>

      {/* Bar chart skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
            <div
              className="h-6 animate-pulse rounded bg-gray-100 dark:bg-slate-800"
              style={{ width: `${60 - i * 10}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
