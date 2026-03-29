import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Prisma + full Node crypto for NextAuth; avoid edge surprises.
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
