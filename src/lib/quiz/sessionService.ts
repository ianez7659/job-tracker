/**
 * sessionService.ts
 *
 * DB-aware service for Daily Interview Quiz sessions.
 *
 * Public API:
 *   getOrCreateTodayQuizSession(userId, timeZone)
 *   answerQuizItem(sessionItemId, userId, answerChoiceId)
 *   computeSessionProgress(sessionId)
 *
 * Design notes:
 *   - dateKey uses getDailyPeriodKey() from XP system (same 5:00 AM anchor).
 *   - AI slot stub always returns null → usedAiFallback = true in Step 2.
 *   - Snapshot fields are written once at session creation and never mutated.
 *   - Errors are surfaced as typed result objects (not thrown), matching the
 *     xp/service.ts pattern.
 */

import { prisma } from "@/lib/prisma";
import type { DailyQuizSession, DailyQuizSessionItem } from "@/generated/prisma";
// DailyQuizSession and DailyQuizSessionItem used for return types below
import { getDailyPeriodKey } from "@/lib/xp/dailyPeriod";
import { UserCategoryValue } from "@/lib/constants/categories";
import {
  buildQuestionPool,
  selectQuizQuestions,
  getCategoryGroupForUser,
  getDbCategoryFilter,
} from "./questionSelector";
import { buildShuffledSnapshot } from "./choiceShuffler";
import { selectActiveJobCard } from "./cardSelector";
import { generateAiQuizQuestion } from "./aiQuestionSlot";
import type { QuizChoiceRaw } from "./choiceShuffler";
import { Prisma } from "@/generated/prisma";

const RECENT_WINDOW_DAYS = 7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionWithItems {
  session: DailyQuizSession;
  items: DailyQuizSessionItem[];
}

export type ServiceError =
  | "CATEGORY_NOT_SET"
  | "UNSUPPORTED_CATEGORY"
  | "INSUFFICIENT_QUESTIONS"
  | "SESSION_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "ALREADY_ANSWERED"
  | "WRONG_USER";

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ServiceError; message: string };

// ---------------------------------------------------------------------------
// getOrCreateTodayQuizSession
// ---------------------------------------------------------------------------

export async function getOrCreateTodayQuizSession(
  userId: string,
  timeZone: string,
): Promise<ServiceResult<SessionWithItems>> {
  // 1. Fetch user with category
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, category: true },
  });

  if (!user?.category) {
    return {
      ok: false,
      error: "CATEGORY_NOT_SET",
      message: "User has not set a category. Please select a category first.",
    };
  }

  const userCategory = user.category as UserCategoryValue;
  const dateKey = getDailyPeriodKey(new Date(), timeZone);

  // 2. Check for existing session today
  const existing = await prisma.dailyQuizSession.findUnique({
    where: { userId_dateKey_category: { userId, dateKey, category: userCategory } },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });

  if (existing) {
    return { ok: true, value: { session: existing, items: existing.items } };
  }

  // 3. Build a new session
  return createTodayQuizSession(userId, userCategory, dateKey);
}

// ---------------------------------------------------------------------------
// createTodayQuizSession (internal)
// ---------------------------------------------------------------------------

