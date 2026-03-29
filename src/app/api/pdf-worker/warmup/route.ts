import { NextResponse } from "next/server";

/** Wake cold PDF worker (e.g. Render free tier) before user clicks match. */
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  const base = process.env.PDF_WORKER_URL?.replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json({ ok: false, skipped: true });
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12_000);
    const res = await fetch(`${base}/health`, {
      method: "GET",
      signal: ac.signal,
    }).finally(() => clearTimeout(t));
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
