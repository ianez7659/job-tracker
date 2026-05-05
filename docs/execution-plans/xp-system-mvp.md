# Execution Plan — xp-system-mvp

## Goal

MVP XP 시스템의 백엔드/도메인 기반을 구축한다. 순수 XP 계산 로직, 레벨 커브, 사이클 종료 스테이지 도메인 로직, Prisma 스키마 확장(UserXp + XpEvent + Job.cycleEndStage), 그리고 모든 핵심 규칙에 대한 테스트를 포함한다. UI 변경 없음.

## Approach

### 파일 배치 (docs/agent-context.md 기준)
- 순수 XP 로직: `src/lib/xp/rewards.ts` — XP 지급 계산 (pure functions, DB 없음)
- 레벨 로직: `src/lib/xp/levels.ts` — 레벨 커브, 진행도 계산
- 사이클 도메인: `src/lib/xp/cycleStage.ts` — cycleEndStage 도출 로직
- 타입: `src/lib/xp/types.ts` — XP 관련 공유 타입
- 테스트: 각 파일과 같은 디렉터리에 `.test.ts`
- 스키마: `prisma/schema.prisma` — UserXp, XpEvent 모델 추가, Job에 cycleEndStage 필드 추가

### DB 설계
```
model UserXp {
  id           String    @id @default(cuid())
  userId       String    @unique
  totalXp      Int       @default(0)
  currentLevel Int       @default(1)
  lastDailyAt  DateTime? // 마지막 daily 보상 수령일 (UTC 날짜 기준)
  user         User      @relation(fields: [userId], references: [id])
  events       XpEvent[]
}

model XpEvent {
  id        String   @id @default(cuid())
  userXpId  String
  reason    XpReason
  amount    Int
  jobId     String?
  createdAt DateTime @default(now())
  userXp    UserXp   @relation(fields: [userXpId], references: [id])
}

enum XpReason {
  DAILY_ACTIVITY
  JOB_CREATED
  JOB_CREATED_COMPLETE
  CYCLE_COMPLETED
  CYCLE_INTERVIEW_BONUS
  CYCLE_NOTE_BONUS
  WEEKLY_REVIEW
}
```

Job 모델에 추가:
```
cycleEndStage String? // 사이클 종료 시점의 마지막 비-터미널 스테이지
```

### XP 규칙 요약
| 이벤트 | XP |
|---|---|
| 일일 활동 보상 (하루 1회) | +8 |
| 카드 생성 | +10 |
| 카드 완성도 보너스 (company+title+status+appliedAt+url) | +5 |
| 사이클 완료 (offer/rejected) | +30 |
| 인터뷰 통과 보너스 (interview1+ 거친 경우) | +10 |
| 최종 노트 보너스 (jd 필드 있는 경우) | +5 |
| 주간 리뷰 완료 | +20 |

### 레벨 커브
| 구간 | 필요 XP |
|---|---|
| L1 → L2 | 100 |
| L2 → L3 | 150 |
| L3 → L4 | 220 |
| L4 → L5 | 300 |
| L5+ | 이전 + 100씩 증가 |

## Step-by-step plan

1. worktree 생성: `git worktree add worktree/xp-system-mvp -b task/xp-system-mvp`
2. **[DB 승인 필요]** Prisma 스키마 확장 (UserXp, XpEvent enum, Job.cycleEndStage)
3. `prisma migrate dev --name xp-system-mvp` (사용자 승인 후)
4. `src/lib/xp/types.ts` 작성 — XP 관련 타입/인터페이스 정의
5. `src/lib/xp/levels.ts` 작성 — 레벨 커브 + 진행도 순수 함수
6. `src/lib/xp/rewards.ts` 작성 — XP 지급 계산 순수 함수
7. `src/lib/xp/cycleStage.ts` 작성 — cycleEndStage 도출 로직
8. `src/lib/xp/levels.test.ts`, `rewards.test.ts`, `cycleStage.test.ts` 테스트 작성
9. `src/lib/xp/index.ts` — re-export
10. `docs/product-specs/xp-system.md` — XP 규칙 문서화
11. `npm run check` 통과

## Definition of done

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (including new tests)
- [ ] `npm run build` passes
- [ ] UserXp, XpEvent 모델이 스키마에 존재
- [ ] Job.cycleEndStage 필드 존재
- [ ] 모든 XP 규칙이 pure function으로 구현 + 테스트됨
- [ ] 레벨 계산 로직 테스트됨
- [ ] cycleEndStage 도출 로직 테스트됨
- [ ] UI 변경 없음

## Scope

- `prisma/schema.prisma`
- `src/lib/xp/` (신규 디렉터리)
- `docs/product-specs/xp-system.md` (신규 문서)

## Risk

- DB 스키마 변경 → **사용자 명시적 승인 필요** (`prisma migrate dev`)
- Job 모델에 optional 필드 추가이므로 기존 쿼리에 영향 없음
- UserXp는 신규 모델로 기존 User 기능에 영향 없음

## Approval required

**Yes** — `prisma migrate dev` 실행 전 사용자 명시적 승인 필요.

## Rollback

```bash
git checkout main
git worktree remove worktree/xp-system-mvp
git branch -D task/xp-system-mvp
```
DB: 마이그레이션 롤백은 `prisma migrate reset` (주의: 데이터 손실)
