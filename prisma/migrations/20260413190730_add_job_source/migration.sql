-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('ONLINE', 'WALK_IN');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "source" "JobSource" NOT NULL DEFAULT 'ONLINE';
