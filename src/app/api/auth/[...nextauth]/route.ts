import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Import your NextAuth configuration

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
