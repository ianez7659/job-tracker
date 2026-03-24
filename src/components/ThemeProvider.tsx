"use client";

import { useEffect } from "react";

// Applies saved theme (or system preference) to document on load and when theme changes elsewhere (e.g. Settings).
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let stored: "light" | "dark" | null = null;
    try {
      stored = localStorage.getItem("theme") as "light" | "dark" | null;
    } catch {
      stored = null;
    }
    let prefersDark = false;
    try {
      prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      prefersDark = false;
    }
    const isDark = stored === "dark" || (stored !== "light" && prefersDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return <>{children}</>;
}
