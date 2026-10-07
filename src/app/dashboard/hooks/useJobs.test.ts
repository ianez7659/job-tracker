import { act, renderHook, waitFor } from "@testing-library/react";
import { useJobs } from "./useJobs";

function mockFetchJson(...bodies: unknown[]) {
  const fn = jest.fn();
  bodies.forEach((body) =>
    fn.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useJobs", () => {
  it("loads jobs on mount", async () => {
    mockFetchJson([{ id: "a" }]);
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.jobs).toEqual([{ id: "a" }]);
  });

  it("keeps loading false during a silent refetch so the list stays on screen", async () => {
    mockFetchJson([{ id: "a" }], [{ id: "a" }, { id: "b" }]);
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const loadingStates: boolean[] = [];
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.refetchJobs({ silent: true });
    });
    loadingStates.push(result.current.loading);
    await act(async () => {
      await pending;
    });

    expect(loadingStates).toEqual([false]);
    expect(result.current.jobs).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("shows loading during a normal refetch", async () => {
    mockFetchJson([], []);
    const { result } = renderHook(() => useJobs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.refetchJobs();
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await pending;
    });
    expect(result.current.loading).toBe(false);
  });

  it("falls back to an empty list when the response is not an array", async () => {
    mockFetchJson({ error: "nope" });
    const { result } = renderHook(() => useJobs());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.jobs).toEqual([]);
  });
});
