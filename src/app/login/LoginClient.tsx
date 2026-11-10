"use client";

import { signIn, getSession } from "next-auth/react";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Github } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";
import {
  REGISTER_FAILED_MESSAGE,
  REGISTER_SUCCESS_MESSAGE,
  authErrorMessage,
} from "@/lib/authErrors";

const labelClass = "block text-sm font-medium text-ink";
const inputClass =
  "mt-1.5 block h-11 w-full rounded-lg border border-line bg-surface px-3 text-base text-ink " +
  "placeholder:text-ink-muted transition-colors focus:border-signal focus:outline-none " +
  "focus:ring-2 focus:ring-signal/30 disabled:opacity-60";
const oauthButtonClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-line bg-surface " +
  "px-4 text-sm font-semibold text-ink transition-colors hover:bg-canvas-alt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Pulls a user-facing message out of a failed /api/auth/register response. */
async function readRegisterError(res: Response): Promise<string> {
  if (res.status >= 500) return REGISTER_FAILED_MESSAGE;
  try {
    const data = (await res.json()) as { message?: unknown };
    return typeof data.message === "string" && data.message.trim()
      ? data.message
      : REGISTER_FAILED_MESSAGE;
  } catch {
    return REGISTER_FAILED_MESSAGE;
  }
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  // Deep-link into the registration form via /login?register=1 (e.g. landing "Start free").
  const [isRegistering, setIsRegistering] = useState(searchParams.get("register") === "1");
  const [loading, setLoading] = useState(false);
  // NextAuth redirects back here with ?error=<code>; failed submits reuse the same region.
  const [error, setError] = useState<string | null>(() =>
    authErrorMessage(searchParams.get("error")),
  );

  const switchMode = () => {
    setIsRegistering((value) => !value);
    setError(null);
  };

  const register = async () => {
    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
    } catch (err) {
      console.error("Register request failed:", err);
      setError(REGISTER_FAILED_MESSAGE);
      return;
    }

    if (!res.ok) {
      console.error(`Register failed with HTTP ${res.status}`);
      setError(await readRegisterError(res));
      return;
    }

    toast.success(REGISTER_SUCCESS_MESSAGE);
    setIsRegistering(false);
    setPassword("");
  };

  const signInWithEmail = async () => {
    let res: Awaited<ReturnType<typeof signIn>>;
    try {
      res = await signIn("credentials", { email, password, redirect: false });
    } catch (err) {
      console.error("Credentials sign-in failed:", err);
      setError(authErrorMessage("Unknown"));
      return;
    }

    if (!res?.ok) {
      if (res?.error && res.error !== "CredentialsSignin") {
        console.error("Credentials sign-in error:", res.error);
      }
      setError(authErrorMessage(res?.error || "CredentialsSignin"));
      return;
    }

    // Route by role. STAFF land on /admin directly — sending them to
    // /dashboard first makes DashboardLayout redirect("/admin") run during a
    // client-side navigation, which crashes the App Router with React #310
    // ("Rendered more hooks than during the previous render").
    const session = await getSession();
    router.push(session?.user?.hubStatus === "STAFF" ? "/admin" : "/dashboard");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) await register();
      else await signInWithEmail();
    } finally {
      setLoading(false);
    }
  };

  const heading = isRegistering ? "Create your account" : "Sign in";
  const submitLabel = loading
    ? isRegistering
      ? "Creating account…"
      : "Signing in…"
    : isRegistering
      ? "Create account"
      : "Sign in";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12 text-ink">
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/icons/jobflow-icon.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-[8px]"
        />
        <span className="font-display text-xl font-bold tracking-tight text-ink">Jobflow</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_24px_-12px_rgba(20,26,36,0.18)] sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isRegistering ? "register" : "login"}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{heading}</h1>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} aria-busy={loading} className="mt-6 space-y-4">
              {isRegistering && (
                <div>
                  <label htmlFor="auth-name" className={labelClass}>
                    Name
                  </label>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="auth-password" className={labelClass}>
                  Password
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-signal-solid px-4 text-sm font-semibold text-white transition-colors hover:bg-signal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLabel}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-sm text-ink-muted">
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
              <span>or</span>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                disabled={loading}
                className={oauthButtonClass}
              >
                <Github className="h-5 w-5" aria-hidden="true" />
                <span>Continue with GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                disabled={loading}
                className={oauthButtonClass}
              >
                <SiGoogle className="h-4 w-4" aria-hidden="true" />
                <span>Continue with Google</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-ink-muted">
              {isRegistering ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="rounded-sm font-semibold text-signal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                {isRegistering ? "Sign in" : "Create an account"}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
