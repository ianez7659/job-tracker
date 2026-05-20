interface AdminEmptyStateProps {
  message?: string;
}

export default function AdminEmptyState({
  message = "No data available.",
}: AdminEmptyStateProps) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 py-16">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
