"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Students" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/rankings", label: "Rankings" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-800 bg-gray-900 lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-gray-800 px-4">
        <span className="text-sm font-semibold tracking-wide text-gray-100">
          Jobflow Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 px-4 py-3">
        <Link
          href="/dashboard"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
