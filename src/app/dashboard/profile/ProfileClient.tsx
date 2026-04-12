"use client";

import { Session } from "next-auth";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { User, Camera, X, Check, Briefcase } from "lucide-react";
import { getCategoriesGroupedByParent } from "@/lib/constants/categories";
import { getCroppedImg } from "@/lib/utils/getCroppedImg";

export type ProfileInitial = {
  name: string | null;
  category: string | null;
  hubStatus: string | null;
  headline: string | null;
};

interface Props {
  session: Session | null;
  initialProfile: ProfileInitial;
}

export default function ProfileClient({ session, initialProfile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState(initialProfile.category ?? "");
  const [categorySaving, setCategorySaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [displayName, setDisplayName] = useState(
    initialProfile.name ?? "",
  );
  const [hubStatus, setHubStatus] = useState<string>(
    initialProfile.hubStatus ?? "",
  );
  const [headline, setHeadline] = useState(initialProfile.headline ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const profileImageUrl =
    (session?.user as { image?: string | null })?.image ?? null;

  useEffect(() => {
    const cat = (session?.user as { category?: string | null })?.category;
    if (cat) setCategory(cat);
  }, [session?.user]);

  useEffect(() => {
    setDisplayName(initialProfile.name ?? "");
    setHubStatus(initialProfile.hubStatus ?? "");
    setHeadline(initialProfile.headline ?? "");
    setCategory(initialProfile.category ?? "");
  }, [initialProfile]);

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

  const saveProfileFields = async () => {
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: displayName.trim() || null,
        headline: headline.trim() || null,
      };
      if (hubStatus === "") {
        body.hubStatus = null;
      } else {
        body.hubStatus = hubStatus;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMessage(data.error || "Could not save profile");
        return;
      }
      setProfileMessage("Saved.");
      router.refresh();
    } catch {
      setProfileMessage("Network error");
    } finally {
      setProfileSaving(false);
    }
  };

  if (!session) return <p>Not logged in.</p>;

  return (
    <>
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

      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Profile
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-6 shadow-sm space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
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
                    <User
                      size={40}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700">
                  <Camera size={16} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleFileSelect}
                    disabled={imageUploading}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  JPEG, PNG, WebP or GIF. Max 2MB. You can crop before uploading.
                </p>
                {imageUploading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uploading...
                  </p>
                )}
                {imageError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {imageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-slate-600" />

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Briefcase size={20} />
              Profile
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Your public profile fields. Category saves when you pick a value;
              use Save for name, role, and short bio.
            </p>
            <div className="grid gap-4 max-w-xl">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Category
                </span>
                <select
                  id="profile-category"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                {categorySaving && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Saving...
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Display name
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  placeholder="How you appear in the app"
                  maxLength={120}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Role
                </span>
                <select
                  value={hubStatus}
                  onChange={(e) => setHubStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">Not set</option>
                  <option value="STUDENT">Student</option>
                  <option value="ALUMNI">Alumni</option>
                  <option value="STAFF">Staff</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Short bio
                </span>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  placeholder="One line about you"
                  maxLength={500}
                />
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveProfileFields}
                  disabled={profileSaving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {profileSaving ? "Saving…" : "Save"}
                </button>
                {profileMessage ? (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {profileMessage}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-slate-600" />

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Account Information
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
