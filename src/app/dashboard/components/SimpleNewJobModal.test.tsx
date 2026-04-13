import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SimpleNewJobModal from "./SimpleNewJobModal";

describe("SimpleNewJobModal", () => {
  it("calls onSwitchToStandard when Standard form is clicked", async () => {
    const onSwitch = jest.fn();
    render(
      <SimpleNewJobModal
        onClose={jest.fn()}
        onSwitchToStandard={onSwitch}
        onCreated={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /standard form/i }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close simple add is clicked", async () => {
    const onClose = jest.fn();
    render(
      <SimpleNewJobModal
        onClose={onClose}
        onSwitchToStandard={jest.fn()}
        onCreated={jest.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /close simple add/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows photo storage disclaimer", () => {
    render(
      <SimpleNewJobModal
        onClose={jest.fn()}
        onSwitchToStandard={jest.fn()}
        onCreated={jest.fn()}
      />,
    );
    expect(
      screen.getByText(/photos are used only to read text/i),
    ).toBeInTheDocument();
  });
});
