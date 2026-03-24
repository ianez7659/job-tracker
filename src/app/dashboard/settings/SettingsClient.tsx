"use client";

import { Session } from "next-auth";
import { useState, useEffect } from "react";
import { Moon, Sun, Bell, BellOff } from "lucide-react";

interface Props {
  session: Session | null;
}

export default function SettingsClient({ session }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    let savedTheme: "light" | "dark" | null = null;
    let savedNotifications: string | null = null;
    try {
      savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      savedNotifications = localStorage.getItem("notifications");
    } catch {
      savedTheme = null;
      savedNotifications = null;
    }
    if (savedTheme) setTheme(savedTheme);
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true");
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {}
    
    // Apply theme to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationChange = (enabled: boolean) => {
    setNotifications(enabled);
    try {
      localStorage.setItem("notifications", enabled.toString());
    } catch {}
  };

  if (!session) return <p>Not logged in.</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm space-y-8">
        {/* Theme Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            Theme Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Choose your preferred theme for the application.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                theme === "light"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
              }`}
            >
              <Sun size={16} />
              Light Mode
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                theme === "dark"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
              }`}
            >
              <Moon size={16} />
              Dark Mode
            </button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-slate-600" />

        {/* Notification Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            {notifications ? <Bell size={20} /> : <BellOff size={20} />}
            Notification Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Control how you receive notifications from the application.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Enable Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive alerts for job updates and reminders
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
