"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Github } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    if (isRegistering) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to register");
        setLoading(false);
        return;
      }

      alert("Registration successful! You can now log in.");
      setIsRegistering(false);
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" suppressHydrationWarning>
      <div className="bg-white dark:bg-gray-700 p-6 rounded shadow-md w-full max-w-md text-center" suppressHydrationWarning>
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegistering ? "register" : "login"}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold mb-4 ">
              {isRegistering ? "Registration" : "Login"}
            </h1>

            {isRegistering && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-2 p-2 w-full border rounded"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-2 p-2 w-full border rounded"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 p-2 w-full border rounded"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition-all hover:scale-[1.02]"
            >
              {loading
                ? "Loading..."
                : isRegistering
                ? "Registration"
                : "Login with Email"}
            </button>

            <div className="my-4 text-sm text-gray-600 dark:text-gray-300">Or</div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded border border-gray-300 hover:bg-gray-50 transition-all hover:scale-[1.02]"
              >
                <SiGoogle className="w-5 h-5" />
                <span>Google</span>
              </button>
            </div>

            <p
              className="mt-4 text-sm text-gray-600 dark:text-gray-300 cursor-pointer underline"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering
                ? "Do you already have an account? Login"
                : "First time here? Register"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
