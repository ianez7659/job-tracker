import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import PipelineRail from "./PipelineRail";

function list() {
  return screen.getByRole("list", { name: "Application pipeline" });
}
function items() {
  return within(list()).getAllByRole("listitem");
}
/** Accessible text of each checkpoint (the sr-only "Label, state"). */
function spoken() {
  return items().map((li) => li.querySelector(".sr-only")?.textContent);
}
function nodes(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-state]"));
}

describe("PipelineRail — detail", () => {
  it("lists six checkpoints with full labels and states for assistive tech", () => {
    render(<PipelineRail status="interview1" />);
    expect(spoken()).toEqual([
      "Applying, done",
      "Applied, done",
      "Interview 1, current stage",
      "Interview 2, not yet",
      "Interview 3, not yet",
      "Outcome, not yet",
    ]);
  });

  it("marks exactly one current step", () => {
    render(<PipelineRail status="interview2" />);
    const current = items().filter((li) => li.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0].querySelector(".sr-only")).toHaveTextContent("Interview 2, current stage");
  });

  it("fills reached nodes with the saturated stage color, not the pale badge fill", () => {
    const { container } = render(<PipelineRail status="interview1" />);
    const [applying, applied, current, upcoming] = nodes(container);
    expect(applying).toHaveClass("bg-indigo-500");
    expect(applied).toHaveClass("bg-emerald-500");
    expect(current).toHaveClass("bg-yellow-500");
    expect(upcoming).toHaveClass("bg-surface", "border-2");
    expect(container.innerHTML).not.toMatch(/bg-(emerald|indigo|yellow)-100/);
  });

  it("gives the current node a soft halo, not a hard outline", () => {
    const { container } = render(<PipelineRail status="resume" />);
    const halos = container.querySelectorAll(".rail-token");
    expect(halos).toHaveLength(1);
    expect(halos[0]).toHaveAttribute("data-state", "current");
    expect(container.innerHTML).not.toMatch(/outline-signal|outline-2/);
  });

  it("darkens only the travelled part of the line", () => {
    const { container } = render(<PipelineRail status="interview1" />);
    const segments = Array.from(container.querySelectorAll("li[role=presentation]"));
    expect(segments.map((el) => el.classList.contains("bg-ink-muted"))).toEqual([
      true, true, false, false, false,
    ]);
  });

  it("draws a closed offer without a current step and with unreached rounds", () => {
    const { container } = render(<PipelineRail status="offer" cycleEndStage="resume" />);
    expect(items().some((li) => li.hasAttribute("aria-current"))).toBe(false);
    expect(container.querySelector(".rail-token")).toBeNull();
    expect(spoken()[2]).toBe("Interview 1, not reached");
    expect(spoken()[5]).toBe("Offer, outcome");
    expect(nodes(container)[2]).toHaveClass("border-dashed");
    expect(nodes(container)[5]).toHaveClass("bg-green-600");
  });

  it("names a rejection as the outcome in red", () => {
    const { container } = render(<PipelineRail status="rejected" cycleEndStage="interview2" />);
    expect(spoken()[3]).toBe("Interview 2, done");
    expect(spoken()[5]).toBe("Rejected, outcome");
    expect(nodes(container)[5]).toHaveClass("bg-red-600");
  });

  it("shows no raw status enum", () => {
    const { container } = render(<PipelineRail status="interview3" />);
    expect(container.textContent).not.toMatch(/INTERVIEW|RESUME|interview\d|resume/);
  });
});

describe("PipelineRail — detail on a phone", () => {
  it("abbreviates inactive interviews so six labels fit, keeping full labels for sm+", () => {
    const { container } = render(<PipelineRail status="resume" />);
    const phone = Array.from(container.querySelectorAll("span.sm\\:hidden")).map((el) => el.textContent);
    const wide = Array.from(container.querySelectorAll("span.sm\\:inline")).map((el) => el.textContent);
    expect(phone).toEqual(["Applying", "Applied", "Int 1", "2", "3", "Outcome"]);
    expect(wide).toEqual(["Applying", "Applied", "Interview 1", "Interview 2", "Interview 3", "Outcome"]);
  });
});

describe("PipelineRail — card", () => {
  it("shows the five open checkpoints for an open job", () => {
    render(<PipelineRail status="resume" variant="card" />);
    expect(spoken()).toHaveLength(5);
    expect(spoken()[4]).toBe("Interview 3, not yet");
  });

  it("adds the outcome node once the cycle is closed", () => {
    render(<PipelineRail status="rejected" cycleEndStage="interview1" variant="card" />);
    expect(spoken()).toHaveLength(6);
    expect(spoken()[5]).toBe("Rejected, outcome");
  });

  it("shortens interview labels around the current stage so they fit a phone card", () => {
    const { container } = render(<PipelineRail status="interview2" variant="card" />);
    const visible = Array.from(container.querySelectorAll("li > span:last-child > span[aria-hidden]")).map(
      (el) => el.textContent,
    );
    expect(visible).toEqual(["Applying", "Applied", "1", "Interview 2", "3"]);
  });

  it("keeps 'Interview 1' readable before any interview", () => {
    const { container } = render(<PipelineRail status="resume" variant="card" />);
    const visible = Array.from(container.querySelectorAll("li > span:last-child > span[aria-hidden]")).map(
      (el) => el.textContent,
    );
    expect(visible).toEqual(["Applying", "Applied", "Interview 1", "2", "3"]);
  });

  it("uses 12px nodes with a 16px current node", () => {
    const { container } = render(<PipelineRail status="interview1" variant="card" />);
    expect(nodes(container)[0]).toHaveClass("size-3");
    expect(nodes(container)[2]).toHaveClass("size-4");
  });
});
