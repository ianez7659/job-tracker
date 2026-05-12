# Execution Plan

## Goal

Daily Interview Quiz 기능의 Step 1: data/quiz JSON 검증 스키마, Prisma 모델 설계(QuizQuestion / DailyQuizSession / DailyQuizSessionItem), import/seed 스크립트, 테스트, 문서를 구현한다. UI 연결 없이 데이터 레이어만 완성한다.

## Approach

- `src/lib/quiz/` 신규 디렉토리 — quiz 도메인 비즈니스 로직 전용
  - `validation.ts` — JSON 구조 검증 (zod)
  - `categoryMap.ts` — quiz JSON category(hyphen) ↔ USER_CATEGORIES value(underscore) 매핑 + QUIZ_UNSUPPORTED_CATEGORIES
  - `importQuestions.ts` — data/quiz/*.json → DB upsert 스크립트 (실행은 사용자 승인 후)
- `prisma/schema.prisma` — QuizQuestion, DailyQuizSession, DailyQuizSessionItem 모델 추가
- `docs/product-specs/quiz-data-model.md` — 데이터 모델 문서
- `src/lib/quiz/*.test.ts` — validation, categoryMap 단위 테스트

DB 변경: Prisma schema 수정 가능. `prisma migrate` / `prisma db push` / seed 실행은 사용자 승인 없이 하지 않는다.

## Step-by-step plan

1. `src/lib/quiz/categoryMap.ts` 작성 — quiz JSON category → USER_CATEGORIES value 매핑 상수 및 유틸, QUIZ_UNSUPPORTED_CATEGORIES 정의
2. `src/lib/quiz/validation.ts` 작성 — zod 스키마로 QuizQuestionFile, QuizQuestion 구조 검증; validateQuizFile(), validateAllQuizFiles() 함수 구현
3. `prisma/schema.prisma` 수정 — QuizQuestion, DailyQuizSession, DailyQuizSessionItem 모델 추가
4. `prisma generate` 실행 — 타입 재생성 (DB 변경 없음)
5. `src/lib/quiz/importQuestions.ts` 작성 — JSON → QuizQuestion upsert 로직 (dry-run 가능, 실제 실행은 사용자 승인 후)
6. `src/lib/quiz/validation.test.ts` 작성 — 정상 케이스, 잘못된 구조 감지, correctChoiceId 불일치, wrongExplanations 누락 테스트
7. `src/lib/quiz/categoryMap.test.ts` 작성 — 매핑 정확성, unsupported category 처리 테스트
8. `docs/product-specs/quiz-data-model.md` 작성 — 데이터 모델 문서화
9. `npm run check` 전체 통과 확인

## Definition of done

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (including new / updated tests)
- [ ] `npm run build` passes
- [ ] All plan steps completed
- [ ] QuizQuestion / DailyQuizSession / DailyQuizSessionItem Prisma 모델 완성
- [ ] data/quiz/*.json 전체 validation 통과
- [ ] import script dry-run 가능 상태
- [ ] 문서 작성 완료

## Scope

- `prisma/schema.prisma` (모델 추가)
- `src/lib/quiz/` (신규)
- `docs/product-specs/quiz-data-model.md` (신규)

UI, API route, 미션 연결, Quiz page는 이번 스텝 범위 외.

## Risk

- Prisma schema 변경 후 `prisma generate`가 기존 타입에 영향을 줄 수 있음 → 기존 모델에는 변경 없으므로 위험 낮음
- zod 미설치 시 추가 필요 → 사전 확인 후 진행

## Approval required

Yes — `prisma migrate dev` / `prisma db push` / seed 실행 시 사용자 승인 필요. 이번 스텝에서는 `prisma generate`만 실행.

## Rollback

`git worktree remove worktree/quiz-data-model` 후 브랜치 삭제로 완전 롤백 가능. schema.prisma 변경만 revert하면 DB에 영향 없음.
