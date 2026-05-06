import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import XpToast from "./XpToast";

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllTimers();
});

describe("XpToast", () => {
  it("renders XP amount when xp > 0", () => {
    render(<XpToast xp={15} onDismiss={jest.fn()} />);
    expect(screen.getByText("+15 XP")).toBeInTheDocument();
  });

  it("does not render when xp is 0", () => {
    render(<XpToast xp={0} onDismiss={jest.fn()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("calls onDismiss after default duration (3000ms)", () => {
    const onDismiss = jest.fn();
    render(<XpToast xp={10} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(3000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss after custom duration", () => {
    const onDismiss = jest.fn();
    render(<XpToast xp={10} onDismiss={onDismiss} duration={1500} />);
    act(() => { jest.advanceTimersByTime(1499); });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has status role for accessibility", () => {
    render(<XpToast xp={10} onDismiss={jest.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
