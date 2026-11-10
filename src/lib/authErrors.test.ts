import {
  AUTH_FALLBACK_MESSAGE,
  REGISTER_FAILED_MESSAGE,
  REGISTER_SUCCESS_MESSAGE,
  authErrorMessage,
} from "./authErrors";

describe("authErrorMessage", () => {
  it.each([
    ["CredentialsSignin", "Email or password doesn’t match."],
    ["AccessDenied", "Sign-in was cancelled."],
    ["OAuthAccountNotLinked", "This email already uses another sign-in method. Use that one."],
    ["Verification", "That sign-in link has expired. Try again."],
    ["SessionRequired", "Sign in to continue."],
  ])("maps %s to a user-language message", (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });

  it.each(["Configuration", "OAuthSignin", "OAuthCallback", "Callback", "SomethingNew"])(
    "falls back to the generic message for %s",
    (code) => {
      expect(authErrorMessage(code)).toBe(AUTH_FALLBACK_MESSAGE);
    },
  );

  it("returns null when there is no error code", () => {
    expect(authErrorMessage(null)).toBeNull();
    expect(authErrorMessage(undefined)).toBeNull();
    expect(authErrorMessage("")).toBeNull();
  });

  it("does not echo the raw code or resolve inherited object keys", () => {
    expect(authErrorMessage("toString")).toBe(AUTH_FALLBACK_MESSAGE);
    expect(authErrorMessage("<script>")).toBe(AUTH_FALLBACK_MESSAGE);
  });

  it("never exposes env-var names or server-log hints", () => {
    const codes = [
      "CredentialsSignin",
      "AccessDenied",
      "OAuthAccountNotLinked",
      "Verification",
      "SessionRequired",
      "Configuration",
      "OAuthSignin",
    ];
    const all = [
      ...codes.map((c) => authErrorMessage(c) ?? ""),
      REGISTER_FAILED_MESSAGE,
      REGISTER_SUCCESS_MESSAGE,
    ];
    for (const message of all) {
      expect(message).not.toMatch(/NEXTAUTH|GOOGLE_|CLIENT_ID|SECRET|server|terminal|logs?\b/i);
    }
  });
});
