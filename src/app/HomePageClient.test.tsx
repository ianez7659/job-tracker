import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePageClient from "./HomePageClient";

// Framer Motion (useReducedMotion) needs matchMedia; reveals/count-ups need IntersectionObserver.
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

// Control the session state per test.
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("HomePageClient (landing)", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the hero thesis and section headings", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<HomePageClient />);

    expect(screen.getByRole("heading", { level: 1, name: /your job search/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /every job is a card/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /three steps, start to hired/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /stay in the game/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /walk in prepared/i })).toBeInTheDocument();
  });

  it("shows Start free and Log in for logged-out visitors", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<HomePageClient />);

    const startFree = screen.getAllByRole("link", { name: /start free/i });
    const login = screen.getAllByRole("link", { name: /^log in$/i });
    expect(startFree.length).toBeGreaterThan(0);
    expect(login.length).toBeGreaterThan(0);
    startFree.forEach((el) => expect(el).toHaveAttribute("href", "/login?register=1"));
    expect(screen.queryByRole("link", { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it("shows Go to dashboard for authenticated users", () => {
    mockUseSession.mockReturnValue({ data: { user: { name: "Ian" } }, status: "authenticated" });
    render(<HomePageClient />);

    const dashboard = screen.getAllByRole("link", { name: /go to dashboard/i });
    expect(dashboard.length).toBeGreaterThan(0);
    dashboard.forEach((el) => expect(el).toHaveAttribute("href", "/dashboard"));
    expect(screen.queryByRole("link", { name: /start free/i })).not.toBeInTheDocument();
  });

  it("renders loading skeletons instead of CTAs while the session resolves", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" });
    render(<HomePageClient />);

    // Hero heading is always present; auth CTAs are replaced by skeletons.
    expect(screen.getByRole("heading", { level: 1, name: /your job search/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /start free/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /go to dashboard/i })).not.toBeInTheDocument();
  });
});