async function createTodayQuizSession(
  userId: string,
  userCategory: UserCategoryValue,
  dateKey: string,
): Promise<ServiceResult<SessionWithItems>> {
  // 3a. Load question pool from DB
  const categoryFilter = getDbCategoryFilter(userCategory);
  const allQuestions = await prisma.quizQuestion.findMany({
    where: { category: { in: categoryFilter }, isActive: true },
  });

  // 3b. Load recently shown question IDs (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentItems = await prisma.dailyQuizSessionItem.findMany({
    where: {
      session: { userId, createdAt: { gte: sevenDaysAgo } },
      questionId: { not: null },
    },
    select: { questionId: true },
  });
  const recentIds = new Set(recentItems.map((i) => i.questionId as string));

  // 3c. Load user's active job cards
  const jobs = await prisma.job.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, status: true, title: true, company: true, deletedAt: true, jd: true },
  });

  // 3d. Find recently used card IDs in AI slots (last 7 days)
  const recentAiItems = await prisma.dailyQuizSessionItem.findMany({
    where: {
      session: { userId, createdAt: { gte: sevenDaysAgo } },
      sourceType: "ai_card_based",
      metadata: { not: Prisma.DbNull },
    },
    select: { metadata: true },
  });
  const recentCardIds = new Set(
    recentAiItems
      .map((i) => (i.metadata as Record<string, string> | null)?.jobCardId)
      .filter((id): id is string => typeof id === "string"),
  );

  // 3e. Select job card for AI slot
  const selectedCard = selectActiveJobCard(jobs, recentCardIds);

  // 3f. Try AI question (stub: always null in Step 2)
  let aiQuestion = null;
  if (selectedCard) {
    aiQuestion = await generateAiQuizQuestion({
      userId,
      jobCardId: selectedCard.id,
      jobTitle: selectedCard.title,
      jobCompany: selectedCard.company,
      jobStage: selectedCard.status,
      userCategory,
      jd: selectedCard.jd,
    });
  }

  // 3g. Select questions
  const pool = buildQuestionPool(allQuestions, userCategory);
  const selectionResult = selectQuizQuestions({
    userCategory,
    pool,
    aiQuestion,
    recentlyShownIds: recentIds,
  });

  if (!selectionResult.ok) {
    return {
      ok: false,
      error: selectionResult.error.error as ServiceError,
      message: selectionResult.error.message,
    };
  }

  const { questions, aiSlot } = selectionResult.value;
  const categoryGroup = getCategoryGroupForUser(userCategory) ?? "";

  // 3h. Build session items with snapshots
  const allItems: Prisma.DailyQuizSessionItemCreateManySessionInput[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const rawChoices = q.choices as unknown as QuizChoiceRaw[];
    const snapshot = buildShuffledSnapshot(rawChoices, q.correctChoiceId);

    allItems.push({
      questionId: q.id,
      sourceType: q.sourceType,
      orderIndex: i,
      renderedQuestionSnapshot: q.question,
      choicesSnapshot: snapshot.choicesSnapshot as unknown as Prisma.InputJsonValue,
      correctChoiceIdSnapshot: snapshot.correctChoiceIdSnapshot,
      correctIndexSnapshot: snapshot.correctIndexSnapshot,
      correctExplanationSnapshot: q.correctExplanation,
      wrongExplanationsSnapshot: q.wrongExplanations as unknown as Prisma.InputJsonValue,
    });
  }

  // 3i. Add AI slot item (if available — always null in Step 2)
  if (aiSlot) {
    const aiSnapshot = buildShuffledSnapshot(aiSlot.choices, aiSlot.correctChoiceId);
    allItems.push({
      questionId: null,
      sourceType: "ai_card_based",
      orderIndex: questions.length,
      renderedQuestionSnapshot: aiSlot.question,
      choicesSnapshot: aiSnapshot.choicesSnapshot as unknown as Prisma.InputJsonValue,
      correctChoiceIdSnapshot: aiSnapshot.correctChoiceIdSnapshot,
      correctIndexSnapshot: aiSnapshot.correctIndexSnapshot,
      correctExplanationSnapshot: aiSlot.correctExplanation,
      wrongExplanationsSnapshot: aiSlot.wrongExplanations as unknown as Prisma.InputJsonValue,
      metadata: {
        jobCardId: aiSlot.jobCardId,
        sourceId: aiSlot.sourceId,
      } as unknown as Prisma.InputJsonValue,
    });
  }

  // 3j. Persist session + items in one transaction
  const totalQuestions = allItems.length;
  const session = await prisma.dailyQuizSession.create({
    data: {
      userId,
      dateKey,
      category: userCategory,
      categoryGroup,
      status: "not_started",
      totalQuestions,
      completedQuestions: 0,
      items: { createMany: { data: allItems } },
    },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });

  return { ok: true, value: { session, items: session.items } };
}

