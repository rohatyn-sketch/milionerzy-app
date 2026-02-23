export interface GameConfig {
  questionsPerGame: number;
  moneyPerCorrect: number;
  timerDurations: Record<DifficultyLevel, number>;
  difficultyMultipliers: Record<DifficultyLevel, number>;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  name: string;
  level: DifficultyLevel;
  questionRange: [number, number];
  timeLimit: number;
  multiplier: number;
}
