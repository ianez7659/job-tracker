interface AdminEmptyStateProps {
  message?: string;
}

export default function AdminEmptyState({
  message = "No data available.",
}: AdminEmptyStateProps) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900/50">
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}
