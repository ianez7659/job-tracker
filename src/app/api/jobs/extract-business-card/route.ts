import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import {
  parseBusinessCardJson,
  type BusinessCardFields,
} from "@/lib/businessCardExtract";

/** In-memory only; image bytes are never written to disk, DB, or blob storage. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const OPENAI_TIMEOUT_MS = 40000;

const VISION_PROMPT = `You are reading a business card image. Extract structured data.
Return a single JSON object with exactly these keys: "name" (person's name), "company" (organization), "email", "phone".
Use JSON null for any field you cannot read with confidence. Do not guess or invent contact information.
If the image is not a business card, still return the four keys with null values where unknown.`;

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OpenAI API key not configured" },
        { status: 503 },
      );
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { message: "Expected multipart/form-data with image field" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const entry = formData.get("image");
    if (!entry || !(entry instanceof File)) {
      return NextResponse.json(
        { message: "Missing image file (field name: image)" },
        { status: 400 },
      );
    }

    if (entry.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: `Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024}MB)` },
        { status: 400 },
      );
    }

    const mime = entry.type || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image (jpeg, png, or webp)" },
        { status: 400 },
      );
    }

    const arrayBuffer = await entry.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "high" },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Card extraction timed out")), OPENAI_TIMEOUT_MS);
      }),
    ]);

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseBusinessCardJson(raw);
    if (!parsed) {
      return NextResponse.json(
        { message: "Could not parse extraction result" },
        { status: 502 },
      );
    }

    const fields: BusinessCardFields = parsed;
    return NextResponse.json({ fields });
  } catch (err) {
    console.error("extract-business-card:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
