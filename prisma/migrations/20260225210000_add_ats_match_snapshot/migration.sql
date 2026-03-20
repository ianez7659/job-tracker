-- CreateTable
CREATE TABLE "AtsMatchSnapshot" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "AtsMatchSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtsMatchSnapshot_jobId_createdAt_idx" ON "AtsMatchSnapshot"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "AtsMatchSnapshot" ADD CONSTRAINT "AtsMatchSnapshot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
