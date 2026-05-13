# Quiz Missions — Product Spec

## Feature

Connects the Daily Interview Drill to the existing Missions section as a first-class daily mission row.
Users see a 3-state CTA (Start / Continue / Review), progress label, and reward label directly on the mission card.
Completing all 5 questions awards +10 XP, atomically with the final answer write.

## Mission Row Behaviour

| Quiz state       | `ctaLabel` | `progressLabel` | `rewardLabel`     | `completed` |
|------------------|------------|-----------------|-------------------|-------------|
| `not_started`    | Start      | 0/5             | +10 XP            | false       |
| `in_progress`    | Continue   | n/5             | +10 XP            | false       |
| `completed`      | Review     | Completed       | +10 XP earned     | true        |

- CTA navigates to `/dashboard/interview-drill` (no API call; no busyId spinner).
- The `review` CTA on the completed row also navigates to the drill page where the user can re-read their answers.
- `dailyRemaining` now counts 3 possible daily missions (check-in, job card, interview drill).

## XP Grant

- +10 XP, reason `DAILY_QUIZ_COMPLETED`.
- Granted atomically inside `answerQuizItem()` `$transaction` when `completedQuestions >= totalQuestions`.
- Idempotent: guarded by `DailyQuizSession.xpAwardedAt`. If non-null, the grant block is skipped on any subsequent request (e.g. race condition, double-submit).

## DB Changes

Migration `20260512100000_quiz_xp` (applied on build):

```sql
ALTER TYPE "XpReason" ADD VALUE IF NOT EXISTS 'DAILY_QUIZ_COMPLETED';
ALTER TABLE "DailyQuizSession" ADD COLUMN IF NOT EXISTS "xpAwardedAt" TIMESTAMPTZ;
```

Note: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block (PostgreSQL constraint). The migration file is written as two standalone statements.

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `DAILY_QUIZ_COMPLETED` to `XpReason`; added `xpAwardedAt DateTime?` to `DailyQuizSession` |
| `prisma/migrations/20260512100000_quiz_xp/migration.sql` | New migration |
| `src/lib/xp/missionsDisplayCore.ts` | `MissionId` + `MissionStatus` types; `MissionRowDTO` optional fields; `MissionsComputeInput` quiz fields; `computeMissionsPayload()` quiz row |
| `src/lib/xp/missionsDisplay.ts` | Added `DailyQuizSession` query; passes quiz fields to `computeMissionsPayload()` |
| `src/lib/quiz/sessionService.ts` | Atomic XP grant inside `answerQuizItem()` transaction; `xpAwardedAt` on session select |
| `src/lib/quiz/sessionSerializer.test.ts` | Added `xpAwardedAt: null` to session fixture |
| `src/app/dashboard/components/MissionsSection.tsx` | `BookOpen` icon; renders `ctaLabel`, `progressLabel`, `rewardLabel`; `daily_interview_drill` in `handleStart` |
| `src/lib/xp/missionsDisplay.test.ts` | Updated `dailyRemaining` counts (2→3); added 3-state CTA tests |
