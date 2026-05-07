"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isStandaloneDisplay } from "@/lib/pwa/isStandaloneDisplay";

/** Extends the standard Event type with the non-standard BeforeInstallPrompt API (Chromium only). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallButtonProps = {
  className?: string;
  /** External deferredPrompt captured by a parent (e.g. NavBar).
   *  When provided, the component skips its own window listener and uses this instead. */
  deferredPrompt?: BeforeInstallPromptEvent | null;
  /** Called when the user accepts the install prompt (parent should clear its state). */
  onInstalled?: () => void;
};

/**
 * Shows an "Install App" button when the browser fires `beforeinstallprompt`.
 * Hidden when already running as an installed PWA (standalone).
 * Chromium-only (Chrome, Edge, Samsung Internet). Returns null on unsupported browsers.
 * For iOS Safari, use <IOSInstallOverlay /> instead.
 *
 * Two modes:
 * - Controlled: pass `deferredPrompt` + `onInstalled` from a parent that captured the event.
 * - Uncontrolled: omit both props — component listens on `window` itself (use when always mounted).
 */
export function InstallButton({ className, deferredPrompt: externalPrompt, onInstalled }: InstallButtonProps = {}) {
  const controlled = externalPrompt !== undefined;

  const [installed, setInstalled] = useState(false);
  const [internalPrompt, setInternalPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const check = () => setInstalled(isStandaloneDisplay());
    check();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  // Only register window listener in uncontrolled mode
  useEffect(() => {
    if (controlled) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInternalPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [controlled]);

  const prompt = controlled ? externalPrompt : internalPrompt;

  if (installed) return null;
  if (!prompt) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      if (controlled) {
        onInstalled?.();
      } else {
        setInternalPrompt(null);
      }
    }
  };

  const base =
    "flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all";
  return (
    <button
      type="button"
      onClick={handleInstall}
      className={className ? `${base} ${className}` : base}
      aria-label="Install Jobflow app"
    >
      <Download size={18} className="flex-shrink-0" aria-hidden />
      Install App
    </button>
  );
}
