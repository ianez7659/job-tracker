"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/constants/demoAccount";

const DEMO_PASSWORD = "demo1234";

export default function WelcomePageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    try {
      const res = await signIn("credentials", {
        email: DEMO_ACCOUNT_EMAIL,
        password: DEMO_PASSWORD,
        redirect: false,
      });
      if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert(
          "Demo sign-in failed. Create the demo user or use Log in on the main page.",
        );
      }
    } finally {
      setDemoLoading(false);
    }
  };

  if (status === "loading") return <p>loading...</p>;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-b from-slate-400 to-slate-50 dark:from-slate-950 dark:to-slate-500">
      <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-700 to-violet-400 dark:from-yellow-600 dark:to-yellow-100 bg-clip-text text-transparent ">
        Welcome to <span className="text-red-600 dark:text-orange-600 ">Job</span>{" "}
        <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent dark:from-yellow-400 dark:to-yellow-600">
          Tracker
        </span>
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-10 text-sm sm:text-xl max-w-lg">
        Keep track of your job applications with ease and clarity.
      </p>

      {session ? (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-6 py-3 rounded-full text-xl shadow-lg transition-all duration-200 hover:scale-105"
        >
          Go to Dashboard
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={demoLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-6 py-3 rounded-full text-lg font-medium shadow-lg transition-all duration-200 hover:scale-105"
          >
            {demoLoading ? "Signing in…" : "Try demo account"}
          </button>
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 dark:text-yellow-500 dark:hover:text-yellow-400 text-sm underline underline-offset-2 transition"
          >
            Other sign-in options
          </a>
        </div>
      )}
    </main>
  );
}
