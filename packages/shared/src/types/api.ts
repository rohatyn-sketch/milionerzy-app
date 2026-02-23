import type { Question } from './question';
import type { UserProfile, UserProgress, UserPreferences, Lifelines } from './user';
import type { QuizClass } from './class';
import type { LeaderboardEntry } from './leaderboard';

export interface LoginRequest {
  idToken: string;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
}

export interface ProgressResponse {
  progress: UserProgress;
  preferences: UserPreferences;
  lifelines: Lifelines;
  achievements: string[];
  activeClassId: string;
  classes: QuizClass[];
  incorrectQuestions: Record<string, number[]>;
}

export type LoadProgressResponse = ProgressResponse;

export interface SaveProgressRequest {
  progress: Partial<UserProgress>;
  preferences?: Partial<UserPreferences>;
  lifelines?: Partial<Lifelines>;
  achievements?: string[];
  activeClassId?: string;
  classes?: QuizClass[];
  incorrectQuestions?: Record<string, number[]>;
}

export interface GenerateRequest {
  className: string;
  context?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface GenerateResponse {
  questions: Question[];
}

export interface CriteriaResponse {
  criteria: Array<{
    className: string;
    questionCount: number;
    context?: string;
  }>;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface SubmitScoreRequest {
  name: string;
  score: number;
}
