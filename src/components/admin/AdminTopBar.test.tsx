/**
 * Rendering tests for AdminTopBar component.
 * Mocks fetch, next/navigation, and framer-motion to test UI states.
 */

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Stub framer-motion to plain div/span to avoid animation complexity in tests
jest.mock("framer-motion", () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div: ({ children, initial, animate, exit, transition, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => {
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminTopBar from "./AdminTopBar";

// Helper to mock fetch responses
function mockFetchResponses(unreadCount: number, notifications: unknown[] = []) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("unread-count")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: unreadCount }),
      });
    }
    if (url.includes("read-all")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ markedRead: 0 }),
      });
    }
    // GET /api/admin/notifications
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ notifications }),
    });
  });
}

describe("AdminTopBar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders the bell icon button", async () => {
    mockFetchResponses(0);
    await act(async () => {
      render(<AdminTopBar />);
    });
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("shows unread badge when count > 0", async () => {
    mockFetchResponses(5);
    await act(async () => {
      render(<AdminTopBar />);
    });
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("caps badge at 99+", async () => {
    mockFetchResponses(150);
    await act(async () => {
      render(<AdminTopBar />);
    });
    await waitFor(() => {
      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });

  it("does not show badge when count is 0", async () => {
    mockFetchResponses(0);
    await act(async () => {
      render(<AdminTopBar />);
    });
    await waitFor(() => {
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  it("opens notification panel on bell click and shows empty state", async () => {
    mockFetchResponses(0);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await act(async () => {
      render(<AdminTopBar />);
    });

    const bell = screen.getByRole("button", { name: /notifications/i });
    await user.click(bell);

    await waitFor(() => {
      expect(screen.getByText("No new notifications")).toBeInTheDocument();
    });
  });

  it("opens notification panel and shows notification items", async () => {
    const notifications = [
      { id: "n1", type: "new_offer", message: "Alice submitted a new offer", profileId: "p1", offerId: "o1", createdAt: new Date().toISOString(), isRead: false },
      { id: "n2", type: "offer_deactivated", message: "Bob deactivated an offer", profileId: "p2", offerId: "o2", createdAt: new Date().toISOString(), isRead: true },
    ];
    mockFetchResponses(2, notifications);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await act(async () => {
      render(<AdminTopBar />);
    });

    const bell = screen.getByRole("button", { name: /notifications/i });
    await user.click(bell);

    await waitFor(() => {
      expect(screen.getByText("Alice submitted a new offer")).toBeInTheDocument();
      expect(screen.getByText("Bob deactivated an offer")).toBeInTheDocument();
    });
  });

  it("shows panel header with Notifications title", async () => {
    mockFetchResponses(0);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await act(async () => {
      render(<AdminTopBar />);
    });

    const bell = screen.getByRole("button", { name: /notifications/i });
    await user.click(bell);

    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });
  });
});
