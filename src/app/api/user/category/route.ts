import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_CATEGORY_VALUES } from "@/lib/constants/categories";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category } = body as { category?: string };

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { message: "Missing or invalid category" },
        { status: 400 }
      );
    }

    if (!USER_CATEGORY_VALUES.includes(category as any)) {
      return NextResponse.json(
        { message: "Invalid category value" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { message: "User not found. Try logging out and signing in again." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { category },
    });

    return NextResponse.json({ message: "Category updated", category });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const msg = error instanceof Error ? error.message : "Server error";
    console.error("PATCH /api/user/category error:", code, msg, error);

    if (code === "P2022") {
      return NextResponse.json(
        { message: "Database column 'category' missing. Run: ALTER TABLE \"User\" ADD COLUMN \"category\" TEXT; in your DB." },
        { status: 500 }
      );
    }
    if (code === "P2025") {
      return NextResponse.json(
        { message: "User not found. Try logging out and signing in again." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: process.env.NODE_ENV === "development" ? msg : "Server error" },
      { status: 500 }
    );
  }
}
