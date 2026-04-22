import { render, screen, fireEvent } from "@testing-library/react";
import { IOSInstallOverlay } from "./IOSInstallOverlay";

const INSTALLED_KEY = "ios-pwa-installed";

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

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36";

describe("IOSInstallOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
    setStandalone(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Non-iOS ──────────────────────────────────────────────────────────────
  it("renders nothing on non-iOS browser", () => {
    setUserAgent(ANDROID_UA);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  // ── State A: no install record ────────────────────────────────────────────
  it("shows State A (install guide) on first visit — Safari", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/add to your home screen/i)).toBeInTheDocument();
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  it("shows State A on first visit — Chrome", () => {
    setUserAgent(IOS_CHROME_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/add to your home screen/i)).toBeInTheDocument();
    expect(screen.getByText(/bottom-right/i)).toBeInTheDocument();
  });

  it("shows State A on first visit — Firefox", () => {
    setUserAgent(IOS_FIREFOX_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/add to your home screen/i)).toBeInTheDocument();
    expect(screen.getByText(/bottom of the screen/i)).toBeInTheDocument();
  });

  // ── Standalone: saves install record ─────────────────────────────────────
  it("does not show overlay in standalone mode", () => {
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("saves INSTALLED_KEY when running in standalone", () => {
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    render(<IOSInstallOverlay />);
    expect(localStorage.getItem(INSTALLED_KEY)).toBe("1");
  });

  // ── State B: install record exists ───────────────────────────────────────
  it("shows State B (already installed) when INSTALLED_KEY exists", () => {
    localStorage.setItem(INSTALLED_KEY, "1");
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/jobflow is installed/i)).toBeInTheDocument();
    expect(screen.getByText(/open jobflow from your home screen/i)).toBeInTheDocument();
  });

  it("shows reinstall steps toggle in State B", () => {
    localStorage.setItem(INSTALLED_KEY, "1");
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    const toggle = screen.getByRole("button", { name: /how to reinstall/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  // ── Dismiss ───────────────────────────────────────────────────────────────
  it("dismisses overlay for current session on X click", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not persist dismissal to localStorage", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(localStorage.getItem(INSTALLED_KEY)).toBeNull();
  });
});
