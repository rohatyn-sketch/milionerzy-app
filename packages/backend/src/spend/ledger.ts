// AI spend ledger (Firestore).
//
// Every paid AI call goes through reserve() -> call -> settle():
//
//   reserve  One transaction reads config/spend, the period's global doc and the
//            user's doc. If   spent + pending + estimate > cap   for either, the
//            call is refused. Otherwise the worst-case estimate is parked in a
//            `pending` map on both docs, so concurrent requests see it at once
//            and cannot jointly overshoot the cap.
//   settle   After the call, the pending entry is replaced by the real cost
//            computed from the response's token usage.
//
// Because estimates are worst-case (max output tokens), spent + pending is an
// upper bound on real spend, so the cap holds even under concurrency. If a
// process dies between reserve and settle, its pending entry is swept after
// PENDING_TTL_MS and charged at the full estimate (over-count, never under).
//
// Any failure to read or write the ledger refuses the call (fail closed).
//
// Layout:
//   config/spend                         caps + period + aiEnabled (owner-editable)
//   spendLedger/{period}                 app-wide totals for the period
//   spendLedger/{period}/users/{uid}     per-user totals for the period
// where {period} is 'YYYY-MM' (UTC) for monthly or 'lifetime'.

import { randomUUID } from 'crypto';
import { AiRefusedError, CODES } from './errors';
import {
  SPEND_CONFIG_DOC,
  envSpendConfig,
  mergeSpendConfig,
  periodKey,
  periodResetsAt,
  type SpendConfig,
} from './config';

export const LEDGER_COLLECTION = 'spendLedger';
export const PENDING_TTL_MS = 15 * 60 * 1000;

/** Minimal transactional document store, so the ledger can be unit-tested. */
export interface LedgerTx {
  get(path: string): Promise<Record<string, any> | undefined>;
  set(path: string, data: Record<string, any>): void;
}
export interface LedgerDb {
  runTransaction<T>(fn: (tx: LedgerTx) => Promise<T>): Promise<T>;
  get(path: string): Promise<Record<string, any> | undefined>;
}

export type AiFeature = 'questions' | 'moderation' | 'podcast-content' | 'podcast-script' | 'podcast-tts';

interface PendingEntry {
  usd: number;
  at: number;
  feature: AiFeature;
}

export interface LedgerDoc {
  periodKey: string;
  spentUsd: number;
  calls: number;
  byFeature: Record<string, number>;
  pending: Record<string, PendingEntry>;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  uid: string;
  feature: AiFeature;
  periodKey: string;
  estimateUsd: number;
}

const round = (n: number): number => Math.round(n * 1e6) / 1e6;
// Tolerance for float noise when comparing against a cap.
const EPS = 1e-9;

export function globalDocPath(period: string): string {
  return `${LEDGER_COLLECTION}/${period}`;
}
export function userDocPath(period: string, uid: string): string {
  return `${LEDGER_COLLECTION}/${period}/users/${uid}`;
}

function emptyDoc(period: string): LedgerDoc {
  return { periodKey: period, spentUsd: 0, calls: 0, byFeature: {}, pending: {}, updatedAt: '' };
}

function normalize(raw: Record<string, any> | undefined, period: string): LedgerDoc {
  if (!raw) return emptyDoc(period);
  return {
    periodKey: period,
    spentUsd: Number(raw.spentUsd) || 0,
    calls: Number(raw.calls) || 0,
    byFeature: { ...(raw.byFeature || {}) },
    pending: { ...(raw.pending || {}) },
    updatedAt: raw.updatedAt || '',
  };
}

/** Charges stale reservations at their full estimate (conservative). */
function sweepExpired(doc: LedgerDoc, nowMs: number): void {
  for (const [id, p] of Object.entries(doc.pending)) {
    if (nowMs - p.at > PENDING_TTL_MS) {
      doc.spentUsd = round(doc.spentUsd + p.usd);
      doc.byFeature[p.feature] = round((doc.byFeature[p.feature] || 0) + p.usd);
      delete doc.pending[id];
    }
  }
}

export function pendingUsd(doc: LedgerDoc): number {
  return round(Object.values(doc.pending).reduce((sum, p) => sum + p.usd, 0));
}

/** Committed + in-flight spend: the number the cap is checked against. */
export function exposureUsd(doc: LedgerDoc): number {
  return round(doc.spentUsd + pendingUsd(doc));
}

async function readConfig(tx: LedgerTx): Promise<SpendConfig> {
  return mergeSpendConfig(envSpendConfig(), await tx.get(SPEND_CONFIG_DOC));
}

export interface ReserveInput {
  uid: string;
  feature: AiFeature;
  estimateUsd: number;
  now?: Date;
}

/**
 * Reserves `estimateUsd` against both caps, or throws AiRefusedError.
 * Ledger/config errors become AI_BUDGET_UNAVAILABLE (fail closed).
 */
