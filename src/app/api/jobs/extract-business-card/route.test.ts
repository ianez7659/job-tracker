/**
 * @jest-environment node
 */
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const mockCreate = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: class {
    chat = {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    };
  },
}));

const { getServerSession } = require("next-auth");
import { POST } from "./route";

describe("POST /api/jobs/extract-business-card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const fd = new FormData();
    fd.append("image", new File([Buffer.from("x")], "x.jpg", { type: "image/jpeg" }));
    const res = await POST(
      new Request("http://localhost/api/jobs/extract-business-card", {
        method: "POST",
        body: fd,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when image field missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "u@test.com" },
    });
    const fd = new FormData();
    const res = await POST(
      new Request("http://localhost/api/jobs/extract-business-card", {
        method: "POST",
        body: fd,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns fields when OpenAI returns JSON", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "u@test.com" },
    });
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Pat",
              company: "Co",
              email: "p@co.com",
              phone: "+99",
            }),
          },
        },
      ],
    });

    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const fd = new FormData();
    fd.append(
      "image",
      new File([jpeg], "card.jpg", { type: "image/jpeg" }),
    );

    const res = await POST(
      new Request("http://localhost/api/jobs/extract-business-card", {
        method: "POST",
        body: fd,
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fields).toEqual({
      name: "Pat",
      company: "Co",
      email: "p@co.com",
      phone: "+99",
    });
    expect(mockCreate).toHaveBeenCalled();
  });
});
