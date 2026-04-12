// Demo credentials user (see login page / welcome). 
export const DEMO_ACCOUNT_EMAIL = "demo@example.com";

// Where to send the user after sign-out when they were the demo account.
export const DEMO_SIGN_OUT_REDIRECT = "/welcome";

// `signOut({ callbackUrl })` — demo users return to the welcome page; others to home.
export function getSignOutCallbackUrl(
  email: string | null | undefined,
): string {
  if (email?.toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase()) {
    return DEMO_SIGN_OUT_REDIRECT;
  }
  return "/";
}
