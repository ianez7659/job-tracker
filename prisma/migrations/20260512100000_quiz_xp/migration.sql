-- Migration: quiz_xp
-- Adds DAILY_QUIZ_COMPLETED to XpReason enum and xpAwardedAt to DailyQuizSession.
--
-- Apply with: npx prisma migrate deploy
--
-- NOTE: PostgreSQL ALTER TYPE ADD VALUE cannot run inside a transaction.
--       Prisma deploy wraps each migration in a transaction, so we commit
--       the enum change first, then add the column in a separate statement.
--       The migration file is split into two logical sections as a result.

-- 1. Add new enum value (implicit commit — cannot be in a transaction block)
ALTER TYPE "XpReason" ADD VALUE IF NOT EXISTS 'DAILY_QUIZ_COMPLETED';

-- 2. Add xpAwardedAt column to DailyQuizSession (nullable, no default)
ALTER TABLE "DailyQuizSession" ADD COLUMN IF NOT EXISTS "xpAwardedAt" TIMESTAMPTZ;
