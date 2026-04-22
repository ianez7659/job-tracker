"use client";

import { useEffect, useState } from "react";

type IOSBrowser = "safari" | "chrome" | "firefox" | "other";
type OverlayState = "install" | "reinstall";

interface IOSContext {
  isIOS: boolean;
  isStandalone: boolean;
  browser: IOSBrowser;
}

/** Saved when the user opens the app in standalone mode (icon exists). */
const INSTALLED_KEY = "ios-pwa-installed";

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
      <span className="font-medium text-indigo-600 dark:text-indigo-400">Share</span>{" "}
      button <span aria-hidden="true">⬆</span> in the bottom toolbar.
    </span>
  ),
  chrome: (
    <span>
      Tap the{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">···</span>{" "}
      menu in the bottom-right corner.
    </span>
  ),
  firefox: (
    <span>
      Tap the{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">···</span>{" "}
      menu at the bottom of the screen.
    </span>
  ),
  other: (
    <span>
      Open your browser&apos;s{" "}
      <span className="font-medium text-indigo-600 dark:text-indigo-400">Share</span>{" "}
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

function InstallSteps({ browser }: { browser: IOSBrowser }) {
  return (
    <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <li className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">1.</span>
        {STEP_ONE[browser]}
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
        <span>
          Tap{" "}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">Add</span>{" "}
          to confirm.
        </span>
      </li>
    </ol>
  );
}

/**
 * Bottom-sheet overlay for iOS users.
 *
 * State A — no install record: guides the user to add the app to home screen.
 * State B — install record exists (standalone was used before): informs the
 *   user the app is installed and offers reinstall steps in case the icon
 *   was deleted.
 *
 * The X button closes the overlay for the current session only.
 * Running in standalone mode saves the install record and hides the overlay.
 */
export function IOSInstallOverlay() {
  const [ctx, setCtx] = useState<IOSContext | null>(null);
  const [overlayState, setOverlayState] = useState<OverlayState>("install");
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    const detected = detectIOS();
    if (!detected.isIOS) return;

    if (detected.isStandalone) {
      // App opened via home screen icon — record install and hide overlay
      localStorage.setItem(INSTALLED_KEY, "1");
      return;
    }

    // Browser mode
    const installed = localStorage.getItem(INSTALLED_KEY);
    setOverlayState(installed ? "reinstall" : "install");
    setCtx(detected);
  }, []);

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
        onClick={() => setCtx(null)}
        aria-label="Dismiss install prompt"
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ✕
      </button>

      {overlayState === "install" ? (
        <>
          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
            Install Jobflow
          </p>
          {label && (
            <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{label}</p>
          )}
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Add to your home screen to use it like an app.
          </p>
          <InstallSteps browser={ctx.browser} />
        </>
      ) : (
        <>
          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
            Jobflow is installed
          </p>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Open Jobflow from your home screen. If you deleted the icon, you can add it again.
          </p>
          <button
            type="button"
            onClick={() => setStepsVisible((v) => !v)}
            className="text-sm text-indigo-600 dark:text-indigo-400 underline mb-3"
          >
            {stepsVisible ? "Hide steps" : "How to reinstall"}
          </button>
          {stepsVisible && (
            <>
              {label && (
                <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">{label}</p>
              )}
              <InstallSteps browser={ctx.browser} />
            </>
          )}
        </>
      )}
    </div>
  );
}
