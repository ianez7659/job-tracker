import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MissionsSection from "./MissionsSection";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

describe("MissionsSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/xp/missions")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              daily: [
                {
                  id: "daily_check_in",
                  title: "Claim your daily XP",
                  description: "Open the dashboard.",
                  completed: true,
                },
                {
                  id: "daily_job_card",
                  title: "Add a job card",
                  description: "Log an application.",
                  completed: false,
                },
              ],
              weekly: [
                {
                  id: "weekly_review",
                  title: "Weekly review",
                  description: "Reflect.",
                  completed: false,
                },
                {
                  id: "weekly_cycle",
                  title: "Close a job cycle",
                  description: "Mark terminal.",
                  completed: false,
                },
              ],
              dailyRemaining: 1,
              weeklyRemaining: 2,
            }),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    }) as jest.Mock;
  });

  it("renders mission tabs and footer", async () => {
    render(
      <MissionsSection refreshToken={0} onStartNewJob={jest.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Missions" })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: /Daily/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Weekly/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Complete your missions to earn XP/i),
    ).toBeInTheDocument();
    expect(screen.getByText("1 left")).toBeInTheDocument();
    expect(screen.getAllByText("2 left").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onStartNewJob when starting job card mission", async () => {
    const onStartNewJob = jest.fn();
    const user = userEvent.setup();
    render(
      <MissionsSection refreshToken={0} onStartNewJob={onStartNewJob} />,
    );
    await waitFor(() => {
      expect(screen.getByText("Add a job card")).toBeInTheDocument();
    });
    const starts = screen.getAllByRole("button", { name: "Start" });
    await user.click(starts[0]);
    expect(onStartNewJob).toHaveBeenCalled();
  });

  it("hides completed missions by default and shows them when toggled", async () => {
    const user = userEvent.setup();
    render(<MissionsSection refreshToken={0} onStartNewJob={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Add a job card")).toBeInTheDocument();
    });

    expect(screen.queryByText("Claim your daily XP")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /Show completed/i });
    await user.click(toggle);
    expect(screen.getByText("Claim your daily XP")).toBeInTheDocument();
  });
});
