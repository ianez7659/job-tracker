import { render, screen, fireEvent, act } from "@testing-library/react";
import { IOSInstallOverlay } from "./IOSInstallOverlay";

const DISMISSED_KEY = "ios-install-overlay-dismissed";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

function setStandalone(value: boolean) {
  Object.defineProperty(window.navigator, "standalone", {
    value,
    configurable: true,
  });
}

const IOS_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const IOS_CHROME_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/112.0.5615.46 Mobile/15E148 Safari/604.1";

const IOS_FIREFOX_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/114.0 Mobile/15E148 Safari/604.1";

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36";

describe("IOSInstallOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
    setStandalone(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing on non-iOS browser", () => {
    setUserAgent(ANDROID_CHROME_UA);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the overlay on iOS Safari (first visit)", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog", { name: /install jobflow on ios/i })).toBeInTheDocument();
  });

  it("renders the overlay on iOS Chrome (first visit)", () => {
    setUserAgent(IOS_CHROME_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog", { name: /install jobflow on ios/i })).toBeInTheDocument();
  });

  it("renders the overlay on iOS Firefox (first visit)", () => {
    setUserAgent(IOS_FIREFOX_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog", { name: /install jobflow on ios/i })).toBeInTheDocument();
  });

  it("shows Safari-specific step 1 (Share button / bottom toolbar)", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/bottom toolbar/i)).toBeInTheDocument();
  });

  it("shows Chrome-specific step 1 (··· bottom-right)", () => {
    setUserAgent(IOS_CHROME_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/bottom-right/i)).toBeInTheDocument();
  });

  it("shows Firefox-specific step 1 (··· bottom of the screen)", () => {
    setUserAgent(IOS_FIREFOX_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/bottom of the screen/i)).toBeInTheDocument();
  });

  it("shows Add to Home Screen step for all iOS browsers", () => {
    for (const ua of [IOS_SAFARI_UA, IOS_CHROME_UA, IOS_FIREFOX_UA]) {
      setUserAgent(ua);
      const { unmount } = render(<IOSInstallOverlay />);
      expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("dismisses and saves to localStorage on close", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBe("1");
  });

  it("does not show overlay if previously dismissed", () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setUserAgent(IOS_SAFARI_UA);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not show overlay when running in standalone mode", () => {
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("clears dismissed flag when running in standalone (icon was used)", () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    render(<IOSInstallOverlay />);
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it("shows overlay again after icon is deleted (standalone flag cleared)", () => {
    // Simulate: user had dismissed, then opened via icon (clears flag)
    localStorage.setItem(DISMISSED_KEY, "1");
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    const { unmount } = render(<IOSInstallOverlay />);
    unmount();

    // Now user deletes icon and visits via browser
    setStandalone(false);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog", { name: /install jobflow on ios/i })).toBeInTheDocument();
  });
});
