import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WelcomePageClient from "./WelcomePageClient";

// Framer Motion (useReducedMotion) needs matchMedia; reveals need IntersectionObserver.
// jsdom provides neither — polyfill so the landing tree renders.
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

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error - assigning a test double
  global.IntersectionObserver = MockIntersectionObserver;
});

const mockUseSession = jest.fn();
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

describe("WelcomePageClient", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows the demo CTA and credentials for logged-out visitors", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<WelcomePageClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: /try jobflow with a\s*demo account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try demo account/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /other sign-in options/i })).toHaveAttribute(
      "href",
      "/login",
    );
    // The demo guidance (verified credentials) is preserved.
    expect(screen.getByText("demo@example.com")).toBeInTheDocument();
    expect(screen.getByText("demo1234")).toBeInTheDocument();
  });

  it("shows Go to dashboard (and hides the demo CTA) for authenticated users", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Ian" } },
      status: "authenticated",
    });
    render(<WelcomePageClient />);

    const dashboard = screen.getAllByRole("link", { name: /go to dashboard/i });
    expect(dashboard.length).toBeGreaterThan(0);
    dashboard.forEach((el) => expect(el).toHaveAttribute("href", "/dashboard"));
    expect(screen.queryByRole("button", { name: /try demo account/i })).not.toBeInTheDocument();
    expect(screen.queryByText("demo1234")).not.toBeInTheDocument();
  });

  it("renders the heading but no demo CTA while the session resolves", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" });
    render(<WelcomePageClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: /try jobflow with a\s*demo account/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try demo account/i })).not.toBeInTheDocument();
  });
});
