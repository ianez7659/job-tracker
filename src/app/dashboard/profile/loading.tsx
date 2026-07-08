export default function ProfileLoading() {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Avatar skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* Form fields skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
