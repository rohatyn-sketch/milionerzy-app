// Spend-cap configuration.
//
// Precedence (highest first):
//   1. Firestore document `config/spend` — editable in the Firebase console, takes
//      effect on the next AI request, no redeploy needed.
//   2. Environment variables on the Cloud Run service.
//   3. The safe defaults below.
//
// The Firestore doc is read inside the same transaction that reserves budget,
// so a config the ledger cannot read is treated like a ledger it cannot read:
// the request is refused (fail closed).

export type SpendPeriod = 'monthly' | 'lifetime';

export interface SpendConfig {
  /** Hard cap on AI spend for the whole app, per period, in USD. */
  globalCapUsd: number;
  /** Hard cap on AI spend for a single signed-in user, per period, in USD. */
  userCapUsd: number;
  /**
   * 'monthly' — ledger resets at 00:00 UTC on the 1st of each calendar month
   * (owner decision, default). 'lifetime' — never resets on its own.
   */
  period: SpendPeriod;
  /** Master switch. false = every AI call is refused immediately. */
  aiEnabled: boolean;
}

export const DEFAULT_SPEND_CONFIG: SpendConfig = {
  globalCapUsd: 80,
  userCapUsd: 10,
  period: 'monthly',
  aiEnabled: true,
};

export const SPEND_CONFIG_DOC = 'config/spend';

function num(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function period(value: unknown): SpendPeriod | undefined {
  return value === 'monthly' || value === 'lifetime' ? value : undefined;
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/** Config from env vars layered over the defaults. Invalid values are ignored. */
export function envSpendConfig(env: NodeJS.ProcessEnv = process.env): SpendConfig {
  return {
    globalCapUsd: num(env.SPEND_GLOBAL_CAP_USD) ?? DEFAULT_SPEND_CONFIG.globalCapUsd,
    userCapUsd: num(env.SPEND_USER_CAP_USD) ?? DEFAULT_SPEND_CONFIG.userCapUsd,
    period: period(env.SPEND_PERIOD) ?? DEFAULT_SPEND_CONFIG.period,
    aiEnabled: bool(env.AI_ENABLED) ?? DEFAULT_SPEND_CONFIG.aiEnabled,
  };
}

/** Firestore `config/spend` fields layered over a base config. */
export function mergeSpendConfig(base: SpendConfig, doc: Record<string, unknown> | undefined): SpendConfig {
  if (!doc) return base;
  return {
    globalCapUsd: num(doc.globalCapUsd) ?? base.globalCapUsd,
    userCapUsd: num(doc.userCapUsd) ?? base.userCapUsd,
    period: period(doc.period) ?? base.period,
    aiEnabled: bool(doc.aiEnabled) ?? base.aiEnabled,
  };
}

/** Ledger bucket for `now`: 'YYYY-MM' (UTC) for monthly, 'lifetime' otherwise. */
export function periodKey(p: SpendPeriod, now: Date): string {
  if (p === 'lifetime') return 'lifetime';
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** When the current bucket rolls over, or undefined for lifetime. */
export function periodResetsAt(p: SpendPeriod, now: Date): string | undefined {
  if (p === 'lifetime') return undefined;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}
