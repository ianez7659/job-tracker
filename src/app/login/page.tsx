"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoginClient = dynamic(() => import("./LoginClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="py-8 text-sm text-ink-muted">Loading…</div>
    </div>
  ),
});

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="py-8 text-sm text-ink-muted">Loading…</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
