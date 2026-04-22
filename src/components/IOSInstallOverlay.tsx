"use client";

import { useEffect, useState } from "react";

type IOSBrowser = "safari" | "chrome" | "firefox" | "google" | "other";

interface IOSContext {
  isIOS: boolean;
  isStandalone: boolean;
  browser: IOSBrowser;
}

function detectIOS(): IOSContext {
  if (typeof window === "undefined") {
    return { isIOS: false, isStandalone: false, browser: "other" };
  }

  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches);

  if (!isIOS) return { isIOS: false, isStandalone: false, browser: "other" };

  let browser: IOSBrowser = "other";
  if (/GSA\//i.test(ua)) browser = "google";
  else if (/crios/i.test(ua)) browser = "chrome";
  else if (/fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua)) browser = "safari";

  return { isIOS: true, isStandalone, browser };
}

function openInChrome() {
  const url = window.location.href.replace(/^https?:\/\//, "");
  window.location.href = `googlechromes://${url}`;
}

function openInSafari() {
  const url = window.location.href.replace(/^https?:\/\//, "");
  window.location.href = `x-web-search://${url}`;
}

function GoogleSteps() {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Adding to Home Screen is not supported in the Google app.
        <br />
        Please open Jobflow in Safari or Chrome to install it.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openInSafari}
          className="flex-1 rounded-lg border border-indigo-300 dark:border-indigo-700 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
        >
          Open in Safari
        </button>
        <button
          type="button"
          onClick={openInChrome}
          className="flex-1 rounded-lg border border-indigo-300 dark:border-indigo-700 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
        >
          Open in Chrome
        </button>
      </div>
    </div>
  );
}

function InstallSteps({ browser }: { browser: IOSBrowser }) {
  if (browser === "google") {
    return <GoogleSteps />;
  }

  const stepOne: Record<Exclude<IOSBrowser, "google">, React.ReactNode> = {
    safari: (
      <span>
        Tap the{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">
          Share button
        </span>{" "}
        in the bottom toolbar.
      </span>
    ),
    chrome: (
      <span>
        Tap the{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">
          Share button
        </span>{" "}
        on the right side of the address bar.
      </span>
    ),
    firefox: (
      <span>
        Tap the{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">
          Share button
        </span>{" "}
        in the toolbar.
      </span>
    ),
    other: (
      <span>
        Tap the{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">
          Share button
        </span>{" "}
        in your browser.
      </span>
    ),
  };

  return (
    <ol className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <li className="flex items-start gap-2">
        <span className="flex-shrink-0">1.</span>
        {stepOne[browser as Exclude<IOSBrowser, "google">]}
      </li>
      <li className="flex items-start gap-2">
        <span className="flex-shrink-0">2.</span>
        <span>
          Tap{" "}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            Add to Home Screen
          </span>
          .
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="flex-shrink-0">3.</span>
        <span>
          Tap{" "}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            Add
          </span>{" "}
          to confirm.
        </span>
      </li>
    </ol>
  );
}

/**
 * Bottom-sheet overlay for iOS users (browser mode only).
 *
 * - Already installed section: reminds users to open via icon.
 * - Not installed section: collapsible install steps, browser-specific.
 * - Google app: redirects to Safari or Chrome (no Add to Home Screen support).
 * - X closes for current session only (no persistent dismissal).
 */
export function IOSInstallOverlay() {
  const [ctx, setCtx] = useState<IOSContext | null>(null);
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    const detected = detectIOS();
    if (!detected.isIOS) return;
    if (detected.isStandalone) return;
    setCtx(detected);
  }, []);

  if (!ctx) return null;

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

      {/* Already installed */}
      <div className="mb-4 rounded-lg bg-gray-50 dark:bg-slate-700 px-4 py-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Already added to your home screen?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Open Jobflow from the home screen icon instead of the browser.
        </p>
      </div>

      {/* Not installed yet */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Not installed yet?
        </p>
        <button
          type="button"
          onClick={() => setStepsVisible((v) => !v)}
          className="text-sm text-indigo-600 dark:text-indigo-400 underline"
        >
          {stepsVisible ? "Hide steps" : "How to install"}
        </button>
        {stepsVisible && <InstallSteps browser={ctx.browser} />}
      </div>
    </div>
  );
}
