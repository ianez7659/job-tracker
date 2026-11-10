import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { ADVANCE_UNDO_MS, useStageAdvance } from "./useStageAdvance";

jest.mock("sonner", () => {
  const toastFn = jest.fn(() => "toast-1") as jest.Mock & {
    error: jest.Mock;
    dismiss: jest.Mock;
  };
  toastFn.error = jest.fn();
  toastFn.dismiss = jest.fn();
  return { toast: toastFn };
});

type ToastOptions = {
  description: string;
  duration: number;
  action: { label: string; onClick: () => void };
};

const mockedToast = toast as unknown as jest.Mock & { error: jest.Mock; dismiss: jest.Mock };

function mockFetch(response: { ok: boolean; body?: unknown } | Error) {
  const fn = jest.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve({
          ok: response.ok,
          json: () => Promise.resolve(response.body ?? {}),
        }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function setup() {
  const onLocalStatus = jest.fn();
  const onCommitted = jest.fn();
  const utils = renderHook(() => useStageAdvance({ onLocalStatus, onCommitted }));
  return { ...utils, onLocalStatus, onCommitted };
}

const job = { id: "job-1", company: "Acme", status: "resume" };

/** Let the fetch promise chain settle. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useStageAdvance", () => {
  it("moves the card at once and offers Undo, without sending anything yet", () => {
    const fetchMock = mockFetch({ ok: true });
    const { result, onLocalStatus } = setup();

    act(() => result.current.advance(job));

    expect(onLocalStatus).toHaveBeenCalledWith("job-1", "interview1");
    expect(result.current.pendingIds.has("job-1")).toBe(true);
    const [message, options] = mockedToast.mock.calls[0] as [string, ToastOptions];
    expect(message).toBe("Moved to Interview 1");
    expect(options.description).toBe("Acme");
    expect(options.duration).toBe(ADVANCE_UNDO_MS);
    expect(options.action.label).toBe("Undo");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends one status-only PATCH when the Undo window closes", async () => {
    const fetchMock = mockFetch({ ok: true, body: { xpGained: 0 } });
    const { result, onCommitted } = setup();

    act(() => result.current.advance(job));
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "interview1" }),
      }),
    );
    expect(mockedToast.dismiss).toHaveBeenCalledWith("toast-1");
    expect(onCommitted).toHaveBeenCalledWith("job-1", "interview1", 0);
    expect(result.current.pendingIds.size).toBe(0);
  });

  it("Undo restores the stage and cancels the request", () => {
    const fetchMock = mockFetch({ ok: true });
    const { result, onLocalStatus } = setup();

    act(() => result.current.advance(job));
    const options = mockedToast.mock.calls[0][1] as ToastOptions;
    act(() => options.action.onClick());
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS * 2));

    expect(onLocalStatus).toHaveBeenLastCalledWith("job-1", "resume");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.pendingIds.size).toBe(0);
  });

  it("reverts the card and explains when the server refuses", async () => {
    mockFetch({ ok: false, body: { message: "Invalid status transition" } });
    const { result, onLocalStatus, onCommitted } = setup();

    act(() => result.current.advance(job));
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));
    await settle();

    expect(onLocalStatus).toHaveBeenLastCalledWith("job-1", "resume");
    expect(mockedToast.error).toHaveBeenCalledWith("Invalid status transition");
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("reverts on a network failure", async () => {
    mockFetch(new Error("offline"));
    const { result, onLocalStatus } = setup();

    act(() => result.current.advance(job));
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));
    await settle();

    expect(onLocalStatus).toHaveBeenLastCalledWith("job-1", "resume");
    expect(mockedToast.error).toHaveBeenCalledWith("Could not update stage");
  });

  it("ignores a second tap while the first move is pending", async () => {
    const fetchMock = mockFetch({ ok: true });
    const { result, onLocalStatus } = setup();

    act(() => result.current.advance(job));
    act(() => result.current.advance({ ...job, status: "interview1" }));
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));
    await settle();

    expect(onLocalStatus).toHaveBeenCalledTimes(1);
    expect(mockedToast).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["applying", "interview3", "offer", "rejected"])(
    "does nothing for %s, which has no one-tap next stage",
    (status) => {
      const fetchMock = mockFetch({ ok: true });
      const { result, onLocalStatus } = setup();

      act(() => result.current.advance({ ...job, status }));
      act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));

      expect(onLocalStatus).not.toHaveBeenCalled();
      expect(mockedToast).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("flush sends a pending move immediately and resolves after it", async () => {
    const fetchMock = mockFetch({ ok: true });
    const { result, onCommitted } = setup();

    act(() => result.current.advance(job));
    await act(async () => {
      await result.current.flush("job-1");
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onCommitted).toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(ADVANCE_UNDO_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("flush is a no-op when nothing is pending", async () => {
    const fetchMock = mockFetch({ ok: true });
    const { result } = setup();
    await act(async () => {
      await result.current.flush("job-1");
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends pending moves with keepalive when the board unmounts", () => {
    const fetchMock = mockFetch({ ok: true });
    const { result, unmount } = setup();

    act(() => result.current.advance(job));
    unmount();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({ keepalive: true }),
    );
    jest.advanceTimersByTime(ADVANCE_UNDO_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends pending moves when the page is hidden for good", () => {
    const fetchMock = mockFetch({ ok: true });
    const { result } = setup();

    act(() => result.current.advance(job));
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({ keepalive: true }),
    );
  });
});
