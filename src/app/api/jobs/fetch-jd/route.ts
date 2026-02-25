import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { message: "Missing or invalid url parameter" },
        { status: 400 }
      );
    }

    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return NextResponse.json(
        { message: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    const res = await fetch(trimmed, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to fetch URL" },
        { status: 422 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer for cleaner text
    $("script, style, nav, footer, [role='navigation']").remove();
    const body = $("body").text() || $("html").text() || "";

    const text = body
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    if (!text || text.length < 50) {
      return NextResponse.json(
        { message: "Could not extract enough text from page" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("fetch-jd error:", err);
    return NextResponse.json(
      { message: "Could not fetch or parse the URL" },
      { status: 500 }
    );
  }
}
