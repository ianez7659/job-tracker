import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginClient from "./LoginClient";

// framer-motion (AnimatePresence) reads matchMedia in jsdom.
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

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  getSession: () => getSessionMock(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

describe("LoginClient post-login routing", () => {
  afterEach(() => jest.clearAllMocks());

  // Regression: STAFF used to be pushed to /dashboard, where DashboardLayout's
  // redirect("/admin") ran during a client-side navigation and crashed the App
  // Router with React #310. They must go straight to /admin.
  it("routes STAFF users straight to /admin", async () => {
    signInMock.mockResolvedValue({ ok: true });
    getSessionMock.mockResolvedValue({ user: { hubStatus: "STAFF" } });

    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: /login with email/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
    expect(pushMock).not.toHaveBeenCalledWith("/dashboard");
  });

  it("routes non-staff users to /dashboard", async () => {
    signInMock.mockResolvedValue({ ok: true });
    getSessionMock.mockResolvedValue({ user: { hubStatus: "MEMBER" } });

    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: /login with email/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows an error and does not navigate on failed sign-in", async () => {
    signInMock.mockResolvedValue({ ok: false });

    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: /login with email/i }));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
