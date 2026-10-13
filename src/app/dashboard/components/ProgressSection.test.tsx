import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProgressSection from "./ProgressSection";
import type { StatusFilter } from "@/app/dashboard/lib/jobs/metrics";

function renderProgress(currentStatus?: StatusFilter) {
  const setFilterStatus = jest.fn();
  render(
    <ProgressSection
      applyingCount={10}
      appliedCount={41}
      interviewCount={2}
      setFilterStatus={setFilterStatus}
      currentStatus={currentStatus}
      embedded
    />,
  );
  return { setFilterStatus };
}

describe("ProgressSection", () => {
  it("shows the Applying, Applied stage and interview counts it is given", () => {
    renderProgress();

    expect(screen.getByRole("button", { name: /^Applying\s*10$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Applied\s*41$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Interviews\s*2$/ })).toBeInTheDocument();
  });

  it("filters to every interview round, not only Interview 1", () => {
    const { setFilterStatus } = renderProgress();

    fireEvent.click(screen.getByRole("button", { name: /^Interviews/ }));

    expect(setFilterStatus).toHaveBeenCalledWith("interviews");
  });

  it("marks Applied pressed only for the Applied stage filter, not for Submitted", () => {
    renderProgress("postApplying");
    expect(screen.getByRole("button", { name: /^Applied/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("marks Interviews pressed for the interviews filter", () => {
    renderProgress("interviews");
    expect(screen.getByRole("button", { name: /^Interviews/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
