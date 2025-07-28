import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") || $("title").text();
    const site = $('meta[property="og:site_name"]').attr("content") || "";
    const image = $('meta[property="og:image"]').attr("content") || "";
    const description =
      $('meta[property="og:description"]').attr("content") || "";

    return NextResponse.json({
      title,
      site,
      image,
      description,
      url,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse URL" }, { status: 500 });
  }
}
