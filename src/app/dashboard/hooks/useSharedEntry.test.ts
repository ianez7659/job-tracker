/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSharedEntry } from "./useSharedEntry";
import { useSharedDataStore } from "@/stores/useSharedDataStore";

// Reset store between tests
afterEach(() => {
  act(() => {
    useSharedDataStore.getState().clearSharedData();
  });
  // Reset URL
  window.history.replaceState(null, "", "/dashboard");
});

// Helper to set window location search
function setSearch(search: string) {
  window.history.replaceState(null, "", `/dashboard${search}`);
}

// Helper to mock clipboard
function mockClipboard(text: string) {
  Object.defineProperty(navigator, "clipboard", {
    value: { readText: jest.fn().mockResolvedValue(text) },
    configurable: true,
  });
}

function mockClipboardError(name: string) {
  const err = Object.assign(new Error(name), { name });
  Object.defineProperty(navigator, "clipboard", {
    value: { readText: jest.fn().mockRejectedValue(err) },
    configurable: true,
  });
}

function removeClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
}

describe("useSharedEntry", () => {
  it("does nothing when no share params and clipboard is empty", async () => {
    mockClipboard("");
    renderHook(() => useSharedEntry());
    await waitFor(() => {
      expect(useSharedDataStore.getState().isSharedEntry).toBe(false);
    });
  });

  it("captures share_url from query params", async () => {
    setSearch("?share_url=https%3A%2F%2Fexample.com%2Fjob");
    mockClipboard(""); // no JD

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      const state = useSharedDataStore.getState();
      expect(state.isSharedEntry).toBe(true);
      expect(state.sharedUrl).toBe("https://example.com/job");
    });
  });

  it("clears share_url from the address bar after capture", async () => {
    setSearch("?share_url=https%3A%2F%2Fexample.com%2Fjob");
    mockClipboard("");

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      expect(useSharedDataStore.getState().isSharedEntry).toBe(true);
    });

    expect(window.location.search).toBe("");
  });

  it("captures valid clipboard JD (>=200 chars)", async () => {
    const longJd = "a".repeat(200);
    mockClipboard(longJd);

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      const state = useSharedDataStore.getState();
      expect(state.isSharedEntry).toBe(true);
      expect(state.sharedJd).toBe(longJd);
    });
  });

  it("captures clipboard JD matching job keywords (short text)", async () => {
    mockClipboard("We are looking for a senior developer");

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      const state = useSharedDataStore.getState();
      expect(state.isSharedEntry).toBe(true);
      expect(state.sharedJd).toBe("We are looking for a senior developer");
    });
  });

  it("ignores clipboard text that is not a JD (<200 chars, no keywords)", async () => {
    mockClipboard("hello world");

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      expect(useSharedDataStore.getState().isSharedEntry).toBe(false);
    });
  });

  it("handles clipboard NotAllowedError gracefully", async () => {
    mockClipboardError("NotAllowedError");

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      expect(useSharedDataStore.getState().isSharedEntry).toBe(false);
    });
  });

  it("handles missing clipboard API gracefully", async () => {
    removeClipboard();

    renderHook(() => useSharedEntry());

    await waitFor(() => {
      expect(useSharedDataStore.getState().isSharedEntry).toBe(false);
    });
  });

  it("does not re-trigger if isSharedEntry is already true", async () => {
    // Pre-set store as if already triggered
    act(() => {
      useSharedDataStore.getState().setSharedData("https://existing.com", "existing jd");
    });

    setSearch("?share_url=https%3A%2F%2Fnew.com%2Fjob");
    mockClipboard("new jd text that is more than 200 chars " + "x".repeat(200));

    renderHook(() => useSharedEntry());

    // Give it time to potentially (incorrectly) run
    await new Promise((r) => setTimeout(r, 50));

    const state = useSharedDataStore.getState();
    // Should still have the original data, not overwritten
    expect(state.sharedUrl).toBe("https://existing.com");
  });
});
