import Link from "next/link";
import { Pencil, Trash2, Calendar, Building2, Link2 } from "lucide-react";

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt?: string | Date | null;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  url?: string | null;
};

export default function JobCard({
  id,
  title,
  company,
  status,
  appliedAt,
  onDelete,
  onStatusChange,
  url,
}: JobCardProps) {
  const statusColors: Record<string, string> = {
    resume: "bg-gray-200 text-gray-800",
    interview1: "bg-yellow-100 text-yellow-800",
    interview2: "bg-orange-200 text-orange-900",
    interview3: "bg-orange-400 text-orange-900",
    offer: "bg-green-200 text-green-800",
    rejected: "bg-red-200 text-red-800",
  };
  return (
    <li className="relative rounded-xl border border-gray-400 shadow hover:shadow-lg transition bg-white overflow-hidden flex">
      {/* Status Indicator */}
      <div
        className={`w-2 sm:w-3 h-full ${statusColors[status]} absolute left-0 top-0`}
      />

      <div className="p-4 pl-6 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Building2 size={14} />
            {company}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {appliedAt ? new Date(appliedAt).toLocaleDateString() : "No date"}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 flex items-center gap-1 hover:underline"
            >
              <Link2 size={14} />
              Link to original posting
            </a>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[status]}`}
          >
            {status.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <p className="text-sm">Status to:</p>
            <select
              value={status}
              onChange={(e) => onStatusChange?.(id, e.target.value)}
              className="text-xs border px-2 py-1 rounded bg-white"
            >
              <option value="resume">Resume</option>
              <option value="interview1">Interview1</option>
              <option value="interview2">Interview2</option>
              <option value="interview3">Interview3</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t pt-3 mt-4">
          <Link
            href={`/dashboard/jobs/edit/${id}`}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Pencil size={14} />
            Edit
          </Link>
          <button
            onClick={async () => {
              const ok = confirm("Do you really want to delete this job?");
              if (!ok) return;
              const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ softDelete: true }),
              });
              if (res.ok) {
                onDelete(id);
              } else {
                alert("Failed to delete job");
              }
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
