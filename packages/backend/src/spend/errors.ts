import type { AiErrorCode, AiErrorResponse } from '@milionerzy/shared';

// Local copy of the shared codes. The backend is CommonJS and the shared
// package is emitted as ESM, so we only import *types* from it at runtime-free
// level; `satisfies` keeps these strings in lock-step with the shared union.
export const CODES = {
  GLOBAL_BUDGET: 'AI_BUDGET_GLOBAL_EXHAUSTED',
  USER_BUDGET: 'AI_BUDGET_USER_EXHAUSTED',
  DISABLED: 'AI_DISABLED',
  LEDGER_UNAVAILABLE: 'AI_BUDGET_UNAVAILABLE',
  RATE_LIMITED: 'AI_RATE_LIMITED',
} as const satisfies Record<string, AiErrorCode>;

// Polish fallback messages (the app's source language). The frontend shows its
// own localized PL/EN text keyed by `code`; these are for older clients/logs.
const MESSAGES_PL: Record<AiErrorCode, string> = {
  AI_BUDGET_GLOBAL_EXHAUSTED:
    'Funkcje AI sa chwilowo niedostepne, bo wyczerpal sie miesieczny budzet aplikacji. Gotowe pytania, ranking i postepy dzialaja normalnie.',
  AI_BUDGET_USER_EXHAUSTED:
    'Wykorzystales swoj limit generowania AI na ten miesiac. Mozesz dalej grac w istniejace zestawy pytan.',
  AI_DISABLED:
    'Funkcje AI sa chwilowo wylaczone. Gotowe pytania, ranking i postepy dzialaja normalnie.',
  AI_BUDGET_UNAVAILABLE:
    'Nie mozemy teraz sprawdzic budzetu AI, wiec wstrzymalismy generowanie. Sprobuj ponownie za chwile.',
  AI_RATE_LIMITED: 'Za duzo zapytan AI w krotkim czasie. Odczekaj chwile i sprobuj ponownie.',
};

const STATUS: Record<AiErrorCode, number> = {
  AI_BUDGET_GLOBAL_EXHAUSTED: 503,
  AI_BUDGET_USER_EXHAUSTED: 429,
  AI_DISABLED: 503,
  AI_BUDGET_UNAVAILABLE: 503,
  AI_RATE_LIMITED: 429,
};

/** Thrown whenever an AI call is refused for budget/abuse reasons. */
export class AiRefusedError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly resetsAt?: string;
  readonly retryAfterSeconds?: number;

  constructor(code: AiErrorCode, opts: { resetsAt?: string; retryAfterSeconds?: number; cause?: unknown } = {}) {
    super(MESSAGES_PL[code]);
    this.name = 'AiRefusedError';
    this.code = code;
    this.status = STATUS[code];
    this.resetsAt = opts.resetsAt;
    this.retryAfterSeconds = opts.retryAfterSeconds;
    if (opts.cause) (this as any).cause = opts.cause;
  }

  toResponse(): AiErrorResponse {
    const body: AiErrorResponse = { error: this.message, code: this.code };
    if (this.resetsAt) body.resetsAt = this.resetsAt;
    if (this.retryAfterSeconds !== undefined) body.retryAfterSeconds = this.retryAfterSeconds;
    return body;
  }
}

export function isAiRefused(err: unknown): err is AiRefusedError {
  return err instanceof AiRefusedError;
}
