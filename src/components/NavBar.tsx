"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart,
  User,
  Search,
  LogOut,
  Menu,
  X,
  Archive,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // desktop dropdown reference
  const mobileMenuRef = useRef<HTMLDivElement>(null); // mobile menu reference

  // Desktop dropdown click outside handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mobile menu click outside handler
  useEffect(() => {
    function handleMobileClickOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleMobileClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleMobileClickOutside);
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href
      ? "text-blue-600 font-medium"
      : "text-gray-600 hover:text-blue-600";

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow">
      <div className=" mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-indigo-700">
          JobFlow
        </Link>

        {/* Hamburger menu for mobile view */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1 ${isActive("/dashboard")}`}
          >
            <Home size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/archive"
            className={`flex items-center gap-1 ${isActive(
              "/dashboard/archive"
            )}`}
          >
            <Archive size={16} />
            <span>Archive</span>
          </Link>

          <Link
            href="/dashboard/stats"
            className={`flex items-center gap-1 ${isActive(
              "/dashboard/stats"
            )}`}
          >
            <BarChart size={16} />
            <span>Stats</span>
          </Link>

          {session && (
            <div className="flex items-center gap-3 ml-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-sm text-gray-700 hover:text-indigo-600 hover:underline"
                >
                  <User size={16} />
                  {session.user?.name}
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50"
                    >
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <User size={16} />
                          View Profile
                        </span>
                      </Link>

                      {/* <Link
                        href="/dashboard/user"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Search size={16} />
                          Explore Users
                        </span>
                      </Link> */}

                      {/* <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Settings size={16} />
                          Settings
                        </span>
                      </Link> */}

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut size={16} />
                          Logout
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* <button
                onClick={() => signOut()}
                className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button> */}
            </div>
          )}
        </nav>
      </div>

      {/* Menu dropdown for mobile view */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white px-4 pb-4 pt-2 border-t shadow z-40"
          >
            <div className="flex flex-col gap-2 text-sm">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 ${isActive(
                  "/dashboard"
                )}`}
                onClick={() => setMobileOpen(false)}
              >
                <Home size={16} /> Dashboard
              </Link>

              <Link
                href="/dashboard/archive"
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 ${isActive(
                  "/dashboard/archive"
                )}`}
                onClick={() => setMobileOpen(false)}
              >
                <Archive size={16} /> Archive
              </Link>

              <Link
                href="/dashboard/stats"
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 ${isActive(
                  "/dashboard/stats"
                )}`}
                onClick={() => setMobileOpen(false)}
              >
                <BarChart size={16} /> Stats
              </Link>

              <Link
                href="/dashboard/profile"
                className={`flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 ${isActive(
                  "/profile"
                )}`}
                onClick={() => setMobileOpen(false)}
              >
                <User size={16} /> View Profile
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                <Settings size={16} /> Settings
              </Link>

              {session && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 px-2 py-2 rounded text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} /> Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
