import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image } = await req.json();
  
  console.log("🔄 API called with:", { email: session.user.email, imageLength: image ? image.length : 0 });

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image },
    });

    console.log("✅ Database updated successfully:", { userId: updatedUser.id, hasImage: !!updatedUser.image });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("❌ Database update failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
