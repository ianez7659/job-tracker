import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewJobModePicker from "./NewJobModePicker";

describe("NewJobModePicker", () => {
  it("calls onSelectStandard when Standard is chosen", async () => {
    const onStandard = jest.fn();
    const onSimple = jest.fn();
    const onClose = jest.fn();
    render(
      <NewJobModePicker
        onClose={onClose}
        onSelectStandard={onStandard}
        onSelectSimple={onSimple}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /standard/i }));
    expect(onStandard).toHaveBeenCalledTimes(1);
    expect(onSimple).not.toHaveBeenCalled();
  });

  it("calls onSelectSimple when Simple is chosen", async () => {
    const onStandard = jest.fn();
    const onSimple = jest.fn();
    render(
      <NewJobModePicker
        onClose={jest.fn()}
        onSelectStandard={onStandard}
        onSelectSimple={onSimple}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /simple \(mobile\)/i }));
    expect(onSimple).toHaveBeenCalledTimes(1);
    expect(onStandard).not.toHaveBeenCalled();
  });

  it("calls onClose when close is pressed", async () => {
    const onClose = jest.fn();
    render(
      <NewJobModePicker
        onClose={onClose}
        onSelectStandard={jest.fn()}
        onSelectSimple={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
