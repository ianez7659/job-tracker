/**
 * @jest-environment node
 */
import { checkRateLimit, rateLimitResponse, _resetStore } from "./rateLimit";

afterEach(() => {
  _resetStore();
});

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const r1 = checkRateLimit("user-1", 3, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit("user-1", 3, 60_000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit("user-1", 3, 60_000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-2", 3, 60_000);
    }
    const r = checkRateLimit("user-2", 3, 60_000);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates keys from each other", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-a", 3, 60_000);
    }
    const blocked = checkRateLimit("user-a", 3, 60_000);
    expect(blocked.allowed).toBe(false);

    const other = checkRateLimit("user-b", 3, 60_000);
    expect(other.allowed).toBe(true);
  });

  it("allows requests again after the window expires", () => {
    jest.useFakeTimers();
    try {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("user-3", 3, 1000);
      }
      expect(checkRateLimit("user-3", 3, 1000).allowed).toBe(false);

      jest.advanceTimersByTime(1001);
      expect(checkRateLimit("user-3", 3, 1000).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with Retry-After header", async () => {
    const res = rateLimitResponse(30_000);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = await res.json();
    expect(body.message).toContain("Too many requests");
  });

  it("defaults Retry-After to 60 when null", async () => {
    const res = rateLimitResponse(null);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
