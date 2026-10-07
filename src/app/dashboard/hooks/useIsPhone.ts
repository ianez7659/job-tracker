import { useEffect, useState } from "react";

/** Phone layout = below `md`, the same width where the bottom navigation replaces the sidebar. */
export const PHONE_QUERY = "(max-width: 767px)";

/**
 * True on phone-width viewports. `null` until mounted (server render and first
 * client paint), so callers can avoid acting on a guess.
 */
export function useIsPhone(): boolean | null {
  const [isPhone, setIsPhone] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setIsPhone(false);
      return;
    }
    const mql = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isPhone;
}
