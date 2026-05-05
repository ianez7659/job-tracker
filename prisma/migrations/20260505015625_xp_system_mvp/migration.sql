-- CreateEnum
CREATE TYPE "XpReason" AS ENUM ('DAILY_ACTIVITY', 'JOB_CREATED', 'JOB_CREATED_COMPLETE', 'CYCLE_COMPLETED', 'CYCLE_INTERVIEW_BONUS', 'CYCLE_NOTE_BONUS', 'WEEKLY_REVIEW');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cycleEndStage" TEXT;

-- CreateTable
CREATE TABLE "UserXp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "lastDailyAt" TIMESTAMP(3),

    CONSTRAINT "UserXp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userXpId" TEXT NOT NULL,
    "reason" "XpReason" NOT NULL,
    "amount" INTEGER NOT NULL,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserXp_userId_key" ON "UserXp"("userId");

-- CreateIndex
CREATE INDEX "XpEvent_userXpId_createdAt_idx" ON "XpEvent"("userXpId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserXp" ADD CONSTRAINT "UserXp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userXpId_fkey" FOREIGN KEY ("userXpId") REFERENCES "UserXp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
