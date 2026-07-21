"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { btnPrimary, btnSecondary } from "./buttonStyles";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingHeader() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-canvas/80 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
          <Image
            src="/icons/jobflow-icon.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[7px]"
          />
          <span className="font-display text-lg font-bold tracking-tight text-ink">Jobflow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-40 animate-pulse rounded-full bg-line" aria-hidden="true" />
          ) : session ? (
            <Link href="/dashboard" className={`${btnPrimary} px-5 py-2 text-sm`}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Log in
              </Link>
              <Link href="/login?register=1" className={`${btnPrimary} px-5 py-2 text-sm`}>
                Start free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-line bg-canvas px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-ink-muted transition-colors hover:bg-line/50 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {status === "loading" ? (
                <div className="h-10 w-full animate-pulse rounded-full bg-line" aria-hidden="true" />
              ) : session ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`${btnPrimary} w-full px-5 py-2.5 text-sm`}
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`${btnSecondary} w-full px-5 py-2.5 text-sm`}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?register=1"
                    onClick={() => setMenuOpen(false)}
                    className={`${btnPrimary} w-full px-5 py-2.5 text-sm`}
                  >
                    Start free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
