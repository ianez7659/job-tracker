"use client";

import { Session } from "next-auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Moon, Sun, Bell, BellOff, Briefcase, User, Camera, X, Check } from "lucide-react";
import { getCategoriesGroupedByParent } from "@/lib/constants/categories";
import { getCroppedImg } from "@/lib/utils/getCroppedImg";

interface Props {
  session: Session | null;
}

export default function SettingsClient({ session }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const savedNotifications = localStorage.getItem("notifications");
    
    if (savedTheme) setTheme(savedTheme);
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true");
    }
    const cat = (session?.user as { category?: string | null })?.category;
    if (cat) setCategory(cat);
  }, [session?.user]);

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

  // Get the profile image url from the session
  const profileImageUrl = (session?.user as { image?: string | null })?.image ?? null;

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropApply = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setImageUploading(true);
    setImageError(null);
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImageError(data.error || "Upload failed");
        return;
      }
      setCropModalOpen(false);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
      router.refresh();
    } catch {
      setImageError("Crop or upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
  };

  if (!session) return <p>Not logged in.</p>;

  return (
    <>
      {/* Crop modal */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
          <div className="flex-1 relative w-full min-h-0">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { backgroundColor: "#000" } }}
            />
          </div>
          <div className="flex items-center justify-center gap-4 p-4 bg-slate-900 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24 accent-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCropCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-500 text-slate-200 hover:bg-slate-700"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropApply}
              disabled={imageUploading || !croppedAreaPixels}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check size={18} />
              {imageUploading ? "Uploading..." : "Apply"}
            </button>
          </div>
        </div>
      )}

    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Theme Settings */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            Theme Settings
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
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
        </section>

        {/* Notification Settings */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            {notifications ? <Bell size={20} /> : <BellOff size={20} />}
            Notification Settings
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
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
        </section>

        {/* Profile Image */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User size={20} />
            Profile Image
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden flex items-center justify-center">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700">
                <Camera size={16} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={imageUploading}
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                JPEG, PNG, WebP or GIF. Max 2MB. You can crop before uploading.
              </p>
              {imageUploading && <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>}
              {imageError && <p className="text-sm text-red-600 dark:text-red-400">{imageError}</p>}
            </div>
          </div>
        </section>

        {/* Category */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Briefcase size={20} />
            Profile Category
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Your category (e.g. Web Developer) for a tailored experience. You can change it anytime.
            </p>
            <div>
              <label htmlFor="settings-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="settings-category"
                value={category}
                onChange={async (e) => {
                  const value = e.target.value;
                  setCategory(value);
                  if (!value) return;
                  setCategorySaving(true);
                  try {
                    const res = await fetch("/api/user/category", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ category: value }),
                    });
                    if (res.ok) router.refresh();
                  } finally {
                    setCategorySaving(false);
                  }
                }}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Not set</option>
                {getCategoriesGroupedByParent().map((group) => (
                  <optgroup key={group.parentId} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {categorySaving && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saving...</p>}
            </div>
          </div>
        </section>

        {/* User Info */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-gray-900 dark:text-gray-100">{session.user?.name || "Not provided"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-gray-100">{session.user?.email}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    </>
  );
}
