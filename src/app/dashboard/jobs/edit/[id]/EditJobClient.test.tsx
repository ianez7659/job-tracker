import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditJobClient from "./EditJobClient";

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
});

// Unrelated panels; react-markdown is ESM-only and not transformed by Jest here.
jest.mock("@/components/MarkdownContent", () => ({
  MarkdownContent: () => null,
}));
jest.mock("@/components/AiAssistCheeringCallout", () => ({
  AiAssistCheeringCallout: () => null,
}));
jest.mock("@/components/WalkInCompanyPrepPanel", () => ({
  __esModule: true,
  default: () => null,
}));

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: refreshMock }),
}));

const toastError = jest.fn();
jest.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: jest.fn() },
}));

type FetchCall = [string, RequestInit | undefined];

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, json: async () => body };
}

/** Routes the sheet's reads; PATCH result is configurable. */
function mockFetch(patch: () => Promise<unknown>) {
  const fn = jest.fn((url: string, init?: RequestInit) => {
    if (url === "/api/jobs/all") return Promise.resolve(jsonResponse([]));
    if (url.startsWith("/api/xp/summary")) return Promise.resolve(jsonResponse({ loginStreak: 2 }));
    if (url === "/api/jobs/job-1" && init?.method === "PATCH") return patch();
    return Promise.reject(new Error(`unexpected ${url}`));
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function patchCalls(fn: jest.Mock): FetchCall[] {
  return (fn.mock.calls as FetchCall[]).filter(([, init]) => init?.method === "PATCH");
}

function renderJob(status: string, cycleEndStage: string | null = null) {
  return render(
    <EditJobClient
      job={{
        id: "job-1",
        title: "Junior",
        company: "Acme",
        status,
        appliedAt: "2026-11-01T00:00:00.000Z",
        tags: null,
        url: null,
        jd: null,
        source: null,
        cycleEndStage,
      }}
    />,
  );
}

const originalFetch = global.fetch;
const originalConfirm = window.confirm;

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  window.confirm = jest.fn(() => true);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
  window.confirm = originalConfirm;
});

describe("EditJobClient pipeline ends", () => {
  it.each(["resume", "interview1", "interview2", "interview3"])(
    "shows Got an offer and the quiet close action at %s",
    (status) => {
      mockFetch(() => Promise.reject(new Error("no patch expected")));
      renderJob(status);
      expect(screen.getByRole("button", { name: "Got an offer" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Close as rejected / withdrawn" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /mark as/i })).not.toBeInTheDocument();
    },
  );

  it("keeps the advance button as the primary action", () => {
    mockFetch(() => Promise.reject(new Error("no patch expected")));
    renderJob("interview1");
    expect(screen.getByRole("button", { name: "Move to Interview 2" })).toBeInTheDocument();
  });

  it.each([
    ["applying", null],
    ["offer", "interview2"],
    ["rejected", "resume"],
  ])("does not show the ends row at %s", (status, cycleEndStage) => {
    mockFetch(() => Promise.reject(new Error("no patch expected")));
    renderJob(status, cycleEndStage);
    expect(screen.queryByRole("button", { name: "Got an offer" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close as rejected / withdrawn" }),
    ).not.toBeInTheDocument();
  });

  it("opens the offer modal from Got an offer", async () => {
    mockFetch(() => Promise.reject(new Error("no patch expected")));
    const user = userEvent.setup();
    renderJob("interview2");
    await user.click(screen.getByRole("button", { name: "Got an offer" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Acme")).toBeInTheDocument();
  });

  it("opens the rejection sheet instead of a native confirm, and Keep it open changes nothing", async () => {
    const fetchMock = mockFetch(() => Promise.reject(new Error("no patch expected")));
    const user = userEvent.setup();
    renderJob("interview2");

    await user.click(screen.getByRole("button", { name: "Close as rejected / withdrawn" }));
    const dialog = await screen.findByRole("dialog", { name: "Close this application?" });
    expect(window.confirm).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Keep it open" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(patchCalls(fetchMock)).toHaveLength(0);
  });

  it("PATCHes {status: rejected} on confirm, shows step 2, and marks the page closed", async () => {
    const fetchMock = mockFetch(() =>
      Promise.resolve(jsonResponse({ message: "Status updated", xpGained: 0 })),
    );
    const user = userEvent.setup();
    renderJob("interview2");

    await user.click(screen.getByRole("button", { name: "Close as rejected / withdrawn" }));
    const dialog = await screen.findByRole("dialog", { name: "Close this application?" });
    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));

    expect(await screen.findByRole("heading", { name: "Closed." })).toBeInTheDocument();
    const calls = patchCalls(fetchMock);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ status: "rejected" });
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByText("This application is closed: Rejected.")).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
  });

  // Regression: the cycle-completion XP toast rendered under the sheet and
  // timed out unseen. It must wait until the sheet closes.
  it("shows the cycle XP toast only after the sheet closes", async () => {
    mockFetch(() => Promise.resolve(jsonResponse({ message: "Status updated", xpGained: 15 })));
    const user = userEvent.setup();
    renderJob("interview2");

    await user.click(screen.getByRole("button", { name: "Close as rejected / withdrawn" }));
    const dialog = await screen.findByRole("dialog", { name: "Close this application?" });
    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));
    await screen.findByRole("heading", { name: "Closed." });
    expect(screen.queryByText("+15 XP")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByText("+15 XP")).toBeInTheDocument();
  });

  it("keeps the sheet on step 1 with an inline error when the PATCH fails", async () => {
    mockFetch(() =>
      Promise.resolve(jsonResponse({ message: "Invalid status transition" }, false, 400)),
    );
    const user = userEvent.setup();
    renderJob("interview2");

    await user.click(screen.getByRole("button", { name: "Close as rejected / withdrawn" }));
    const dialog = await screen.findByRole("dialog", { name: "Close this application?" });
    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Couldn’t close it. Try again.",
    );
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close as rejected / withdrawn" })).toBeInTheDocument();
  });

  it("still toasts the server message when advancing a stage fails", async () => {
    mockFetch(() =>
      Promise.resolve(jsonResponse({ message: "Invalid status transition" }, false, 400)),
    );
    const user = userEvent.setup();
    renderJob("interview1");

    await user.click(screen.getByRole("button", { name: "Move to Interview 2" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Invalid status transition"));
  });
});
