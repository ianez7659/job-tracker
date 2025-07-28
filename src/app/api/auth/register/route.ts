import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

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
    data: { email, name, password: hashed },
  });

  return NextResponse.json({ message: "Registration complete." });
}
