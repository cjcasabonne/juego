import type {
  QuestionType,
  QuestionCategory,
  QuestionSubcategory,
  GameSessionStatus,
  QuestionOption,
} from './db';

export type { QuestionType, QuestionCategory, QuestionSubcategory, GameSessionStatus, QuestionOption };

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Couple {
  id: string;
  name: string | null;
  createdBy: string;
  inviteCode: string;
  inviteExpiresAt: string | null;
  createdAt: string;
}

export interface CoupleMember {
  id: string;
  coupleId: string;
  userId: string;
  joinedAt: string;
}

export interface Question {
  id: string;
  questionId: string | null;
  coupleId: string | null;
  type: QuestionType;
  category: QuestionCategory;
  subcategory: QuestionSubcategory;
  intensity: number;
  text: string;
  options: QuestionOption[] | null;
  isActive: boolean;
  createdBy: string | null;
}

export interface GameSession {
  id: string;
  coupleId: string;
  category: QuestionCategory | null;
  status: GameSessionStatus;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface SessionQuestion {
  id: string;
  sessionId: string;
  questionId: string;
  position: number;
  question?: Question;
}

export interface UserSessionState {
  id: string;
  sessionId: string;
  userId: string;
  phase1Completed: boolean;
  phase1CompletedAt: string | null;
  phase2Completed: boolean;
  phase2CompletedAt: string | null;
  revealPosition: number;
}

export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  userId: string;
  selectedOptionId: string | null;
  freeText: string | null;
  answeredAt: string;
}

export interface Prediction {
  id: string;
  sessionId: string;
  questionId: string;
  predictorId: string;
  predictedOptionId: string | null;
  predictedFreeText: string | null;
  isCorrect: boolean | null;
  predictedAt: string;
}

export interface FreeTextValidation {
  id: string;
  predictionId: string;
  validatorId: string;
  isCorrect: boolean;
  validatedAt: string;
}

export interface ImportRow {
  questionId: string;
  isExample: boolean;
  type: QuestionType;
  category: QuestionCategory;
  subcategory: QuestionSubcategory;
  intensity: number;
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

export interface ImportResult {
  read: number;
  skippedExample: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  errors: string[];
}
