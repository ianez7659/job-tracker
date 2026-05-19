type Accent = "default" | "green" | "yellow" | "red";

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  hint?: string;
  accent?: Accent;
}

const accentClasses: Record<Accent, string> = {
  default: "text-gray-100",
  green: "text-emerald-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

export default function AdminMetricCard({
  title,
  value,
  description,
  hint,
  accent = "default",
}: AdminMetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accentClasses[accent]}`}>
        {value}
      </p>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      {hint && <p className="mt-2 text-xs text-gray-600">{hint}</p>}
    </div>
  );
}
