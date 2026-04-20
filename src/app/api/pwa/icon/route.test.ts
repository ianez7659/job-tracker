/**
 * @jest-environment node
 */
import { GET } from "./route";

jest.mock("@/lib/pwa/appIconImageResponse", () => ({
  appIconImageResponse: jest.fn((size: number) => new Response(`icon-${size}`, { status: 200 })),
}));

function makeRequest(size?: string) {
  const url = size
    ? `http://localhost/api/pwa/icon?size=${size}`
    : "http://localhost/api/pwa/icon";
  return new Request(url);
}

describe("GET /api/pwa/icon", () => {
  it("returns 400 when size param is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 for a disallowed size", async () => {
    const res = await GET(makeRequest("100"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-numeric size", async () => {
    const res = await GET(makeRequest("large"));
    expect(res.status).toBe(400);
  });

  it("returns 200 for size 192", async () => {
    const res = await GET(makeRequest("192"));
    expect(res.status).toBe(200);
  });

  it("returns 200 for size 512", async () => {
    const res = await GET(makeRequest("512"));
    expect(res.status).toBe(200);
  });
});
