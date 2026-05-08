import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";

function envTrim(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

function getStringProp(
  value: unknown,
  key: string,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const prop = record[key];
  return typeof prop === "string" ? prop : undefined;
}

// Logs SIGNIN_OAUTH_ERROR with the real exception (see Vercel function logs).
const nextAuthLogger: NextAuthOptions["logger"] = {
  error(
    code: string,
    metadata:
      | Error
      | {
          error: Error;
          [key: string]: unknown;
        }
  ) {
    if (metadata instanceof Error) {
      console.error("[next-auth]", code, metadata.message, metadata.stack);
      return;
    }
    if (metadata.error instanceof Error) {
      console.error(
        "[next-auth]",
        code,
        metadata.error.message,
        metadata.error.stack,
        metadata
      );
      return;
    }
    console.error("[next-auth]", code, metadata);
  },
};

// Check environment variables on startup
if (process.env.NODE_ENV === "development") {
  console.log("🔍 Environment check:", {
    hasGithubId: !!process.env.GITHUB_ID,
    hasGithubSecret: !!process.env.GITHUB_SECRET,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // trustHost: true, // Not available in NextAuth v4, use NEXTAUTH_URL instead
  debug:
    process.env.NODE_ENV === "development" ||
    process.env.NEXTAUTH_DEBUG === "1",
  logger: nextAuthLogger,
  pages: {
    signIn: "/login",
  },
  providers: [
    GithubProvider({
      clientId: envTrim("GITHUB_ID")!,
      clientSecret: envTrim("GITHUB_SECRET")!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    GoogleProvider({
      clientId: envTrim("GOOGLE_CLIENT_ID")!,
      clientSecret: envTrim("GOOGLE_CLIENT_SECRET")!,
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
  secret: envTrim("NEXTAUTH_SECRET"),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 signIn callback called");
        console.log("  - user:", { id: user.id, email: user.email, name: user.name });
        console.log("  - account provider:", account?.provider);
        console.log("  - profile:", profile);
        
        const email = user.email || getStringProp(profile, "email");
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
          if (user.email) {
            token.email = user.email;
          }
          // Explicitly remove image from user object to prevent it from being stored in token
          // Base64 images are too large for JWT tokens
          // Images will be fetched from DB when needed
          if (user.image) {
            delete (user as Partial<User>).image;
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
          if (token.id) {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id },
                select: {
                  email: true,
                  category: true,
                  image: true,
                  name: true,
                  hubStatus: true,
                  headline: true,
                },
              });
              if (dbUser) {
                if (dbUser.email) {
                  session.user.email = dbUser.email;
                }
                session.user.category = dbUser.category;
                session.user.name = dbUser.name;
                session.user.hubStatus = dbUser.hubStatus;
                session.user.headline = dbUser.headline;
                session.user.image = dbUser.image;
              }
            } catch (dbErr: unknown) {
              // P2022 = column missing in DB (migration not yet applied).
              // Fallback: re-query with only the core fields that are guaranteed to exist.
              // Do NOT wipe category based on an unrelated column being missing.
              if ((dbErr as { code?: string })?.code !== "P2022") throw dbErr;
              console.warn("[auth] session DB read P2022 — falling back to minimal select", dbErr);
              try {
                const fallback = await prisma.user.findUnique({
                  where: { id: token.id },
                  select: { email: true, category: true, image: true, name: true },
                });
                if (fallback) {
                  if (fallback.email) session.user.email = fallback.email;
                  session.user.category = fallback.category;
                  session.user.name = fallback.name;
                  session.user.image = fallback.image;
                }
              } catch {
                // If even the minimal select fails, leave session as-is
              }
            }
          }
          if (
            (!session.user.email || session.user.email === "") &&
            typeof token.email === "string" &&
            token.email
          ) {
            session.user.email = token.email;
          }
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
        const avatarUrl = getStringProp(profile, "avatar_url");
        if (account?.provider === "github" && avatarUrl) {
          await prisma.user.update({
            where: { email: user.email! }, // or use user.id if reliable
            data: {
              image: avatarUrl,
            },
          });
          console.log("✅ User image updated successfully");
        }
        const pictureUrl = getStringProp(profile, "picture");
        if (account?.provider === "google" && pictureUrl) {
          await prisma.user.update({
            where: { email: user.email! },
            data: {
              image: pictureUrl,
            },
          });
          console.log("✅ Google user image updated successfully");
        }
      } catch (error) {
        console.error("❌ Error updating user image:", error);
      }
    },
  },
};
