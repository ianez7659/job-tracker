"use client";

import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  session: Session | null;
}

export default function ProfileClient({ session }: Props) {
  if (!session) return <p>Not logged in.</p>;
  const { user } = session;
  const { update: updateSession } = useSession();

  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  {
    console.log("🖼 preview", preview);
  }

  useEffect(() => {
    if (user.image) {
      setPreview(user.image);
    }
  }, [user.image]);

  // Force refresh session after image update
  const refreshSession = async () => {
    try {
      await updateSession();
      // Force a page refresh to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const base64 = await toBase64(selectedFile);
    console.log("📤 Uploading image, length:", base64.length);

    const res = await fetch("/api/user/image", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    if (res.ok) {
      const result = await res.json();
      console.log("✅ Upload successful:", result);

      alert("Save complete!");
      // Update the UI immediately after successful upload
      setPreview(base64);
      setSelectedFile(null);
      // Force session refresh and page reload to ensure all components update
      await refreshSession();
    } else {
      const error = await res.text();
      console.error("❌ Upload failed:", error);
      alert("Save failed");
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        {preview && (
          <Image
            src={preview}
            alt="Profile Image"
            width={64}
            height={64}
            unoptimized
            priority
            className="rounded-full border"
          />
        )}
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2 space-x-2">
        <label className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300">
          Choose Image
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {uploading ? "Uploading..." : "Save image"}
          </button>
        )}

        {preview && !selectedFile && (
          <button
            onClick={async () => {
              const res = await fetch("/api/user/image", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: null }),
              });

              if (res.ok) {
                setPreview("");
                alert("Image deleted.");
              } else {
                alert("Delete failed.");
              }
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete image
          </button>
        )}
      </div>
    </div>
  );
}
