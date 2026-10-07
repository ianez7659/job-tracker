import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import OverviewSection from "./OverviewSection";

function renderOverview() {
  const setFilterStatus = jest.fn();
  render(
    <OverviewSection
      pipelineTotal={12}
      applyingCount={4}
      submittedCount={8}
      setFilterStatus={setFilterStatus}
      embedded
    />,
  );
  return { setFilterStatus };
}

describe("OverviewSection", () => {
  it("labels the past-Applying total Submitted and never Applied", () => {
    renderOverview();

    expect(screen.getAllByText("Submitted").length).toBeGreaterThan(0);
    expect(screen.queryByText("Applied")).not.toBeInTheDocument();
  });

  it("filters to every stage past Applying when Submitted is clicked", () => {
    const { setFilterStatus } = renderOverview();

    fireEvent.click(screen.getAllByText("Submitted")[0]);

    expect(setFilterStatus).toHaveBeenCalledWith("postApplying");
  });

  it("filters to all cards when Total is clicked", () => {
    const { setFilterStatus } = renderOverview();

    fireEvent.click(screen.getAllByText("Total")[0]);

    expect(setFilterStatus).toHaveBeenCalledWith("all");
  });
});
