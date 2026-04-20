import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { InstallButton } from "./InstallButton";

function makeMockPromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
  return Object.assign(new Event("beforeinstallprompt"), {
    prompt: jest.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  });
}

describe("InstallButton", () => {
  it("renders nothing when beforeinstallprompt has not fired", () => {
    const { container } = render(<InstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders install button after beforeinstallprompt fires", () => {
    render(<InstallButton />);
    act(() => {
      fireEvent(window, makeMockPromptEvent());
    });
    expect(screen.getByRole("button", { name: /install jobflow app/i })).toBeInTheDocument();
  });

  it("calls prompt() when the button is clicked", () => {
    render(<InstallButton />);
    const mockEvent = makeMockPromptEvent();
    act(() => {
      fireEvent(window, mockEvent);
    });
    fireEvent.click(screen.getByRole("button", { name: /install jobflow app/i }));
    expect(mockEvent.prompt).toHaveBeenCalledTimes(1);
  });

  it("hides the button after user accepts", async () => {
    render(<InstallButton />);
    const mockEvent = makeMockPromptEvent("accepted");
    act(() => {
      fireEvent(window, mockEvent);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /install jobflow app/i }));
      await mockEvent.userChoice;
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /install jobflow app/i })).not.toBeInTheDocument();
    });
  });
});
