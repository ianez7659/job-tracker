-- Daily XP: local 5:00-anchored "day" (IANA timezone from client) + idempotency key
ALTER TABLE "UserXp" ADD COLUMN IF NOT EXISTS "dailyTimeZone" TEXT;
ALTER TABLE "UserXp" ADD COLUMN IF NOT EXISTS "lastDailyPeriodKey" TEXT;
