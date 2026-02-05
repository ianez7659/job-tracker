"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// import Image from "next/image";

export default function HomePageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <p>loading...</p>;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-br from-indigo-50 to-white">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 mb-4">
        Welcome to <span className="text-indigo-600">Job Tracker</span>
      </h1>
      <p className="text-gray-600 mb-10 text-sm sm:text-xl max-w-lg">
        Keep track of your job applications with ease and clarity.
      </p>

      {session ? (
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-lg shadow-lg transition-all duration-200 hover:scale-105"
        >
          Go to Dashboard
        </button>
      ) : (
        <a
          href="/login"
          className="text-indigo-600 hover:text-indigo-800 text-lg underline underline-offset-2 transition"
        >
          Log in to get started
        </a>
      )}
    </main>
  );
}

