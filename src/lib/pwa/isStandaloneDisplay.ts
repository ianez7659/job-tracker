/**
 * True when the app is running as an installed PWA (standalone window).
 * Use to hide install CTAs.
 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  const ios =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  return mq.matches || ios;
}
