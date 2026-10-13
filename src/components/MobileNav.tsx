"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart, User, Archive, Settings } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: <Home aria-hidden />, label: "Home" },
    { href: "/dashboard/closed", icon: <Archive aria-hidden />, label: "Closed" },
    { href: "/dashboard/stats", icon: <BarChart aria-hidden />, label: "Stats" },
    { href: "/dashboard/profile", icon: <User aria-hidden />, label: "Profile" },
    { href: "/dashboard/settings", icon: <Settings aria-hidden />, label: "Settings" },
  ];

  return (
    // pb uses the safe-area inset so the iOS home indicator never covers the labels
    // in the installed PWA (viewportFit: "cover").
    <nav
      aria-label="Primary"
      className="fixed bottom-0 z-50 flex w-full justify-around border-t border-line bg-surface pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow md:hidden"
    >
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center text-xs ${
              active ? "font-medium text-signal" : "text-ink-muted"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
