import { render, screen, waitFor } from "@testing-library/react";
import XpSummaryCard from "./XpSummaryCard";

const mockFetch = (data: object, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => data,
  } as Response);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("XpSummaryCard", () => {
  it("shows loading state initially", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<XpSummaryCard />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders level and XP after fetch", async () => {
    mockFetch({
      totalXp: 60,
      level: 1,
      currentLevelXp: 60,
      xpToNextLevel: 100,
      progress: 0.6,
    });
    render(<XpSummaryCard />);
    await waitFor(() =>
      expect(screen.getByText("Level 1")).toBeInTheDocument()
    );
    expect(screen.getByText("60 / 100 XP")).toBeInTheDocument();
    expect(screen.getByText("40 XP to next level")).toBeInTheDocument();
  });

  it("renders default Level 1 / 0 XP when fetch fails", async () => {
    mockFetch({}, false);
    render(<XpSummaryCard />);
    await waitFor(() =>
      expect(screen.getByText("Level 1")).toBeInTheDocument()
    );
    expect(screen.getByText("0 / 100 XP")).toBeInTheDocument();
  });

  it("progress bar has correct aria attributes", async () => {
    mockFetch({
      totalXp: 50,
      level: 1,
      currentLevelXp: 50,
      xpToNextLevel: 100,
      progress: 0.5,
    });
    render(<XpSummaryCard />);
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows 'Progress' heading", async () => {
    mockFetch({
      totalXp: 0,
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: 100,
      progress: 0,
    });
    render(<XpSummaryCard />);
    await waitFor(() =>
      expect(screen.getByText("Progress")).toBeInTheDocument()
    );
  });
});
