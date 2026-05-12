# Daily Interview Quiz — Session Engine (Step 2)

## Overview

The session engine creates, retrieves, and manages Daily Interview Quiz sessions.
Each user gets one session per calendar day (timezone-aware). Sessions contain exactly 5 questions selected from a 3-tier pool.

No UI is included in this step. All logic lives in `src/lib/quiz/` and is exposed via `src/app/api/quiz/`.

---

## Question Composition Rules

### With an active job card (AI slot available)

| Slot | Source | Count |
|------|--------|-------|
| Common | `category = "common"` | 2 |
| Group-common | e.g. `category = "tech-common"` | 1 |
| Exact category | e.g. `category = "web-development"` | 1 |
| AI card-based | Generated from job card context | 1 |
| **Total** | | **5** |

### Without an active job card (or AI unavailable)

| Slot | Source | Count |
|------|--------|-------|
| Common | `category = "common"` | 2 |
| Group-common | e.g. `category = "tech-common"` | 1 |
| Exact category | e.g. `category = "web-development"` | **2** |
| **Total** | | **5** |

> In Step 2, the AI slot stub always returns `null`, so all sessions use the without-card composition.

---

## Difficulty Preference

Best-effort only — never blocks session creation.

**With AI slot:**
- Common: easy×1, medium×1
- Group-common: medium preferred
- Exact category: medium/hard preferred
- AI: medium/hard

**Without AI slot:**
- Common: easy×1, medium×1
- Group-common: medium preferred
- Exact category: medium×1, hard×1

If preferred difficulty is unavailable, any difficulty is accepted.

---

## Fallback Cascade

Session creation must never fail due to an insufficient question pool.

### Exact category runs short
1. Exact category questions
2. Group-common questions
3. Global common questions

### Group-common runs short
1. Group-common questions
2. Exact category questions
3. Global common questions

### AI question unavailable (Step 2: always)
→ Use exact category +1 (without-card composition)

### Final failure
If the total available questions across all tiers is < 5, return `INSUFFICIENT_QUESTIONS` error with a clear message.

---

## Job Card Selection (for AI slot context)

Active job card selection order:
1. Exclude `deletedAt != null` (soft-deleted) cards
2. Exclude terminal status cards (`offer`, `rejected`)
3. Prefer interview-stage cards (`interview1`, `interview2`, `interview3`)
4. If no interview-stage cards, use any remaining active cards
5. Prefer cards not used in AI quiz slots in the last 7 days
6. Random pick from the final candidate list

Returns `null` if no active card exists → AI fallback activates.

---

## Choices Shuffle & Snapshot

The original `QuizQuestion` stores `correctChoiceId` (not an index).
At session creation time:

1. Choices are shuffled with Fisher-Yates
2. `correctIndexSnapshot` is computed from the shuffled array
3. All snapshot fields are written to `DailyQuizSessionItem` once and never mutated

This ensures the same question order and choice order on every page load within a session.

**Fields stored per item:**
- `choicesSnapshot` — shuffled `[{id, text}]` array
- `correctChoiceIdSnapshot` — unchanged from source
- `correctIndexSnapshot` — 0-based index in shuffled array
- `renderedQuestionSnapshot` — question text at creation time
- `correctExplanationSnapshot` / `wrongExplanationsSnapshot`

---

## Date Key (Timezone)

Quiz `dateKey` uses `getDailyPeriodKey()` from `src/lib/xp/dailyPeriod.ts`.

- Format: `YYYY-MM-DD`
- Anchor: 5:00 AM local time (same as XP daily period)
- Client must pass `?timeZone=America/Vancouver` (IANA timezone)

This aligns "today's quiz" with "today's XP" for a consistent user experience.

---

## Recent Deduplication

Questions shown to the same user in the **last 7 days** are soft-excluded:
- Prefer questions not in recent history
- If the fresh pool is too small to fill the required slots, fall back to allowing recent questions
- Session creation is never blocked by dedup constraints

---

## ESL / CELPIP Handling

`esl` and `celpip` categories are excluded from Daily Interview Quiz (Language Programmes use different assessment formats).

Attempting to create a session with these categories returns:
```json
{ "error": "UNSUPPORTED_CATEGORY", "message": "..." }
```

In practice this cannot happen because `CategoryGuard.tsx` enforces category selection before dashboard access, and the category picker does not allow language programme categories for quiz.

---

## API Routes

### `GET /api/quiz/session?timeZone=...`
Returns the user's quiz session for today. Creates one if it doesn't exist yet.

**Response (200):**
```json
{
  "session": { "id": "...", "status": "not_started", "totalQuestions": 5, ... },
  "items": [{ "id": "...", "orderIndex": 0, "renderedQuestionSnapshot": "...", "choicesSnapshot": [...], ... }]
}
```

**Error responses:**
- `400` — `CATEGORY_NOT_SET` or `UNSUPPORTED_CATEGORY`
- `401` — Unauthorized
- `422` — `INSUFFICIENT_QUESTIONS`

### `POST /api/quiz/session/[sessionId]/answer`
Records the user's answer for one question item.

**Request body:**
```json
{ "itemId": "...", "answerChoiceId": "b" }
```

**Response (200):**
```json
{ "isCorrect": true, "correctChoiceId": "b", "correctIndex": 2 }
```

**Error responses:**
- `400` — Missing fields
- `403` — `WRONG_USER`
- `404` — `ITEM_NOT_FOUND` or item not in session
- `409` — `ALREADY_ANSWERED`

---

## Service Functions

| Function | Location | Description |
|----------|----------|-------------|
| `getOrCreateTodayQuizSession(userId, timeZone)` | `sessionService.ts` | Returns existing session or creates new one |
| `answerQuizItem(itemId, userId, choiceId)` | `sessionService.ts` | Records answer, updates session status |
| `computeSessionProgress(sessionId, userId)` | `sessionService.ts` | Returns progress stats |
| `selectQuizQuestions(input)` | `questionSelector.ts` | Applies 3-tier selection + fallback |
| `buildQuestionPool(questions, category)` | `questionSelector.ts` | Partitions flat DB result into tiers |
| `buildShuffledSnapshot(choices, correctId)` | `choiceShuffler.ts` | Fisher-Yates + correctIndexSnapshot |
| `selectActiveJobCard(jobs, recentIds)` | `cardSelector.ts` | Picks best card for AI context |
| `generateAiQuizQuestion(input)` | `aiQuestionSlot.ts` | **Stub** — always returns `null` (Step 3) |

---

## Step 3 Remaining Work

- Implement `generateAiQuizQuestion()` in `aiQuestionSlot.ts` with real OpenAI API call
- Add prompt engineering for job card context (title, company, stage, JD)
- Add response validation for AI-generated question structure
- Store AI question snapshot with `jobCardId` in `metadata`
- Add AI question to `DailyQuizSessionItem` when generation succeeds
