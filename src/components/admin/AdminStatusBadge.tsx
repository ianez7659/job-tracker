import type { HubStatus } from "@/domains/admin/types";

const CONFIG: Record<
  NonNullable<HubStatus>,
  { label: string; className: string }
> = {
  STUDENT: {
    label: "Student",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50",
  },
  ALUMNI: {
    label: "Alumni",
    className:
      "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-700/50",
  },
  STAFF: {
    label: "Staff",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50",
  },
};

interface AdminStatusBadgeProps {
  status: HubStatus;
}

export default function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
        —
      </span>
    );
  }

  const { label, className } = CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
