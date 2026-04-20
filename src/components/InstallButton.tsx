"use client";

import { useEffect, useState } from "react";

/** Extends the standard Event type with the non-standard BeforeInstallPrompt API (Chromium only). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows an "Install App" button when the browser fires `beforeinstallprompt`.
 * Chromium-only (Chrome, Edge, Samsung Internet). Returns null on unsupported browsers.
 * For iOS Safari, use <IOSInstallOverlay /> instead.
 */
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all"
      aria-label="Install Jobflow app"
    >
      Install App
    </button>
  );
}
