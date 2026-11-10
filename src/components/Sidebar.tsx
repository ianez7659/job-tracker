"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Archive,
  BarChart,
  Settings,
  Plus,
  User,
  LogOut,
  Search,
} from "lucide-react";
import Image from "next/image";
import { getSignOutCallbackUrl } from "@/lib/constants/demoAccount";
import { InstallButton } from "@/components/InstallButton";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/closed", icon: Archive, label: "Closed" },
  { href: "/dashboard/stats", icon: BarChart, label: "Stats" },
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
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-56 md:z-40 bg-surface border-r border-line">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-line">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-signal"
        >
          <Image
            src="/icons/jobflow-icon.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[7px]"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            Jobflow
          </span>
        </Link>
      </div>

      {/* Install + Add New + Find Jobs (desktop) */}
      <div className="p-3 border-b border-line space-y-2">
        <InstallButton className="w-full justify-center py-2.5" />
        <button
          type="button"
          onClick={() => router.push("/dashboard?newJob=auto")}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-signal-solid hover:bg-signal-deep text-white text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Add New
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard?jobSearch=1")}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border-2 border-line bg-surface text-ink hover:border-signal hover:text-signal text-sm font-medium transition-colors"
        >
          <Search size={18} />
          Find Jobs
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
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-signal/10 text-signal font-medium"
                      : "text-ink hover:bg-canvas-alt"
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
      <div className="p-3 border-t border-line">
        {session && (
          <div className="space-y-0.5">
            <Link
              href="/dashboard/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === "/dashboard/profile"
                  ? "bg-signal/10 text-signal font-medium"
                  : "text-ink hover:bg-canvas-alt"
              }`}
            >
              {(session.user as { image?: string | null })?.image ? (
                <Image
                  src={(session.user as { image?: string | null }).image!}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <User size={20} className="flex-shrink-0" />
              )}
              <span className="truncate">{session.user?.name ?? "Profile"}</span>
            </Link>
            <button
              onClick={() =>
                signOut({
                  callbackUrl: getSignOutCallbackUrl(session.user?.email),
                })
              }
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors"
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