export async function reserve(db: LedgerDb, input: ReserveInput): Promise<Reservation> {
  const now = input.now ?? new Date();
  if (!input.uid) {
    // Every AI route requires sign-in; an anonymous paid call is a bug.
    throw new AiRefusedError(CODES.LEDGER_UNAVAILABLE);
  }
  const estimate = round(Math.max(0, input.estimateUsd));

  try {
    return await db.runTransaction(async (tx) => {
      const config = await readConfig(tx);
      const period = periodKey(config.period, now);
      const resetsAt = periodResetsAt(config.period, now);
      const gPath = globalDocPath(period);
      const uPath = userDocPath(period, input.uid);
      const g = normalize(await tx.get(gPath), period);
      const u = normalize(await tx.get(uPath), period);

      if (!config.aiEnabled) throw new AiRefusedError(CODES.DISABLED);

      sweepExpired(g, now.getTime());
      sweepExpired(u, now.getTime());

      if (exposureUsd(g) + estimate > config.globalCapUsd + EPS) {
        throw new AiRefusedError(CODES.GLOBAL_BUDGET, { resetsAt });
      }
      if (exposureUsd(u) + estimate > config.userCapUsd + EPS) {
        throw new AiRefusedError(CODES.USER_BUDGET, { resetsAt });
      }

      const id = randomUUID();
      const entry: PendingEntry = { usd: estimate, at: now.getTime(), feature: input.feature };
      const stamp = now.toISOString();
      g.pending[id] = entry;
      u.pending[id] = entry;
      g.updatedAt = stamp;
      u.updatedAt = stamp;
      tx.set(gPath, { ...g });
      tx.set(uPath, { ...u, uid: input.uid });

      return { id, uid: input.uid, feature: input.feature, periodKey: period, estimateUsd: estimate };
    });
  } catch (err) {
    if (err instanceof AiRefusedError) throw err;
    console.error('[Spend] ledger reserve failed, refusing AI call:', (err as Error)?.message);
    throw new AiRefusedError(CODES.LEDGER_UNAVAILABLE, { cause: err });
  }
}

/**
 * Replaces a reservation with the actual cost. Never throws: if the write
 * fails, the reservation stays pending and is later charged at its estimate.
 */
export async function settle(db: LedgerDb, r: Reservation, actualUsd: number, now: Date = new Date()): Promise<void> {
  const actual = round(Math.max(0, actualUsd));
  try {
    await db.runTransaction(async (tx) => {
      const gPath = globalDocPath(r.periodKey);
      const uPath = userDocPath(r.periodKey, r.uid);
      const docs = [
        { path: gPath, doc: normalize(await tx.get(gPath), r.periodKey), extra: {} },
        { path: uPath, doc: normalize(await tx.get(uPath), r.periodKey), extra: { uid: r.uid } },
      ];
      for (const { path, doc, extra } of docs) {
        let delta = actual;
        if (doc.pending[r.id]) {
          delete doc.pending[r.id];
        } else {
          // Already swept and charged at the estimate; only top up if the real
          // cost was somehow higher.
          delta = Math.max(0, actual - r.estimateUsd);
        }
        doc.spentUsd = round(doc.spentUsd + delta);
        doc.byFeature[r.feature] = round((doc.byFeature[r.feature] || 0) + delta);
        doc.calls += 1;
        doc.updatedAt = now.toISOString();
        tx.set(path, { ...doc, ...extra });
      }
    });
  } catch (err) {
    console.error('[Spend] ledger settle failed; reservation stays pending (charged at estimate later):', (err as Error)?.message);
  }
}

/**
 * Runs `call` under a reservation. `costOf` turns the call's result into USD.
 * If the call throws, it is charged at `chargeOnError` (default: the estimate,
 * since we cannot know whether the provider billed it).
 */
export async function withReservation<T>(
  db: LedgerDb,
  input: ReserveInput,
  call: () => Promise<T>,
  costOf: (result: T) => number,
  chargeOnError: (err: unknown) => number = () => input.estimateUsd
): Promise<T> {
  const r = await reserve(db, input);
  let result: T;
  try {
    result = await call();
  } catch (err) {
    await settle(db, r, chargeOnError(err));
    throw err;
  }
  await settle(db, r, costOf(result));
  return result;
}

export interface BudgetView {
  config: SpendConfig;
  periodKey: string;
  resetsAt?: string;
  global: LedgerDoc;
  user?: LedgerDoc;
}

/** Read-only snapshot for the budget endpoint and the spend-report script. */
export async function readBudget(db: LedgerDb, uid?: string, now: Date = new Date()): Promise<BudgetView> {
  const config = mergeSpendConfig(envSpendConfig(), await db.get(SPEND_CONFIG_DOC));
  const period = periodKey(config.period, now);
  const global = normalize(await db.get(globalDocPath(period)), period);
  const user = uid ? normalize(await db.get(userDocPath(period, uid)), period) : undefined;
  return { config, periodKey: period, resetsAt: periodResetsAt(config.period, now), global, user };
}
