import {
  isChunkLoadError,
  reloadOnceForChunkError,
  RELOAD_COOLDOWN_MS,
} from "./chunkError";

describe("isChunkLoadError", () => {
  it("matches by error name", () => {
    const err = new Error("boom");
    err.name = "ChunkLoadError";
    expect(isChunkLoadError(err)).toBe(true);
  });

  it("matches common chunk/module failure messages", () => {
    expect(isChunkLoadError(new Error("Loading chunk 42 failed."))).toBe(true);
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module: /_next/x.js")),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("error loading dynamically imported module")),
    ).toBe(true);
    // iOS / Safari wording.
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
  });

  it("accepts plain strings and message-bearing objects", () => {
    expect(isChunkLoadError("ChunkLoadError: Loading chunk 3 failed")).toBe(true);
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "x" })).toBe(true);
  });

  it("returns false for unrelated or empty errors", () => {
    expect(isChunkLoadError(new Error("TypeError: x is not a function"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError({})).toBe(false);
  });
});

describe("reloadOnceForChunkError", () => {
  const reloadMock = jest.fn();

  beforeEach(() => {
    reloadMock.mockClear();
    window.sessionStorage.clear();
  });

  it("reloads once and records a timestamp", () => {
    const scheduled = reloadOnceForChunkError(1_000, reloadMock);
    expect(scheduled).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("does not reload again within the cooldown window", () => {
    reloadOnceForChunkError(1_000, reloadMock);
    const second = reloadOnceForChunkError(1_000 + RELOAD_COOLDOWN_MS - 1, reloadMock);
    expect(second).toBe(false);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("reloads again after the cooldown passes (later deploy, same tab)", () => {
    reloadOnceForChunkError(1_000, reloadMock);
    const later = reloadOnceForChunkError(1_000 + RELOAD_COOLDOWN_MS + 1, reloadMock);
    expect(later).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(2);
  });

  it("does not reload when sessionStorage is unavailable (loop-safe)", () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    try {
      expect(reloadOnceForChunkError(1_000, reloadMock)).toBe(false);
      expect(reloadMock).not.toHaveBeenCalled();
    } finally {
      getItem.mockRestore();
    }
  });
});
