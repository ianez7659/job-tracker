"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

// Applies saved theme (or system preference) to document on load and when theme changes elsewhere (e.g. Settings).
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
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
    const dark = stored === "dark" || (stored !== "light" && prefersDark);
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        theme={isDark ? "dark" : "light"}
        richColors
        closeButton
      />
    </>
  );
}
