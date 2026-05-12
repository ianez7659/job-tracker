# Execution Plan

## Goal

Daily Interview Quiz Step 3: `aiQuestionSlot.ts` stub을 실제 OpenAI Structured Output 호출로 교체한다. json_schema response_format으로 구조를 강제하고, 서버 측 재검증 후 실패 시 null 반환 → 기존 fallback 동작을 유지한다. DB schema 변경 없음.

## Approach

- `src/lib/quiz/aiQuestionSlot.ts` — OpenAI `chat.completions.create` with `response_format: { type: "json_schema", json_schema: { strict: true, schema: {...} } }` 구현. 별도 서버 측 validation 함수 포함.
- `src/lib/quiz/aiQuestionSlot.test.ts` — OpenAI 실제 호출 없이 mock 기반 테스트
- `docs/product-specs/quiz-ai-question.md` — prompt 구조, validation 규칙, fallback, 비용 방지 문서

패턴 참조:
- `src/app/api/jobs/extract-business-card/route.ts` — json_object 방식 참고
- `src/lib/companyResearch/generateInterviewReport.ts` — OpenAI 호출 구조 참고
- `src/lib/quiz/validation.ts` — 기존 validation 패턴 재사용

DB 변경: 없음. Migration: 없음. prisma generate: 불필요.

## Step-by-step plan

1. `src/lib/quiz/aiQuestionSlot.ts` 수정
   - JSON Schema 상수 정의 (question, choices×4, correctChoiceId, correctExplanation, wrongExplanations×3, difficulty, tags)
   - system/user prompt 작성 (job card context 반영, 영어, 4지선다, correctChoiceId 방식)
   - `generateAiQuizQuestion()` — OpenAI structured output 호출, 응답 파싱
   - `validateAiQuestionResponse()` — 서버 측 재검증
   - 실패/validation 오류 → null 반환
2. `src/lib/quiz/aiQuestionSlot.test.ts` 작성
   - mock OpenAI 응답으로 성공/실패 케이스 전체 커버
3. `docs/product-specs/quiz-ai-question.md` 작성
4. `npm run check` 전체 통과 확인

## Definition of done

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (including new / updated tests)
- [ ] `npm run build` passes
- [ ] All plan steps completed
- [ ] `generateAiQuizQuestion()` 실제 OpenAI structured output 호출
- [ ] 서버 측 validation 통과 후에만 AiGeneratedQuestion 반환
- [ ] 실패 시 null 반환 → sessionService fallback 자동 동작
- [ ] OpenAI mock 기반 테스트 통과
- [ ] 문서 작성 완료

## Scope

- `src/lib/quiz/aiQuestionSlot.ts` (수정)
- `src/lib/quiz/aiQuestionSlot.test.ts` (신규)
- `docs/product-specs/quiz-ai-question.md` (신규)

sessionService.ts, questionSelector.ts, DB schema — 변경 없음.

## Risk

- OpenAI API timeout/rate limit → try/catch로 null 반환
- Structured output이라도 schema 위반 응답 가능 → 서버 측 재검증으로 보완
- gpt-4o-mini strict mode에서 additionalProperties: false 필요

## Approval required

No — DB 변경 없음. OpenAI API key는 기존 .env에 존재.

## Rollback

브랜치 삭제로 완전 롤백. aiQuestionSlot.ts가 null 반환 stub으로 돌아가면 sessionService fallback이 그대로 동작.
