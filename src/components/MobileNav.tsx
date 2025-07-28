"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart, Trash2, User, Archive } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: <Home />, label: "Home" },
    { href: "/dashboard/archive", icon: <Archive />, label: "Archive" },

    { href: "/dashboard/stats", icon: <BarChart />, label: "Stats" },
    { href: "/dashboard/trash", icon: <Trash2 />, label: "Trash" },
    { href: "/profile", icon: <User />, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t shadow md:hidden flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center text-xs ${
            pathname === item.href ? "text-blue-500" : "text-gray-500"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
