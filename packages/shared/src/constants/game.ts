export const QUESTIONS_PER_GAME = 10;
export const MONEY_PER_CORRECT = 100000;
export const DAILY_QUESTIONS_COUNT = 5;
export const DAILY_MONEY_MULTIPLIER = 1.5;
export const TOTAL_GAME_POT = 1000000;
export const WRONG_ANSWER_RATIO = 0.5;

export const MONEY_PER_WRONG = -50000;

export const GAME_CONFIG: {
  questionsPerGame: number;
  moneyPerCorrect: number;
  moneyPerWrong: number;
} = {
  questionsPerGame: QUESTIONS_PER_GAME,
  moneyPerCorrect: MONEY_PER_CORRECT,
  moneyPerWrong: MONEY_PER_WRONG,
};

/**
 * Calculate how much each correct answer is worth based on total questions in the round.
 * The total pot (1,000,000 PLN) is distributed evenly across all questions.
 */
export function getRewardPerQuestion(totalQuestions: number): number {
  if (totalQuestions <= 0) return MONEY_PER_CORRECT;
  return Math.round(TOTAL_GAME_POT / totalQuestions);
}

/**
 * Calculate the penalty for a wrong answer based on total questions.
 * Penalty is half the reward per question.
 */
export function getPenaltyPerQuestion(totalQuestions: number): number {
  return -Math.round(getRewardPerQuestion(totalQuestions) * WRONG_ANSWER_RATIO);
}
