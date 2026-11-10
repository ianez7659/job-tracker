import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FindJobsCtaCard from "./FindJobsCtaCard";

describe("FindJobsCtaCard", () => {
  it("opens job search when the button is pressed", () => {
    const onFindJobs = jest.fn();
    render(<FindJobsCtaCard onFindJobs={onFindJobs} />);

    fireEvent.click(screen.getByRole("button", { name: /find jobs/i }));

    expect(onFindJobs).toHaveBeenCalledTimes(1);
  });

  it("keeps the intentional green card but uses emerald-700 so white button text clears 4.5:1", () => {
    render(<FindJobsCtaCard onFindJobs={jest.fn()} />);

    const button = screen.getByRole("button", { name: /find jobs/i });
    expect(button).toHaveClass("bg-emerald-700", "text-white");
    // emerald-600 measured 3.67:1 with white text
    expect(button).not.toHaveClass("bg-emerald-600");
    expect(screen.getByText("Ready to find jobs?")).toHaveClass("text-emerald-900");
  });

  it("renders custom lines when given", () => {
    render(
      <FindJobsCtaCard onFindJobs={jest.fn()} primaryLine="First" secondaryLine="Second" />,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
