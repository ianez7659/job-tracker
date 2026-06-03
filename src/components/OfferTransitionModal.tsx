"use client";

import { useState } from "react";
import { inputBase, selectBase, labelBase } from "@/lib/styles";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  SALARY_RANGES,
  type EmploymentType,
  type WorkArrangement,
  type SalaryRange,
} from "@/domains/hired/constants";

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  on_site: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const SALARY_RANGE_LABELS: Record<SalaryRange, string> = {
  not_disclosed: "Prefer not to say",
  under_40k: "Under $40K",
  "40k_50k": "$40K – $50K",
  "50k_60k": "$50K – $60K",
  "60k_70k": "$60K – $70K",
  "70k_80k": "$70K – $80K",
  "80k_plus": "$80K+",
};

export type OfferFormData = {
  offerDate: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement | "";
  salaryRange: SalaryRange;
};

type Props = {
  companyName: string;
  onConfirm: (data: OfferFormData) => Promise<void>;
  onCancel: () => void;
};

export default function OfferTransitionModal({ companyName, onConfirm, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<OfferFormData>({
    offerDate: today,
    employmentType: "full_time",
    workArrangement: "",
    salaryRange: "not_disclosed",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.offerDate) {
      setError("Offer date is required.");
      return;
    }
    if (!form.employmentType) {
      setError("Employment type is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-white dark:border-emerald-700 dark:bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="rounded-t-xl bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-700 px-5 py-4">
          <h2
            id="offer-modal-title"
            className="text-lg font-bold text-emerald-900 dark:text-emerald-100"
          >
            Offer received — congrats!
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
            Tell us about the offer from <strong>{companyName}</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Offer Date */}
          <div>
            <label htmlFor="offerDate" className={labelBase}>
              Offer date <span className="text-red-500">*</span>
            </label>
            <input
              id="offerDate"
              name="offerDate"
              type="date"
              value={form.offerDate}
              onChange={handleChange}
              required
              className={inputBase}
            />
          </div>

          {/* Employment Type */}
          <div>
            <label htmlFor="employmentType" className={labelBase}>
              Employment type <span className="text-red-500">*</span>
            </label>
            <select
              id="employmentType"
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
              required
              className={selectBase}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EMPLOYMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Work Arrangement */}
          <div>
            <label htmlFor="workArrangement" className={labelBase}>
              Work arrangement <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="workArrangement"
              name="workArrangement"
              value={form.workArrangement}
              onChange={handleChange}
              className={selectBase}
            >
              <option value="">Not specified</option>
              {WORK_ARRANGEMENTS.map((a) => (
                <option key={a} value={a}>
                  {WORK_ARRANGEMENT_LABELS[a]}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Range */}
          <div>
            <label htmlFor="salaryRange" className={labelBase}>
              Salary range <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="salaryRange"
              name="salaryRange"
              value={form.salaryRange}
              onChange={handleChange}
              className={selectBase}
            >
              {SALARY_RANGES.map((r) => (
                <option key={r} value={r}>
                  {SALARY_RANGE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              {loading ? "Saving…" : "Confirm Offer"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
