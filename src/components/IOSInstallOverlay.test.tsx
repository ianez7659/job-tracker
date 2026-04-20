import { render, screen, fireEvent } from "@testing-library/react";
import { IOSInstallOverlay } from "./IOSInstallOverlay";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

const IOS_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36";

describe("IOSInstallOverlay", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing on non-iOS browser", () => {
    setUserAgent(ANDROID_CHROME_UA);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the overlay on iOS Safari", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog", { name: /install jobflow on ios/i })).toBeInTheDocument();
  });

  it("shows the Share step instruction", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  it("dismisses the overlay when the close button is clicked", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
