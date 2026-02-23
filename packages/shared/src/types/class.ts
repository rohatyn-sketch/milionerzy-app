export interface QuizClass {
  id: string;
  name: string;
  isDefault: boolean;
  questionCount: number;
  context?: string;
  generatedAt?: string;
}
