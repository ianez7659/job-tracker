import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    let body: { email?: string; name?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, name, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email address / password" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "This email already exists." },
        { status: 400 }
      );
    }

    const hashed = await hash(password, 10);

    await prisma.user.create({
      data: { email, name: name ?? null, password: hashed },
    });

    return NextResponse.json({ message: "Registration complete." });
  } catch (err) {
    console.error("Register error:", err);
    const message =
      err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
