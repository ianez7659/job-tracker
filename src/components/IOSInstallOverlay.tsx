"use client";

import { useEffect, useState } from "react";

type IOSBrowser = "safari" | "chrome" | "firefox" | "other";

interface IOSContext {
  isIOS: boolean;
  isStandalone: boolean;
  browser: IOSBrowser;
}

const DISMISSED_KEY = "ios-install-overlay-dismissed";

function detectIOS(): IOSContext {
  if (typeof window === "undefined") {
    return { isIOS: false, isStandalone: false, browser: "other" };
  }

  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (!isIOS) return { isIOS: false, isStandalone: false, browser: "other" };

  let browser: IOSBrowser = "other";
  if (/crios/i.test(ua)) browser = "chrome";
  else if (/fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua)) browser = "safari";

  return { isIOS: true, isStandalone, browser };
}

const STEP_ONE: Record<IOSBrowser, React.ReactNode> = {
  safari: (
    <span>
      Tap the{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
        Share
      </span>{" "}
      button <span aria-hidden="true">⬆</span> in the bottom toolbar.
    </span>
  ),
  chrome: (
    <span>
      Tap the{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
        ···
      </span>{" "}
      menu in the bottom-right corner.
    </span>
  ),
  firefox: (
    <span>
      Tap the{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
        ···
      </span>{" "}
      menu at the bottom of the screen.
    </span>
  ),
  other: (
    <span>
      Open your browser&apos;s{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
        Share
      </span>{" "}
      or menu option.
    </span>
  ),
};

const BROWSER_LABEL: Record<IOSBrowser, string> = {
  safari: "Safari",
  chrome: "Chrome",
  firefox: "Firefox",
  other: "",
};

/**
 * Bottom-sheet overlay that guides iOS users to install Jobflow.
 * Detects Safari / Chrome / Firefox and shows the correct first step.
 * Dismissed by the user via the close button.
 */
export function IOSInstallOverlay() {
  const [ctx, setCtx] = useState<IOSContext | null>(null);

  useEffect(() => {
    const detected = detectIOS();
    if (!detected.isIOS) return;

    if (detected.isStandalone) {
      // Running from home screen icon — reset dismissed flag so that
      // if the user later deletes the icon and revisits in browser,
      // the overlay shows again.
      localStorage.removeItem(DISMISSED_KEY);
      return;
    }

    // Browser mode — only show if not previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setCtx(detected);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setCtx(null);
  };

  if (!ctx) return null;

  const label = BROWSER_LABEL[ctx.browser];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install Jobflow on iOS"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-sm rounded-t-2xl bg-white px-6 py-5 shadow-2xl dark:bg-gray-800"
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ✕
      </button>

      <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Install Jobflow
      </p>
      {label && (
        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
          {label}
        </p>
      )}

      <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">1.</span>
          {STEP_ONE[ctx.browser]}
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">2.</span>
          <span>
            Tap{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              Add to Home Screen
            </span>
            .
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">3.</span>
          <span>Tap <span className="font-medium text-indigo-600 dark:text-indigo-400">Add</span> to confirm.</span>
        </li>
      </ol>
    </div>
  );
}
