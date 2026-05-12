# Execution Plan

## Goal

Daily Interview Quiz Step 2: 세션 생성 엔진과 출제 규칙을 서비스 레이어로 구현한다. UI 없이 API/service 레이어만 완성하며, AI card-based question은 slot/stub 구조만 준비하고 실제 OpenAI 호출은 Step 3 범위로 남긴다.

## Approach

- `src/lib/quiz/` 기존 디렉토리에 session 도메인 로직 추가
  - `sessionService.ts` — getOrCreateTodayQuizSession, answerQuizItem, computeSessionProgress
  - `questionSelector.ts` — 3층 출제 규칙 (common / group-common / exact-category), 난이도 조합, 중복 회피, fallback
  - `aiQuestionSlot.ts` — AI card-based question stub interface (Step 3에서 채울 인터페이스)
  - `choiceShuffler.ts` — choices shuffle + correctIndexSnapshot 계산
  - `cardSelector.ts` — active job card 선택 로직 (interview-stage 우선, terminal/deleted 제외)
- `src/app/api/quiz/` 신규 — API route (session 조회/생성, 답안 저장)
- `docs/product-specs/quiz-session-engine.md` — 출제 규칙, fallback, snapshot 방식 문서

dateKey: `getDailyPeriodKey()` (XP 시스템과 동일 timezone + 5:00 AM anchor 재사용).
No DB schema changes — Step 1 모델이 충분함.
No OpenAI calls — AI slot은 `null`을 반환하는 stub.

## Step-by-step plan

1. `src/lib/quiz/choiceShuffler.ts` — Fisher-Yates shuffle, correctIndexSnapshot 계산, snapshot 조립
2. `src/lib/quiz/cardSelector.ts` — active job card 후보 선별 (interview-stage 우선, 7일 중복 회피, terminal/deleted 제외)
3. `src/lib/quiz/aiQuestionSlot.ts` — AI question stub: `generateAiQuizQuestion()` → always returns `null` (Step 3 placeholder)
4. `src/lib/quiz/questionSelector.ts` — 3층 출제 규칙, 난이도 우선순위, fallback, ESL/CELPIP 처리
5. `src/lib/quiz/sessionService.ts` — getOrCreateTodayQuizSession, answerQuizItem, computeSessionProgress
6. `src/app/api/quiz/session/route.ts` — GET (오늘 세션 조회), POST (세션 생성)
7. `src/app/api/quiz/session/[sessionId]/answer/route.ts` — POST (답안 저장)
8. `src/lib/quiz/choiceShuffler.test.ts` — shuffle 정확성, correctIndexSnapshot 검증
9. `src/lib/quiz/questionSelector.test.ts` — 출제 규칙 전체 시나리오 테스트
10. `src/lib/quiz/sessionService.test.ts` — 세션 재사용, 답안 저장, progress 계산 테스트
11. `docs/product-specs/quiz-session-engine.md` 작성
12. `npm run check` 전체 통과 확인

## Definition of done

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (including new / updated tests)
- [ ] `npm run build` passes
- [ ] All plan steps completed
- [ ] getOrCreateTodayQuizSession: 같은 날 재사용, 다른 날 신규 생성
- [ ] 3층 출제 규칙 + fallback 동작 확인
- [ ] AI slot stub → fallback으로 exact category question 대체
- [ ] choicesSnapshot + correctIndexSnapshot 정확성 확인
- [ ] ESL/CELPIP category → clear error 반환
- [ ] 문서 작성 완료

## Scope

- `src/lib/quiz/` (신규 파일 추가)
- `src/app/api/quiz/` (신규)
- `docs/product-specs/quiz-session-engine.md` (신규)

UI, Dashboard 연결, OpenAI 호출은 이번 스텝 범위 외.

## Risk

- `getDailyPeriodKey` import: xp/dailyPeriod.ts의 함수를 quiz 도메인에서 재사용 — 순환 의존 없음
- Job model의 `status`는 plain String이므로 enum 없이 상수 배열로 필터링해야 함
- Prisma client가 QuizQuestion을 알고 있어야 함 (Step 1 migrate + generate 완료 상태)

## Approval required

No — DB schema 변경 없음. migration / seed 없음. prisma generate 불필요.

## Rollback

`git worktree remove worktree/quiz-session-engine` 후 브랜치 삭제. API route만 추가이므로 기존 기능에 영향 없음.
