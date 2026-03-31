"use client";

import { useCallback, useMemo, useState } from "react";
import { Clipboard } from "lucide-react";

type Props = {
  onText: (text: string) => void;
  className?: string;
};

function describeClipboardError(err: unknown): string {
  const name = err && typeof err === "object" && "name" in err ? String((err as any).name) : "";
  if (name === "NotAllowedError") return "Clipboard access was blocked. Tap in the browser and allow paste access, or paste manually.";
  if (name === "NotFoundError") return "Clipboard is empty.";
  return "Could not read from clipboard. Please paste manually.";
}

/** Reads text from clipboard on user tap and passes it to `onText`. */
export function ClipboardPasteButton({ onText, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "reading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const canUseClipboard = useMemo(() => typeof navigator !== "undefined" && !!navigator.clipboard?.readText, []);

  const handleClick = useCallback(async () => {
    if (!canUseClipboard) {
      setState("error");
      setMessage("Clipboard paste is not supported here. Please paste manually.");
      return;
    }
    setState("reading");
    setMessage("");
    try {
      const text = (await navigator.clipboard.readText()) ?? "";
      const trimmed = text.trim();
      if (!trimmed) {
        setState("error");
        setMessage("Clipboard is empty. Copy the job description first.");
        return;
      }
      onText(trimmed);
      setState("ok");
      setMessage("Pasted from clipboard.");
      window.setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 2500);
    } catch (e) {
      setState("error");
      setMessage(describeClipboardError(e));
    }
  }, [canUseClipboard, onText]);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "reading"}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Paste job description from clipboard"
      >
        <Clipboard className="size-4" aria-hidden />
        {state === "reading" ? "Pasting…" : "Paste"}
      </button>
      {message ? (
        <span
          className={
            state === "error"
              ? "text-xs text-amber-700 dark:text-amber-300"
              : "text-xs text-emerald-700 dark:text-emerald-300"
          }
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </span>
      ) : null}
    </span>
  );
}