// ---------------------------------------------------------------------------
// answerQuizItem
// ---------------------------------------------------------------------------

export interface AnswerResult {
  isCorrect: boolean;
  correctChoiceId: string;
  correctIndex: number;
}

export async function answerQuizItem(
  sessionItemId: string,
  userId: string,
  answerChoiceId: string,
): Promise<ServiceResult<AnswerResult>> {
  // Load item + session for ownership check
  const item = await prisma.dailyQuizSessionItem.findUnique({
    where: { id: sessionItemId },
    include: { session: { select: { id: true, userId: true, status: true } } },
  });

  if (!item) {
    return { ok: false, error: "ITEM_NOT_FOUND", message: "Session item not found." };
  }
  if (item.session.userId !== userId) {
    return { ok: false, error: "WRONG_USER", message: "This item does not belong to you." };
  }
  if (item.isCorrect !== null) {
    return { ok: false, error: "ALREADY_ANSWERED", message: "This question has already been answered." };
  }

  const isCorrect = answerChoiceId === item.correctChoiceIdSnapshot;

  // Compute userAnswerIndex from choicesSnapshot before transaction
  const choices = item.choicesSnapshot as unknown as QuizChoiceRaw[];
  const userAnswerIndex = choices.findIndex((c) => c.id === answerChoiceId);

  // Update item + session completedQuestions in one transaction
  await prisma.$transaction(async (tx) => {
    await tx.dailyQuizSessionItem.update({
      where: { id: sessionItemId },
      data: {
        userAnswerChoiceId: answerChoiceId,
        userAnswerIndex: userAnswerIndex >= 0 ? userAnswerIndex : null,
        isCorrect,
        answeredAt: new Date(),
      },
    });

    // Increment completedQuestions on session
    const updatedSession = await tx.dailyQuizSession.update({
      where: { id: item.session.id },
      data: { completedQuestions: { increment: 1 } },
      select: { completedQuestions: true, totalQuestions: true },
    });

    // Mark session completed if all answered
    if (updatedSession.completedQuestions >= updatedSession.totalQuestions) {
      await tx.dailyQuizSession.update({
        where: { id: item.session.id },
        data: { status: "completed", completedAt: new Date() },
      });
    } else if (item.session.status === "not_started") {
      await tx.dailyQuizSession.update({
        where: { id: item.session.id },
        data: { status: "in_progress" },
      });
    }
  });

  return {
    ok: true,
    value: {
      isCorrect,
      correctChoiceId: item.correctChoiceIdSnapshot,
      correctIndex: item.correctIndexSnapshot,
    },
  };
}

// ---------------------------------------------------------------------------
// computeSessionProgress
// ---------------------------------------------------------------------------

export interface SessionProgress {
  sessionId: string;
  status: string;
  totalQuestions: number;
  completedQuestions: number;
  correctCount: number;
  percentComplete: number;
}

export async function computeSessionProgress(
  sessionId: string,
  userId: string,
): Promise<ServiceResult<SessionProgress>> {
  const session = await prisma.dailyQuizSession.findUnique({
    where: { id: sessionId },
    include: {
      items: { select: { isCorrect: true, answeredAt: true } },
    },
  });

  if (!session) {
    return { ok: false, error: "SESSION_NOT_FOUND", message: "Session not found." };
  }
  if (session.userId !== userId) {
    return { ok: false, error: "WRONG_USER", message: "This session does not belong to you." };
  }

  const answered = session.items.filter((i) => i.isCorrect !== null);
  const correctCount = answered.filter((i) => i.isCorrect === true).length;

  return {
    ok: true,
    value: {
      sessionId: session.id,
      status: session.status,
      totalQuestions: session.totalQuestions,
      completedQuestions: session.completedQuestions,
      correctCount,
      percentComplete:
        session.totalQuestions > 0
          ? Math.round((session.completedQuestions / session.totalQuestions) * 100)
          : 0,
    },
  };
}
