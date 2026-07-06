import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSafePublicHttpUrl } from "@/lib/companyResearch/ssrf";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 },
    );
  }

  if (!isSafePublicHttpUrl(url)) {
    return NextResponse.json(
      { error: "URL is not allowed" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
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
  } catch {
    return NextResponse.json({ error: "Failed to parse URL" }, { status: 500 });
  }
}
