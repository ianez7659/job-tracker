import type { HubStatus } from "@/domains/admin/types";

const CONFIG: Record<
  NonNullable<HubStatus>,
  { label: string; className: string }
> = {
  STUDENT: {
    label: "Student",
    className: "bg-blue-900/40 text-blue-300 ring-blue-700/50",
  },
  ALUMNI: {
    label: "Alumni",
    className: "bg-purple-900/40 text-purple-300 ring-purple-700/50",
  },
  STAFF: {
    label: "Staff",
    className: "bg-amber-900/40 text-amber-300 ring-amber-700/50",
  },
};

interface AdminStatusBadgeProps {
  status: HubStatus;
}

export default function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-800 text-gray-400 ring-gray-700">
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
