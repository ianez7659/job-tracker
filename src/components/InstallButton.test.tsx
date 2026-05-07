import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { InstallButton } from "./InstallButton";

function makeMockPromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
  return Object.assign(new Event("beforeinstallprompt"), {
    prompt: jest.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  });
}

function mockMatchMediaStandalone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((q: string) => ({
      matches: q === "(display-mode: standalone)" ? matches : false,
      media: q,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("InstallButton", () => {
  beforeEach(() => {
    mockMatchMediaStandalone(false);
    Object.defineProperty(window.navigator, "standalone", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });
  it("renders nothing when beforeinstallprompt has not fired", async () => {
    const { container } = render(<InstallButton />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("renders nothing when already in standalone display mode", async () => {
    mockMatchMediaStandalone(true);
    render(<InstallButton />);
    act(() => {
      fireEvent(window, makeMockPromptEvent());
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /install jobflow app/i }),
      ).not.toBeInTheDocument();
    });
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
