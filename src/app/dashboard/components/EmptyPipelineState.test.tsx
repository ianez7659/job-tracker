import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EmptyPipelineState from "./EmptyPipelineState";

describe("EmptyPipelineState", () => {
  it("states the situation and invites the first job", () => {
    render(<EmptyPipelineState onAddFirstJob={jest.fn()} />);
    expect(screen.getByText("No job applications yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add your first job/i }),
    ).toBeInTheDocument();
  });

  it("calls onAddFirstJob when the Applying slot is pressed", async () => {
    const onAddFirstJob = jest.fn();
    render(<EmptyPipelineState onAddFirstJob={onAddFirstJob} />);
    await userEvent.click(
      screen.getByRole("button", { name: /add your first job/i }),
    );
    expect(onAddFirstJob).toHaveBeenCalledTimes(1);
  });

  it("previews the stages a card travels through", () => {
    render(<EmptyPipelineState onAddFirstJob={jest.fn()} />);
    expect(screen.getByText("Applying")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Interviews")).toBeInTheDocument();
  });

  it("does not promise an Offer slot — the Card List never shows final statuses", () => {
    render(<EmptyPipelineState onAddFirstJob={jest.fn()} />);
    expect(screen.queryByText(/^offer$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^rejected$/i)).not.toBeInTheDocument();
  });

  it("exposes exactly one focusable control so the ghost rows stay decorative", () => {
    render(<EmptyPipelineState onAddFirstJob={jest.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("keeps the stages in pipeline order", () => {
    render(<EmptyPipelineState onAddFirstJob={jest.fn()} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Applying");
    expect(items[1]).toHaveTextContent("Applied");
    expect(items[2]).toHaveTextContent("Interviews");
  });
});
