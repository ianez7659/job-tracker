"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when running in iOS Safari (not already installed as standalone).
 * Only evaluated client-side to avoid SSR navigator access.
 */
function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
  const isStandalone = "standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && isSafari && !isStandalone;
}

/**
 * Overlay that guides iOS Safari users to install the app via the Share menu.
 * Auto-dismissed after the user taps the close button.
 * Rendered only on iOS Safari and only when the app is not already installed.
 */
export function IOSInstallOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIOSSafari()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install Jobflow on iOS"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-sm rounded-t-2xl bg-white px-6 py-5 shadow-2xl dark:bg-gray-800"
    >
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss install prompt"
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ✕
      </button>

      <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Install Jobflow
      </p>

      <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-base">1.</span>
          <span>
            Tap the{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              Share
            </span>{" "}
            button{" "}
            <span aria-hidden="true">&#x25F3;</span> in the Safari toolbar.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-base">2.</span>
          <span>
            Scroll down and tap{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              Add to Home Screen
            </span>
            .
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-base">3.</span>
          <span>Tap Add in the top-right corner.</span>
        </li>
      </ol>
    </div>
  );
}
