/**
 * User-facing auth messages for the login / registration screen.
 *
 * NextAuth puts an error code in `/login?error=<code>`; this maps the code to a
 * sentence in the user's language. Technical detail (env vars, server logs,
 * provider config) never appears here — it belongs in `console.error` only.
 */

export const AUTH_FALLBACK_MESSAGE = "Something went wrong signing in. Try again in a moment.";

export const REGISTER_FAILED_MESSAGE = "Couldn’t create your account. Try again in a moment.";

export const REGISTER_SUCCESS_MESSAGE = "Account created. Sign in to continue.";

const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  CredentialsSignin: "Email or password doesn’t match.",
  AccessDenied: "Sign-in was cancelled.",
  OAuthAccountNotLinked: "This email already uses another sign-in method. Use that one.",
  Verification: "That sign-in link has expired. Try again.",
  SessionRequired: "Sign in to continue.",
};

/** Message for a NextAuth error code; `null` when there is no error. */
export function authErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return Object.prototype.hasOwnProperty.call(AUTH_ERROR_MESSAGES, code)
    ? AUTH_ERROR_MESSAGES[code]
    : AUTH_FALLBACK_MESSAGE;
}
