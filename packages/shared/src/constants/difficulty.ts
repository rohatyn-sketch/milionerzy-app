import type { DifficultyConfig, DifficultyLevel } from '../types/game';

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { name: 'Latwy', level: 'easy', questionRange: [1, 4], timeLimit: 60, multiplier: 1.0 },
  { name: 'Sredni', level: 'medium', questionRange: [5, 7], timeLimit: 45, multiplier: 1.5 },
  { name: 'Trudny', level: 'hard', questionRange: [8, 10], timeLimit: 30, multiplier: 2.0 },
];

export function getDifficultyForQuestion(questionNumber: number): DifficultyConfig {
  return DIFFICULTY_LEVELS.find(
    d => questionNumber >= d.questionRange[0] && questionNumber <= d.questionRange[1]
  ) || DIFFICULTY_LEVELS[0];
}

export function getDifficultyLevel(questionNumber: number): DifficultyLevel {
  return getDifficultyForQuestion(questionNumber).level;
}

export function getDifficultyConfig(questionNumber: number): DifficultyConfig {
  return getDifficultyForQuestion(questionNumber);
}

export function getTimerDuration(level: DifficultyLevel): number {
  const config = DIFFICULTY_LEVELS.find(d => d.level === level);
  return config?.timeLimit ?? 60;
}

export function getTimerForQuestion(questionNumber: number): number {
  return getDifficultyForQuestion(questionNumber).timeLimit;
}

export function getMoneyMultiplier(questionNumber: number): number {
  return getDifficultyForQuestion(questionNumber).multiplier;
}

export function getDifficultyMultiplier(level: DifficultyLevel): number {
  const config = DIFFICULTY_LEVELS.find(d => d.level === level);
  return config?.multiplier ?? 1.0;
}

export function getFiftyRemoves(questionNumber: number): number {
  const level = getDifficultyLevel(questionNumber);
  return level === 'hard' ? 1 : 2;
}

export function getLevelName(questionNumber: number): string {
  return getDifficultyForQuestion(questionNumber).name;
}

export function getLevelColor(questionNumber: number): string {
  const level = getDifficultyLevel(questionNumber);
  switch (level) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#f44336';
  }
}

export function calculateReward(baseReward: number, questionNumber: number, streakMultiplier = 1): number {
  const diffMultiplier = getMoneyMultiplier(questionNumber);
  return Math.round(baseReward * diffMultiplier * streakMultiplier);
}
