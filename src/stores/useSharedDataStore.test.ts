import { renderHook, act } from "@testing-library/react";
import { useSharedDataStore } from "./useSharedDataStore";

// Reset Zustand store state between tests
afterEach(() => {
  act(() => {
    useSharedDataStore.getState().clearSharedData();
  });
});

describe("useSharedDataStore", () => {
  it("starts with empty / false state", () => {
    const { sharedUrl, sharedJd, isSharedEntry } = useSharedDataStore.getState();
    expect(sharedUrl).toBe("");
    expect(sharedJd).toBe("");
    expect(isSharedEntry).toBe(false);
  });

  it("setSharedData populates fields and sets isSharedEntry=true", () => {
    act(() => {
      useSharedDataStore.getState().setSharedData("https://example.com/job", "Job desc text");
    });
    const state = useSharedDataStore.getState();
    expect(state.sharedUrl).toBe("https://example.com/job");
    expect(state.sharedJd).toBe("Job desc text");
    expect(state.isSharedEntry).toBe(true);
  });

  it("clearSharedData resets all fields", () => {
    act(() => {
      useSharedDataStore.getState().setSharedData("https://example.com/job", "desc");
    });
    act(() => {
      useSharedDataStore.getState().clearSharedData();
    });
    const state = useSharedDataStore.getState();
    expect(state.sharedUrl).toBe("");
    expect(state.sharedJd).toBe("");
    expect(state.isSharedEntry).toBe(false);
  });

  it("works correctly via renderHook", () => {
    const { result } = renderHook(() => useSharedDataStore());

    act(() => {
      result.current.setSharedData("https://jobs.example.com/123", "We are looking for a developer");
    });

    expect(result.current.isSharedEntry).toBe(true);
    expect(result.current.sharedUrl).toBe("https://jobs.example.com/123");
    expect(result.current.sharedJd).toBe("We are looking for a developer");
  });
});
