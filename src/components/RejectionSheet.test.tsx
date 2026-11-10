import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RejectionSheet, { CLOSE_FAILED_MESSAGE } from "./RejectionSheet";

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

const JOBS = [
  { status: "resume", deletedAt: null },
  { status: "interview2", deletedAt: null },
  { status: "rejected", deletedAt: "2026-11-01", cycleEndStage: "interview1" },
  { status: "interview1", deletedAt: "2026-11-01" }, // trash: excluded
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body };
}

function mockFetch({
  jobs = JOBS as unknown,
  streak = 4 as unknown,
  jobsOk = true,
  summaryOk = true,
  pending = false,
}: {
  jobs?: unknown;
  streak?: unknown;
  jobsOk?: boolean;
  summaryOk?: boolean;
  pending?: boolean;
} = {}) {
  const fn = jest.fn((url: string) => {
    if (pending) return new Promise(() => {});
    if (url.startsWith("/api/jobs/all")) return Promise.resolve(jsonResponse(jobs, jobsOk));
    if (url.startsWith("/api/xp/summary"))
      return Promise.resolve(jsonResponse({ loginStreak: streak }, summaryOk));
    return Promise.reject(new Error(`unexpected ${url}`));
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

/** Renders a trigger button that opens the sheet, like the job page does. */
function Harness({
  onConfirm,
  onClose = jest.fn(),
}: {
  onConfirm: () => Promise<void>;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Close as rejected / withdrawn
      </button>
      <RejectionSheet
        open={open}
        onConfirm={onConfirm}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      />
    </>
  );
}

async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Close as rejected / withdrawn" }));
  return screen.findByRole("dialog", { name: "Close this application?" });
}

const originalFetch = global.fetch;

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("RejectionSheet", () => {
  it("renders nothing while closed", () => {
    mockFetch();
    render(<RejectionSheet open={false} onConfirm={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("opens as a labelled modal dialog with the approved copy and focuses Keep it open", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} />);
    const dialog = await openSheet(user);

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("It moves to Closed. Your notes stay with it.");
    expect(within(dialog).getByRole("button", { name: "Close as rejected" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Keep it open" })).toHaveFocus();
  });

  it("shows the effort numbers from jobs and the login streak", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} />);
    const dialog = await openSheet(user);

    const sent = await within(dialog).findByText("applications sent");
    await waitFor(() => expect(sent.nextElementSibling).toHaveTextContent("3"));
    expect(within(dialog).getByText("interviews reached").nextElementSibling).toHaveTextContent("2");
    expect(within(dialog).getByText("day streak").nextElementSibling).toHaveTextContent("4");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/xp\/summary\?timeZone=/),
      expect.anything(),
    );
  });

  it("shows a quiet loading state while the numbers load", async () => {
    mockFetch({ pending: true });
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} />);
    const dialog = await openSheet(user);

    const list = within(dialog).getByText("day streak").closest("dl");
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(within(dialog).getByRole("button", { name: "Close as rejected" })).toBeEnabled();
  });

  it.each([
    ["the jobs request fails", { jobsOk: false }],
    ["the summary request fails", { summaryOk: false }],
    ["the streak is not a number", { streak: "4" }],
    ["the jobs payload is not a list", { jobs: { message: "nope" } }],
  ])("omits the numbers but still works when %s", async (_label, options) => {
    mockFetch(options);
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);
    const dialog = await openSheet(user);

    await waitFor(() => expect(within(dialog).queryByText("day streak")).not.toBeInTheDocument());
    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes from Keep it open, Escape, and the backdrop and returns focus to the trigger", async () => {
    mockFetch();
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Close as rejected / withdrawn" });

    await openSheet(user);
    await user.click(screen.getByRole("button", { name: "Keep it open" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();

    await openSheet(user);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await openSheet(user);
    await user.click(screen.getByTestId("rejection-sheet-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("traps Tab inside the sheet", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} />);
    const dialog = await openSheet(user);
    const confirm = within(dialog).getByRole("button", { name: "Close as rejected" });
    const keep = within(dialog).getByRole("button", { name: "Keep it open" });

    expect(keep).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab({ shift: true });
    expect(keep).toHaveFocus();
  });

  it("shows Closing… while pending and blocks closing", async () => {
    mockFetch();
    let finish: () => void = () => {};
    const onConfirm = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} onClose={onClose} />);
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));
    expect(within(dialog).getByRole("button", { name: "Closing…" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByRole("heading", { name: "Closed." })).toBeInTheDocument();
  });

  it("moves to step 2 with the next actions on success", async () => {
    mockFetch();
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} onClose={onClose} />);
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));

    const title = await screen.findByRole("heading", { name: "Closed." });
    expect(title).toHaveFocus();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("That took effort. What’s next?");
    expect(screen.getByRole("link", { name: "Add a new job" })).toHaveAttribute(
      "href",
      "/dashboard?newJob=auto",
    );
    expect(screen.getByRole("link", { name: "Start today’s drill" })).toHaveAttribute(
      "href",
      "/dashboard/interview-drill",
    );

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays on step 1 with an inline error when closing fails, then allows a retry", async () => {
    mockFetch();
    const onConfirm = jest
      .fn()
      .mockRejectedValueOnce(new Error("Status update failed"))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(CLOSE_FAILED_MESSAGE);
    expect(alert).not.toHaveTextContent(/Status update failed/);
    expect(within(dialog).getByRole("heading", { name: "Close this application?" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close as rejected" }));
    expect(await screen.findByRole("heading", { name: "Closed." })).toBeInTheDocument();
  });

  it("locks page scroll while open and restores it on close", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<Harness onConfirm={jest.fn()} />);
    await openSheet(user);
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Keep it open" }));
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });
});
