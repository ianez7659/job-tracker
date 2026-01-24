import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

// Check environment variables on startup
if (process.env.NODE_ENV === "development") {
  console.log("🔍 Environment check:", {
    hasGithubId: !!process.env.GITHUB_ID,
    hasGithubSecret: !!process.env.GITHUB_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // trustHost: true, // Not available in NextAuth v4, use NEXTAUTH_URL instead
  debug: process.env.NODE_ENV === "development", // Enable debug in development
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 signIn callback called");
        console.log("  - user:", { id: user.id, email: user.email, name: user.name });
        console.log("  - account provider:", account?.provider);
        console.log("  - profile:", profile);
        
        // GitHub의 경우 이메일이 profile에 있을 수 있음
        const email = user.email || (profile as any)?.email;
        console.log("  - resolved email:", email);
        
        if (!email) {
          console.error("❌ No email found for user:", user);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("❌ signIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      try {
        if (user) {
          console.log("🔑 jwt callback - user object from provider", {
            id: user.id,
            email: user.email,
            name: user.name,
            hasImage: !!user.image,
            imageType: user.image?.startsWith("data:") ? "base64" : "url",
          });
          token.id = user.id;
          // Explicitly remove image from user object to prevent it from being stored in token
          // Base64 images are too large for JWT tokens
          // Images will be fetched from DB when needed
          if (user.image) {
            delete (user as any).image;
          }
        }
        return token;
      } catch (error) {
        console.error("❌ jwt callback error:", error);
        return token;
      }
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          // Don't include image in session to avoid cookie size issues
          // Images will be fetched from DB when needed
        }
        return session;
      } catch (error) {
        console.error("❌ session callback error:", error);
        return session;
      }
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 signIn event - user:", user.email, "provider:", account?.provider);
        if (account?.provider === "github" && (profile as any)?.avatar_url) {
          await prisma.user.update({
            where: { email: user.email! }, // or use user.id if reliable
            data: {
              image: (profile as any).avatar_url,
            },
          });
          console.log("✅ User image updated successfully");
        }
      } catch (error) {
        console.error("❌ Error updating user image:", error);
      }
    },
  },
};
