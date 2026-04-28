import { render, screen, fireEvent } from "@testing-library/react";
import { IOSInstallOverlay } from "./IOSInstallOverlay";

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
const IOS_GOOGLE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/234.0.0.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36";

describe("IOSInstallOverlay", () => {
  beforeEach(() => {
    setStandalone(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing on non-iOS", () => {
    setUserAgent(ANDROID_UA);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing in standalone mode", () => {
    setUserAgent(IOS_SAFARI_UA);
    setStandalone(true);
    const { container } = render(<IOSInstallOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows overlay on iOS Safari (browser mode)", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows overlay on iOS Chrome (browser mode)", () => {
    setUserAgent(IOS_CHROME_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows overlay on iOS Google app", () => {
    setUserAgent(IOS_GOOGLE_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows already-installed and not-installed sections", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    expect(screen.getByText(/already added to your home screen/i)).toBeInTheDocument();
    expect(screen.getByText(/not installed yet/i)).toBeInTheDocument();
  });

  it("shows How to install toggle and expands steps — Safari", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByText(/how to install/i));
    expect(screen.getByText(/bottom toolbar/i)).toBeInTheDocument();
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  it("shows Chrome-specific step 1", () => {
    setUserAgent(IOS_CHROME_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByText(/how to install/i));
    expect(screen.getByText(/right side of the address bar/i)).toBeInTheDocument();
  });

  it("shows Firefox-specific step 1", () => {
    setUserAgent(IOS_FIREFOX_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByText(/how to install/i));
    expect(screen.getByText(/share button/i)).toBeInTheDocument();
  });

  it("shows Google app manual guides for Safari and Chrome", () => {
    setUserAgent(IOS_GOOGLE_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByText(/how to install/i));
    expect(screen.getAllByText(/share button/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/open in safari/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/open in chrome/i).length).toBeGreaterThan(0);
  });

  it("dismisses overlay on X click", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles steps visibility", () => {
    setUserAgent(IOS_SAFARI_UA);
    render(<IOSInstallOverlay />);
    fireEvent.click(screen.getByText(/how to install/i));
    expect(screen.getByText(/hide steps/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/hide steps/i));
    expect(screen.getByText(/how to install/i)).toBeInTheDocument();
  });
});
