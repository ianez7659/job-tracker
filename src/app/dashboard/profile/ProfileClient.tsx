"use client";

import { Session } from "next-auth";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  session: Session | null;
}

export default function ProfileClient({ session }: Props) {
  if (!session) return <p>Not logged in.</p>;
  const { user } = session;

  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  {
    console.log("🖼 preview", preview);
  }

  // ✅ session.user.image 업데이트되면 preview도 업데이트
  useEffect(() => {
    if (user.image) {
      setPreview(user.image);
    }
  }, [user.image]);

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

    const res = await fetch("/api/user/image", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    if (res.ok) {
      alert("Save complete!");
    } else {
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
