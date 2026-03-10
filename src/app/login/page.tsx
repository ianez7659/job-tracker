"use client";

import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("./LoginClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="py-8 text-gray-500 dark:text-gray-400">Loading...</div>
    </div>
  ),
});

export default function LoginPage() {
  return <LoginClient />;
}
