/**
 * quizClientTypes.ts
 *
 * Shared types for the quiz client UI.
 * These mirror the serialized API shapes — no Prisma dependency.
 */

export type QuizChoice = {
  id: string;
  text: string;
};

export type WrongExplanation = {
  choiceId: string;
  explanation: string;
};

/** An item that has NOT been answered yet — no answer/explanation fields. */
export type UnansweredItem = {
  id: string;
  sessionId: string;
  questionId: string | null;
  sourceType: string;
  orderIndex: number;
  renderedQuestionSnapshot: string;
  choicesSnapshot: QuizChoice[];
  userAnswerChoiceId: null;
  userAnswerIndex: null;
  isCorrect: null;
  answeredAt: null;
  metadata: unknown;
  answered: false;
};

/** An item that has been answered — includes answer + explanation fields. */
export type AnsweredItem = {
  id: string;
  sessionId: string;
  questionId: string | null;
  sourceType: string;
  orderIndex: number;
  renderedQuestionSnapshot: string;
  choicesSnapshot: QuizChoice[];
  userAnswerChoiceId: string;
  userAnswerIndex: number | null;
  isCorrect: boolean;
  answeredAt: string | null;
  metadata: unknown;
  answered: true;
  correctChoiceIdSnapshot: string;
  correctIndexSnapshot: number;
  correctExplanationSnapshot: string;
  wrongExplanationsSnapshot: WrongExplanation[];
};

export type QuizItem = UnansweredItem | AnsweredItem;

export type QuizSession = {
  id: string;
  userId: string;
  dateKey: string;
  category: string;
  categoryGroup: string;
  status: string;
  totalQuestions: number;
  completedQuestions: number;
  createdAt: string;
  completedAt: string | null;
};

export type QuizSessionResponse = {
  session: QuizSession;
  items: QuizItem[];
};

/** Response from POST /api/quiz/session/[sessionId]/answer */
export type AnswerResponse = {
  isCorrect: boolean;
  correctChoiceId: string;
  correctIndex: number;
  correctExplanation: string;
  wrongExplanations: WrongExplanation[];
};

/** State of a submitted answer — held in client state after submit. */
export type SubmittedAnswer = {
  itemId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  correctChoiceId: string;
  correctIndex: number;
  correctExplanation: string;
  wrongExplanations: WrongExplanation[];
};
