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
import type { PendingOffer } from "@/app/api/hired/offers/pending/route";

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

type DetailForm = {
  offerDate: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement | "";
  salaryRange: SalaryRange;
};

type Props = {
  offers: PendingOffer[];
  onDone: () => void;
};

export default function OfferCompletionFlow({ offers, onDone }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  // For a single offer skip selection; for multiple offers start at step 1
  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    offers.length === 1 ? offers[0].offerId : "",
  );
  const [step, setStep] = useState<"select" | "details">(
    offers.length === 1 ? "details" : "select",
  );
  const [form, setForm] = useState<DetailForm>({
    offerDate: today,
    employmentType: "full_time",
    workArrangement: "",
    salaryRange: "not_disclosed",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOffer = offers.find((o) => o.offerId === selectedOfferId);

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
  };

  const handleNext = () => {
    if (!selectedOfferId) {
      setError("Please select the offer you accepted.");
      return;
    }
    setError(null);
    setStep("details");
  };

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
      const res = await fetch(`/api/hired/offers/${selectedOfferId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerDate: form.offerDate,
          employmentType: form.employmentType,
          workArrangement: form.workArrangement || undefined,
          salaryRange: form.salaryRange,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      onDone();
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
      aria-labelledby="offer-completion-title"
    >
      <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-white dark:border-emerald-700 dark:bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="rounded-t-xl bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-700 px-5 py-4">
          <h2
            id="offer-completion-title"
            className="text-lg font-bold text-emerald-900 dark:text-emerald-100"
          >
            Complete your offer details
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
            {step === "select"
              ? "You have multiple pending offers. Select the one you accepted."
              : selectedOffer
                ? `Tell us about your offer from ${selectedOffer.company}.`
                : "Fill in the missing details for your offer."}
          </p>
        </div>

        {/* Step 1: Select offer (multiple offers only) */}
        {step === "select" && (
          <div className="p-5 space-y-4">
            <fieldset>
              <legend className={labelBase}>Which offer did you accept?</legend>
              <div className="mt-2 space-y-2">
                {offers.map((offer) => (
                  <label
                    key={offer.offerId}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selectedOfferId === offer.offerId
                        ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-600 dark:bg-slate-700/40 dark:hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="offerId"
                      value={offer.offerId}
                      checked={selectedOfferId === offer.offerId}
                      onChange={() => handleSelectOffer(offer.offerId)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {offer.company}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{offer.title}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Fill details */}
        {step === "details" && (
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
                Work arrangement{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
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
                Salary range{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
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

            <div className="flex gap-3 pt-1">
              {offers.length > 1 && (
                <button
                  type="button"
                  onClick={() => { setError(null); setStep("select"); }}
                  disabled={loading}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                {loading ? "Saving…" : "Confirm Offer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
