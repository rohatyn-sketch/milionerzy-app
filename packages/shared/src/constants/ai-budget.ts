// Error codes the backend returns when an AI feature is refused for cost or
// abuse reasons. The frontend maps each code to a localized, friendly message;
// the backend also sends a Polish `error` string for older clients.
export const AI_ERROR_CODES = {
  /** The app-wide AI budget for the current period is used up. */
  GLOBAL_BUDGET: 'AI_BUDGET_GLOBAL_EXHAUSTED',
  /** This user's personal AI budget for the current period is used up. */
  USER_BUDGET: 'AI_BUDGET_USER_EXHAUSTED',
  /** The owner switched AI features off (config/spend.aiEnabled = false). */
  DISABLED: 'AI_DISABLED',
  /** The spend ledger could not be read, so we refuse rather than spend blind. */
  LEDGER_UNAVAILABLE: 'AI_BUDGET_UNAVAILABLE',
  /** Too many AI requests in a short time. */
  RATE_LIMITED: 'AI_RATE_LIMITED',
} as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

/** Body of an error response for a refused AI request. */
export interface AiErrorResponse {
  error: string;
  code: AiErrorCode;
  /** ISO timestamp when the budget period resets (absent for lifetime periods). */
  resetsAt?: string;
  /** Seconds until a rate-limited client may retry. */
  retryAfterSeconds?: number;
}

/** GET /api/ai-budget — the signed-in user's own AI budget. */
export interface AiBudgetResponse {
  aiAvailable: boolean;
  period: string;
  resetsAt?: string;
  user: { spentUsd: number; capUsd: number; remainingUsd: number };
}
