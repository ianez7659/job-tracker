"use client";

import { useRef, useState } from "react";
import { X, Camera, ImageIcon, Loader2 } from "lucide-react";
import type { Job } from "@/generated/prisma";
import { POSITION_LEVELS } from "@/lib/constants/positions";
import {
  formatBusinessCardNotes,
  type BusinessCardFields,
} from "@/lib/businessCardExtract";
import { inputBase, selectBase, labelBase } from "@/lib/styles";

type Props = {
  onClose: () => void;
  onSwitchToStandard: () => void;
  onCreated: (job: Job) => void;
};

const RESIZE_MAX_WIDTH = 1600;
const RESIZE_MAX_HEIGHT = 1600;
const RESIZE_QUALITY = 0.82;

async function resizeForUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    RESIZE_MAX_WIDTH / bitmap.width,
    RESIZE_MAX_HEIGHT / bitmap.height,
  );
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", RESIZE_QUALITY);
  });
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function SimpleNewJobModal({
  onClose,
  onSwitchToStandard,
  onCreated,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [titleLevel, setTitleLevel] = useState<string>("Entry");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);

  const applyExtractedFields = (fields: BusinessCardFields) => {
    if (fields.company) setCompany(fields.company);
    setNotes(formatBusinessCardNotes(fields));
  };

  const runExtract = async (file: File) => {
    setExtractError(null);
    setExtracting(true);
    try {
      const resized = await resizeForUpload(file);
      const fd = new FormData();
      fd.append("image", resized);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const res = await fetch("/api/jobs/extract-business-card", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        fields?: BusinessCardFields;
      };
      if (!res.ok) {
        setExtractError(data.message || "Could not read the card");
        return;
      }
      if (data.fields) applyExtractedFields(data.fields);
    } catch (err) {
      setExtractError(
        err instanceof DOMException && err.name === "AbortError"
          ? "Extraction timed out. Please try again with a clearer photo."
          : "Network error",
      );
    } finally {
      setExtracting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void runExtract(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const co = company.trim();
    if (!co) {
      alert("Company name is required.");
      return;
    }
    if (!titleLevel) {
      alert("Select a position level.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/jobs/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleLevel,
          company: co,
          notes: notes.trim() || null,
          nextAction: nextAction.trim() || null,
        }),
      });

      const raw = await res.text();
      type Body = { message?: string; job?: Job };
      let body: Body = {};
      try {
        body = raw ? (JSON.parse(raw) as Body) : {};
      } catch {
        throw new Error(raw || `HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(body.message || "Failed to create job");
      }
      if (!body.job || typeof body.job !== "object" || !("id" in body.job)) {
        throw new Error("Server did not return the new job.");
      }
      onCreated(body.job);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simple-new-job-title"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-600 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600">
          <h2 id="simple-new-job-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Simple add
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Photos are used only to read text (not stored). Flow: shoot → review → save.
          </p>

          <input
            ref={cameraInputRef}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={onFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={extracting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium text-sm"
            >
              {extracting ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={extracting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              <ImageIcon size={20} />
              Choose image
            </button>
          </div>

          {extractError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {extractError}
            </p>
          )}

          <div>
            <label htmlFor="simple-company" className={labelBase}>
              Company name <span className="text-red-500">*</span>
            </label>
            <input
              id="simple-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputBase}
              required
              placeholder="From card or type here"
            />
          </div>

          <div>
            <label htmlFor="simple-title" className={labelBase}>
              Position level <span className="text-red-500">*</span>
            </label>
            <select
              id="simple-title"
              value={titleLevel}
              onChange={(e) => setTitleLevel(e.target.value)}
              className={selectBase}
              required
            >
              {POSITION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="simple-notes" className={labelBase}>
              Extracted notes
            </label>
            <textarea
              id="simple-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className={`${inputBase} resize-y min-h-[7rem] text-sm`}
              placeholder="AI-filled after photo"
            />
          </div>

          <div>
            <label htmlFor="simple-next-action" className={labelBase}>
              Next action (optional)
            </label>
            <input
              id="simple-next-action"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className={inputBase}
              placeholder="e.g. Follow up this Friday"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || extracting}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm"
            >
              {saving ? "Saving…" : "Save card"}
            </button>
            <button
              type="button"
              onClick={onSwitchToStandard}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium"
            >
              Standard form
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close simple add"
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
