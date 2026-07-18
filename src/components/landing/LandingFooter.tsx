"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

// Footer dark-mode toggle. Mirrors the app convention: flip `.dark` on <html>
// and persist to localStorage. ThemeProvider's MutationObserver keeps the rest in sync.
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const html = document.documentElement;
    const next = !html.classList.contains("dark");
    html.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore storage failures */
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      {mounted && isDark ? <Sun size={15} /> : <Moon size={15} />}
      <span>{mounted && isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

const FOOTER_LINKS = [
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Log in", href: "/login" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas-alt">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-signal ring-2 ring-canvas" />
              <span className="font-display text-lg font-bold tracking-tight text-ink">Jobflow</span>
            </Link>
            <p className="mt-3 text-sm text-ink-muted">
              Your job search, on rails — every application moving one checkpoint at a time.
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            {FOOTER_LINKS.map((link) =>
              link.href.startsWith("#") ? (
                <a key={link.href} href={link.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <ThemeToggle />
        </div>

        {/* Rail motif: a thin line closing the page */}
        <div className="mt-10 h-[2px] w-full rounded-full bg-linear-to-r from-signal/60 via-line to-hired/60" />
        <p className="mt-6 font-mono text-xs text-ink-muted">© {new Date().getFullYear()} Jobflow</p>
      </div>
    </footer>
  );
}
