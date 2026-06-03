-- CreateTable
CREATE TABLE "HiredProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiredProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiredOffer" (
    "id" TEXT NOT NULL,
    "hiredProfileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "offerDate" TIMESTAMP(3),
    "employmentType" TEXT,
    "workArrangement" TEXT,
    "salaryRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedByUserId" TEXT,
    "deactivateReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiredOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HiredProfile_userId_key" ON "HiredProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HiredOffer_jobId_key" ON "HiredOffer"("jobId");

-- AddForeignKey
ALTER TABLE "HiredProfile" ADD CONSTRAINT "HiredProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiredOffer" ADD CONSTRAINT "HiredOffer_hiredProfileId_fkey" FOREIGN KEY ("hiredProfileId") REFERENCES "HiredProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiredOffer" ADD CONSTRAINT "HiredOffer_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
