-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "categoryGroup" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "choices" JSONB NOT NULL,
    "correctChoiceId" TEXT NOT NULL,
    "correctExplanation" TEXT NOT NULL,
    "wrongExplanations" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuizSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryGroup" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "completedQuestions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DailyQuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuizSessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT,
    "sourceType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "renderedQuestionSnapshot" TEXT NOT NULL,
    "choicesSnapshot" JSONB NOT NULL,
    "correctChoiceIdSnapshot" TEXT NOT NULL,
    "correctIndexSnapshot" INTEGER NOT NULL,
    "correctExplanationSnapshot" TEXT NOT NULL,
    "wrongExplanationsSnapshot" JSONB NOT NULL,
    "userAnswerChoiceId" TEXT,
    "userAnswerIndex" INTEGER,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "DailyQuizSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_sourceId_key" ON "QuizQuestion"("sourceId");

-- CreateIndex
CREATE INDEX "QuizQuestion_category_difficulty_idx" ON "QuizQuestion"("category", "difficulty");

-- CreateIndex
CREATE INDEX "QuizQuestion_categoryGroup_idx" ON "QuizQuestion"("categoryGroup");

-- CreateIndex
CREATE INDEX "DailyQuizSession_userId_dateKey_idx" ON "DailyQuizSession"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuizSession_userId_dateKey_category_key" ON "DailyQuizSession"("userId", "dateKey", "category");

-- CreateIndex
CREATE INDEX "DailyQuizSessionItem_sessionId_orderIndex_idx" ON "DailyQuizSessionItem"("sessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "DailyQuizSession" ADD CONSTRAINT "DailyQuizSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuizSessionItem" ADD CONSTRAINT "DailyQuizSessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailyQuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuizSessionItem" ADD CONSTRAINT "DailyQuizSessionItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
