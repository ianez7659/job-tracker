import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "application/x-pdf"];
const PDF_EXT = ".pdf";
const VERCEL_BLOB_URL_PATTERN = /blob\.vercel-storage\.com/i;
const LOCAL_UPLOAD_DIR = "public/uploads/resumes";

/** Reduce "first match fails, second works" when the worker hits the Blob URL before CDN is ready. */
async function waitUntilVercelBlobLikelyReadable(url: string): Promise<void> {
  if (!VERCEL_BLOB_URL_PATTERN.test(url)) return;
  for (let i = 0; i < 6; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 300 * i));
    }
    try {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 10_000);
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal: ac.signal,
      }).finally(() => clearTimeout(to));
      if (res.ok || res.status === 206) return;
    } catch {
      /* try again */
    }
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") ?? formData.get("resume");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Use field 'file' or 'resume'." },
      { status: 400 }
    );
  }

  const isPdf =
    ALLOWED_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(PDF_EXT);
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 5MB." },
      { status: 400 }
    );
  }

  try {
    const job = await prisma.job.findFirst({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const previousUrl = (job as { resumeFile?: string | null }).resumeFile ?? null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const pathname = `resumes/${jobId}-${Date.now()}.pdf`;
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
      });

      if (previousUrl && VERCEL_BLOB_URL_PATTERN.test(previousUrl)) {
        try {
          await del(previousUrl);
        } catch (delErr) {
          console.warn("Failed to delete previous resume from Blob:", delErr);
        }
      }

      await updateJobResumeFile(jobId, blob.url);
      await waitUntilVercelBlobLikelyReadable(blob.url);
      return NextResponse.json({ success: true, url: blob.url });
    }

    // Fallback: save to local public/uploads/resumes (for open/local testing)
    const dir = path.join(process.cwd(), LOCAL_UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const filename = `${jobId}-${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    if (previousUrl && previousUrl.startsWith("/uploads/")) {
      try {
        const prevPath = path.join(process.cwd(), "public", previousUrl.replace(/^\//, ""));
        await unlink(prevPath);
      } catch {
        // ignore
      }
    }

    const url = `/uploads/resumes/${filename}`;
    await updateJobResumeFile(jobId, url);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Resume upload error:", err);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "development" ? message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

async function updateJobResumeFile(jobId: string, value: string | null) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { resumeFile: value },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("42703") ||
      msg.includes("P2022") ||
      (msg.includes("resumeFile") && msg.includes("does not exist"))
    ) {
      throw new Error(
        "Resume feature unavailable: the database is missing the resumeFile column. Run: npx prisma migrate deploy"
      );
    }
    throw e;
  }
}
