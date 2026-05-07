"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isStandaloneDisplay } from "@/lib/pwa/isStandaloneDisplay";

/** Extends the standard Event type with the non-standard BeforeInstallPrompt API (Chromium only). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallButtonProps = {
  className?: string;
};

/**
 * Shows an "Install App" button when the browser fires `beforeinstallprompt`.
 * Hidden when already running as an installed PWA (standalone).
 * Chromium-only (Chrome, Edge, Samsung Internet). Returns null on unsupported browsers.
 * For iOS Safari, use <IOSInstallOverlay /> instead.
 */
export function InstallButton({ className }: InstallButtonProps = {}) {
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const check = () => setInstalled(isStandaloneDisplay());
    check();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;
  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
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
