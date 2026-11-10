import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LoginClient from "./LoginClient";
import {
  AUTH_FALLBACK_MESSAGE,
  REGISTER_FAILED_MESSAGE,
  REGISTER_SUCCESS_MESSAGE,
} from "@/lib/authErrors";

// framer-motion (AnimatePresence, useReducedMotion) reads matchMedia in jsdom.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
});

const pushMock = jest.fn();
const signInMock = jest.fn();
const getSessionMock = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  getSession: () => getSessionMock(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

const originalFetch = global.fetch;

/** Minimal fetch Response stand-in (jsdom has no Response). */
function fakeResponse(body: string, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
  };
}

async function fillSignIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "me@test.dev");
  await user.type(screen.getByLabelText("Password"), "secret-pass");
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("LoginClient sign-in", () => {
  // Regression: STAFF used to be pushed to /dashboard, where DashboardLayout's
  // redirect("/admin") ran during a client-side navigation and crashed the App
  // Router with React #310. They must go straight to /admin.
  it("routes STAFF users straight to /admin", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: true });
    getSessionMock.mockResolvedValue({ user: { hubStatus: "STAFF" } });

    render(<LoginClient />);
    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
    expect(pushMock).not.toHaveBeenCalledWith("/dashboard");
  });

  it("routes non-staff users to /dashboard", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: true });
    getSessionMock.mockResolvedValue({ user: { hubStatus: "MEMBER" } });

    render(<LoginClient />);
    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("submits with Enter and passes the typed credentials unchanged", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: true });
    getSessionMock.mockResolvedValue({ user: {} });

    render(<LoginClient />);
    await fillSignIn(user);
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith("credentials", {
        email: "me@test.dev",
        password: "secret-pass",
        redirect: false,
      }),
    );
  });

  it("shows an inline user-language error and does not navigate on failed sign-in", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

    render(<LoginClient />);
    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password doesn’t match.");
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("falls back to the generic message when signIn throws", async () => {
    const user = userEvent.setup();
    signInMock.mockRejectedValue(new Error("network down"));

    render(<LoginClient />);
    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(AUTH_FALLBACK_MESSAGE);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("disables the submit button and marks the form busy while pending", async () => {
    const user = userEvent.setup();
    let resolveSignIn: (value: { ok: boolean }) => void = () => {};
    signInMock.mockReturnValue(new Promise((resolve) => (resolveSignIn = resolve)));

    render(<LoginClient />);
    await fillSignIn(user);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const pending = await screen.findByRole("button", { name: "Signing in…" });
    expect(pending).toBeDisabled();
    expect(pending.closest("form")).toHaveAttribute("aria-busy", "true");

    // A second submit while pending does not call signIn again.
    await user.keyboard("{Enter}");
    expect(signInMock).toHaveBeenCalledTimes(1);

    resolveSignIn({ ok: false });
    await screen.findByRole("alert");
  });

  it("does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginClient />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("LoginClient registration", () => {
  async function fillRegister(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Name"), "Ada");
    await fillSignIn(user);
  }

  beforeEach(() => {
    mockSearchParams = new URLSearchParams("register=1");
  });

  it("posts name, email and password and returns to sign-in on success", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue(
      fakeResponse(JSON.stringify({ message: "Registration complete." }), 200),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<LoginClient />);
    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(REGISTER_SUCCESS_MESSAGE));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "me@test.dev", password: "secret-pass" }),
    });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the server's message for a 4xx response", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(
      fakeResponse(JSON.stringify({ message: "This email already exists." }), 400),
    ) as unknown as typeof fetch;

    render(<LoginClient />);
    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This email already exists.");
  });

  it.each([
    ["a 500 response", () => Promise.resolve(fakeResponse(JSON.stringify({ message: "Registration failed" }), 500))],
    ["an HTML error page", () => Promise.resolve(fakeResponse("<html>Bad gateway</html>", 400))],
    ["a network failure", () => Promise.reject(new TypeError("Failed to fetch"))],
  ])("shows the generic register message for %s", async (_label, impl) => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockImplementation(impl) as unknown as typeof fetch;

    render(<LoginClient />);
    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(REGISTER_FAILED_MESSAGE);
    expect(alert).not.toHaveTextContent(/html|gateway|terminal/i);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });
});
