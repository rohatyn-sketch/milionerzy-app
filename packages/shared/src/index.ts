// Types
export type { Answer, Question, MultipleChoiceQuestion, TrueFalseQuestion } from './types/question';
export { isTrueFalse } from './types/question';
export type { UserProfile, UserProgress, UserPreferences, Lifelines } from './types/user';
export type { QuizClass } from './types/class';
export type { GameConfig, DifficultyLevel, DifficultyConfig } from './types/game';
export type { ShopTheme, ShopBackground, LifelineItem } from './types/shop';
export type { Achievement, AchievementProgress } from './types/achievement';
export type { LeaderboardEntry } from './types/leaderboard';
export type {
  LoginRequest, LoginResponse, ProgressResponse, LoadProgressResponse, SaveProgressRequest,
  GenerateRequest, GenerateResponse, CriteriaResponse, LeaderboardResponse, SubmitScoreRequest
} from './types/api';

// Constants
export { QUESTIONS_PER_GAME, MONEY_PER_CORRECT, GAME_CONFIG } from './constants/game';
export { DAILY_QUESTIONS_COUNT, DAILY_MONEY_MULTIPLIER } from './constants/daily';
export {
  DIFFICULTY_LEVELS, getDifficultyForQuestion, getDifficultyLevel, getDifficultyConfig,
  getTimerDuration, getTimerForQuestion, getMoneyMultiplier, getDifficultyMultiplier,
  getFiftyRemoves, getLevelName, getLevelColor, calculateReward,
} from './constants/difficulty';
export { STREAK_TIERS, getStreakMultiplier, getFireEmoji, isNewMultiplierLevel } from './constants/streak';
export { ACHIEVEMENTS } from './constants/achievements';
export {
  SHOP_THEMES, SHOP_THEMES as THEMES,
  SHOP_BACKGROUNDS, SHOP_BACKGROUNDS as BACKGROUNDS,
  SHOP_LIFELINES, SHOP_LIFELINES as LIFELINE_ITEMS,
} from './constants/shop-items';
export { FALLBACK_QUESTIONS } from './constants/questions-fallback';

// Utils
export { formatMoney } from './utils/money';
export { getDailySeed, seededRandom } from './utils/daily-seed';
export { shuffleAnswers, getRandomQuestions, getMainCategory } from './utils/question-helpers';
