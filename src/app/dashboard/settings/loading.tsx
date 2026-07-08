export default function SettingsLoading() {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Page title */}
      <div className="h-7 w-28 animate-pulse rounded-md bg-gray-200 dark:bg-slate-700" />

      {/* Theme section */}
      <div className="animate-pulse rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
        <div className="h-5 w-36 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-lg bg-gray-100 dark:bg-slate-700" />
          <div className="h-10 w-28 rounded-lg bg-gray-100 dark:bg-slate-700" />
        </div>
      </div>

      {/* Notification section */}
      <div className="animate-pulse rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
        <div className="h-5 w-44 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-56 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
          <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
