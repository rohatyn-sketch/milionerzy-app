import { AI_ERROR_CODES, type AiErrorCode } from '@milionerzy/shared';
import { ApiError } from '../api/client';
import { localeTag, t } from './i18n';

// Friendly, localized messages for AI requests the backend refused because of
// the spend caps, the owner's kill switch or rate limiting. Non-AI features
// (playing existing questions, leaderboard, progress) are unaffected, and the
// messages say so.

function formatDate(iso?: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' });
}

/**
 * Returns a localized message when `err` is a refused AI request, otherwise
 * null (the caller then shows its usual error text).
 */
export function aiRefusalMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || !err.code) return null;
  const code = err.code as AiErrorCode;
  const date = formatDate(err.details.resetsAt);

  switch (code) {
    case AI_ERROR_CODES.GLOBAL_BUDGET:
      return date
        ? t('ai.globalBudgetUntil', 'Generowanie AI jest wstrzymane do {date} — wyczerpal sie miesieczny budzet tej darmowej aplikacji. Gotowe zestawy pytan, ranking i postepy dzialaja normalnie.', { date })
        : t('ai.globalBudget', 'Generowanie AI jest chwilowo wstrzymane — wyczerpal sie budzet tej darmowej aplikacji. Gotowe zestawy pytan, ranking i postepy dzialaja normalnie.');
    case AI_ERROR_CODES.USER_BUDGET:
      return date
        ? t('ai.userBudgetUntil', 'Wykorzystales swoj limit generowania AI w tym miesiacu. Nowy limit od {date}. Mozesz dalej grac w swoje zestawy pytan.', { date })
        : t('ai.userBudget', 'Wykorzystales swoj limit generowania AI. Mozesz dalej grac w swoje zestawy pytan.');
    case AI_ERROR_CODES.DISABLED:
      return t('ai.disabled', 'Funkcje AI sa chwilowo wylaczone. Gotowe zestawy pytan, ranking i postepy dzialaja normalnie.');
    case AI_ERROR_CODES.LEDGER_UNAVAILABLE:
      return t('ai.unavailable', 'Nie mozemy teraz sprawdzic limitu AI. Sprobuj ponownie za chwile.');
    case AI_ERROR_CODES.RATE_LIMITED: {
      const s = Number(err.details.retryAfterSeconds);
      return Number.isFinite(s) && s > 0
        ? t('ai.rateLimitedIn', 'Za duzo zapytan AI naraz. Sprobuj ponownie za {s} s.', { s: Math.ceil(s) })
        : t('ai.rateLimited', 'Za duzo zapytan AI naraz. Odczekaj chwile i sprobuj ponownie.');
    }
    default:
      return null;
  }
}
