import { act, renderHook } from "@testing-library/react";
import { PHONE_QUERY, useIsPhone } from "./useIsPhone";

type Listener = () => void;

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: PHONE_QUERY,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  window.matchMedia = jest.fn(() => mql) as unknown as typeof window.matchMedia;
  return {
    set(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((l) => l());
    },
    listenerCount: () => listeners.size,
  };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("useIsPhone", () => {
  it("reports true on a phone-width viewport", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(true);
  });

  it("follows viewport changes and stops listening on unmount", () => {
    const media = mockMatchMedia(false);
    const { result, unmount } = renderHook(() => useIsPhone());
    expect(result.current).toBe(false);

    act(() => media.set(true));
    expect(result.current).toBe(true);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("falls back to false when matchMedia is unavailable", () => {
    // jsdom without a polyfill has no matchMedia
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(false);
  });
});
