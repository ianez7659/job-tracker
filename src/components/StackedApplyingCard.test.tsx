import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StackedApplyingCard from "./StackedApplyingCard";

describe("StackedApplyingCard", () => {
  it("leads with the count and a neutral description instead of 'Stuck'", () => {
    render(<StackedApplyingCard count={10} onClick={jest.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("10 cards waiting 7+ days");
    expect(button).toHaveTextContent("Review");
    expect(button).not.toHaveTextContent(/stuck/i);
  });

  it("uses the singular for one card", () => {
    render(<StackedApplyingCard count={1} onClick={jest.fn()} />);

    expect(screen.getByRole("button")).toHaveTextContent("1 card waiting 7+ days");
  });

  it("opens the review page when pressed", () => {
    const onClick = jest.fn();
    render(<StackedApplyingCard count={3} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("stays neutral in both themes: theme tokens, no amber warning palette", () => {
    const { container } = render(<StackedApplyingCard count={2} onClick={jest.fn()} />);

    expect(screen.getByRole("button")).toHaveClass("bg-surface", "border-line");
    expect(container.innerHTML).not.toMatch(/amber-/);
  });
});
