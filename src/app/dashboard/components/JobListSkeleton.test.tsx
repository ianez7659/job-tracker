import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import JobListSkeleton from "./JobListSkeleton";

describe("JobListSkeleton", () => {
  it("announces the loading state to assistive tech", () => {
    render(<JobListSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText("Loading your job applications…"),
    ).toBeInTheDocument();
  });

  it("renders placeholder cards without any focusable control", () => {
    render(<JobListSkeleton />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
