import { PrismaClient } from "@/generated/prisma"; // Import the generated PrismaClient

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log DATABASE_URL in development (without password)
if (process.env.NODE_ENV === "development") {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
    console.log("🔍 Prisma connecting to:", maskedUrl);
  } else {
    console.error("❌ DATABASE_URL is not set!");
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
