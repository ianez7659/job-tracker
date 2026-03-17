"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Archive,
  BarChart,
  Trash2,
  Settings,
  Plus,
  User,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/archive", icon: Archive, label: "Archive" },
  { href: "/dashboard/stats", icon: BarChart, label: "Stats" },
  { href: "/dashboard/trash", icon: Trash2, label: "Trash" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-56 md:z-40 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-indigo-600 dark:text-indigo-400"
        >
          JobFlow
        </Link>
      </div>

      {/* Add job */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => router.push("/dashboard?newJob=1")}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Add job
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        {session && (
          <div className="space-y-0.5">
            <Link
              href="/dashboard/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === "/dashboard/profile"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {(session.user as { image?: string | null })?.image ? (
                <img
                  src={(session.user as { image?: string | null }).image!}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <User size={20} className="flex-shrink-0" />
              )}
              <span className="truncate">{session.user?.name ?? "Profile"}</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors"
            >
              <LogOut size={20} className="flex-shrink-0" />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
