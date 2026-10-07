import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardStreakPanel from "./DashboardStreakPanel";
import type { WeekCircleDay } from "@/lib/xp/streakDisplayCore";

const week = (states: WeekCircleDay["state"][]): WeekCircleDay[] =>
  states.map((state, i) => ({
    letter: "SMTWTFS"[i],
    state,
    calendarKey: `2026-10-0${i + 1}`,
    periodKey: `2026-10-0${i + 1}`,
  })) as WeekCircleDay[];

describe("DashboardStreakPanel", () => {
  it("shows the streak count and one circle per day", () => {
    render(
      <DashboardStreakPanel
        data={{
          loginStreak: 3,
          weekDays: week(["done", "done", "current_done", "upcoming", "upcoming", "upcoming", "upcoming"]),
        }}
      />,
    );

    expect(screen.getByText("3-day streak")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("uses the compact phone circle size and grows from sm up", () => {
    render(
      <DashboardStreakPanel
        data={{ loginStreak: 1, weekDays: week(["current_done"]) }}
      />,
    );

    const circle = screen.getByRole("listitem").lastElementChild as HTMLElement;
    expect(circle).toHaveClass("h-7", "w-7", "sm:h-10", "sm:w-10");
  });

  it("renders a hidden skeleton while loading", () => {
    const { container } = render(<DashboardStreakPanel data={null} loading />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden");
    expect(screen.queryByText(/day streak/)).not.toBeInTheDocument();
  });

  it("never shows a negative streak", () => {
    render(
      <DashboardStreakPanel data={{ loginStreak: -2, weekDays: week([]) }} />,
    );

    expect(screen.getByText("0-day streak")).toBeInTheDocument();
  });
});
