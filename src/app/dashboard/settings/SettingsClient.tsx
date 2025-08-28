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
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const savedNotifications = localStorage.getItem("notifications");
    
    if (savedTheme) setTheme(savedTheme);
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true");
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Apply theme to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("notifications", enabled.toString());
  };

  if (!session) return <p>Not logged in.</p>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Theme Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            Theme Settings
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose your preferred theme for the application.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === "light"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Sun size={16} />
                Light Mode
              </button>
              
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Moon size={16} />
                Dark Mode
              </button>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {notifications ? <Bell size={20} /> : <BellOff size={20} />}
            Notification Settings
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Control how you receive notifications from the application.
            </p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Enable Notifications</p>
                <p className="text-sm text-gray-500">
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
        </section>

        {/* User Info */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-gray-900">{session.user?.name || "Not provided"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{session.user?.email}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
