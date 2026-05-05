# XP System — Product Spec (MVP Step 1)

## Overview

XP (Experience Points) system rewards meaningful job-search activity. Users earn XP by tracking applications, progressing through interview stages, and closing cycles properly.

## Where the logic lives

| Concern | Path |
|---|---|
| Pure XP types | `src/lib/xp/types.ts` |
| Level curve | `src/lib/xp/levels.ts` |
| Reward calculation | `src/lib/xp/rewards.ts` |
| Cycle-end stage derivation | `src/lib/xp/cycleStage.ts` |
| Re-export barrel | `src/lib/xp/index.ts` |
| DB models | `prisma/schema.prisma` — `UserXp`, `XpEvent` |

## XP Earning Rules

### A. Daily Activity — +8 XP (once per day)
Awarded when the user performs at least one meaningful action on a given UTC day.  
Meaningful actions include: creating a job card, updating job status, adding/editing notes, completing a weekly review.  
Guard: `isDailyRewardEligible(lastDailyAt, now)` — compares UTC date strings.

### B. Job Card Creation — +10 XP (+ optional +5 bonus)
- `+10` on every new job card creation (`JOB_CREATED`)
- `+5` bonus (`JOB_CREATED_COMPLETE`) if the card has all five core fields filled:
  - `company`, `title`, `status`, `appliedAt`, `url`

Completeness check: `isJobCardComplete(job)`

### C. Cycle Completion — +30 XP (+ up to +15 bonus)
Triggered when a job status changes to `offer` or `rejected`.

| Grant | Condition | XP |
|---|---|---|
| `CYCLE_COMPLETED` | Always on terminal status | +30 |
| `CYCLE_INTERVIEW_BONUS` | `cycleEndStage` ∈ {interview1, interview2, interview3} | +10 |
| `CYCLE_NOTE_BONUS` | `jd` field is non-empty on close | +5 |

Maximum cycle XP: **45 XP**

### D. Weekly Review — +20 XP
Awarded once when the weekly review requirement is met (details TBD in step 2).  
Reward function: `grantWeeklyReview()`

## Level Curve

| Level → Next | XP Required |
|---|---|
| 1 → 2 | 100 |
| 2 → 3 | 150 |
| 3 → 4 | 220 |
| 4 → 5 | 300 |
| 5 → 6 | 400 |
| n → n+1 (n ≥ 5) | 300 + 100×(n−4) |

Calculation: `computeLevel(totalXp)` returns `{ level, currentLevelXp, xpToNextLevel, progress }`.

## Cycle-End Stage

When a job transitions to a terminal status (`offer` | `rejected`), the system stores the last non-terminal stage the application reached.

- Field: `Job.cycleEndStage: String?`
- Derivation: `deriveCycleEndStage(previousStatus)` — call before updating status, persist result.

Example:
```
previousStatus = "interview2"  →  cycleEndStage = "interview2"
previousStatus = "applying"    →  cycleEndStage = "applying"
previousStatus = "rejected"    →  cycleEndStage = null  (already terminal)
```

This enables future stats: "How far did this application progress before closing?"

## DB Models

```
UserXp     — one row per user; holds totalXp, currentLevel, lastDailyAt
XpEvent    — append-only log; reason (XpReason enum), amount, optional jobId
XpReason   — enum: DAILY_ACTIVITY | JOB_CREATED | JOB_CREATED_COMPLETE |
              CYCLE_COMPLETED | CYCLE_INTERVIEW_BONUS | CYCLE_NOTE_BONUS |
              WEEKLY_REVIEW
```

## Guardrails

- Card creation (max 15 XP) is intentionally less than proper cycle completion (max 45 XP)
- Daily reward requires an actual meaningful action — not just opening the app
- Rejected outcomes are fully rewarded if the cycle is properly closed
- No credits, shop, or premium currency in this step
