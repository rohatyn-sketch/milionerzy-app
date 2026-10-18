import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryLedgerDb } from './test-utils';
import {
  PENDING_TTL_MS,
  exposureUsd,
  globalDocPath,
  readBudget,
  reserve,
  settle,
  userDocPath,
  withReservation,
} from './ledger';
import { AiRefusedError } from './errors';
import { periodKey, periodResetsAt } from './config';

const OCT = new Date('2026-10-18T12:00:00Z');

function expectRefused(p: Promise<unknown>, code: string) {
  return expect(p).rejects.toSatisfy((e: unknown) => e instanceof AiRefusedError && e.code === code);
}

describe('spend ledger', () => {
  let db: MemoryLedgerDb;
  const envBackup = { ...process.env };

  beforeEach(() => {
    db = new MemoryLedgerDb();
    delete process.env.SPEND_GLOBAL_CAP_USD;
    delete process.env.SPEND_USER_CAP_USD;
    delete process.env.SPEND_PERIOD;
    delete process.env.AI_ENABLED;
  });
  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('defaults to $80 global / $10 per user per calendar month', async () => {
    const view = await readBudget(db, 'u1', OCT);
    expect(view.config).toEqual({ globalCapUsd: 80, userCapUsd: 10, period: 'monthly', aiEnabled: true });
    expect(view.periodKey).toBe('2026-10');
    expect(view.resetsAt).toBe('2026-11-01T00:00:00.000Z');
  });

  it('reserves, then settles to the actual cost on both docs', async () => {
    const r = await reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.2, now: OCT });
    const g = (await readBudget(db, 'u1', OCT)).global;
    expect(exposureUsd(g)).toBeCloseTo(0.2);
    expect(g.spentUsd).toBe(0);

    await settle(db, r, 0.05, OCT);
    const view = await readBudget(db, 'u1', OCT);
    expect(view.global.spentUsd).toBeCloseTo(0.05);
    expect(view.user!.spentUsd).toBeCloseTo(0.05);
    expect(Object.keys(view.global.pending)).toHaveLength(0);
    expect(view.global.byFeature.questions).toBeCloseTo(0.05);
    expect(view.global.calls).toBe(1);
  });

  it('refuses once the global cap would be crossed', async () => {
    db.docs.set('config/spend', { globalCapUsd: 1, userCapUsd: 100 });
    db.docs.set(globalDocPath('2026-10'), { spentUsd: 0.9 });
    await expectRefused(
      reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.2, now: OCT }),
      'AI_BUDGET_GLOBAL_EXHAUSTED'
    );
    // A cheaper call that still fits is allowed.
    await expect(reserve(db, { uid: 'u1', feature: 'moderation', estimateUsd: 0.05, now: OCT })).resolves.toBeDefined();
  });

  it('includes the reset date in a cap refusal', async () => {
    db.docs.set(globalDocPath('2026-10'), { spentUsd: 80 });
    const err = await reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.01, now: OCT }).catch((e) => e);
    expect(err).toBeInstanceOf(AiRefusedError);
    expect(err.status).toBe(503);
    expect(err.toResponse()).toMatchObject({ code: 'AI_BUDGET_GLOBAL_EXHAUSTED', resetsAt: '2026-11-01T00:00:00.000Z' });
  });

  it('refuses a user over their personal cap while others keep going', async () => {
    db.docs.set(userDocPath('2026-10', 'heavy'), { spentUsd: 9.95 });
    await expectRefused(
      reserve(db, { uid: 'heavy', feature: 'questions', estimateUsd: 0.2, now: OCT }),
      'AI_BUDGET_USER_EXHAUSTED'
    );
    await expect(reserve(db, { uid: 'light', feature: 'questions', estimateUsd: 0.2, now: OCT })).resolves.toBeDefined();
  });

  it('starts a fresh budget in a new calendar month', async () => {
    db.docs.set(globalDocPath('2026-10'), { spentUsd: 80 });
    db.docs.set(userDocPath('2026-10', 'u1'), { spentUsd: 10 });
    await expectRefused(reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.1, now: OCT }), 'AI_BUDGET_GLOBAL_EXHAUSTED');

    const nov = new Date('2026-11-01T00:00:01Z');
    const r = await reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.1, now: nov });
    expect(r.periodKey).toBe('2026-11');
  });

  it('does not reset in lifetime mode', async () => {
    db.docs.set('config/spend', { period: 'lifetime' });
    db.docs.set(globalDocPath('lifetime'), { spentUsd: 80 });
    await expectRefused(
      reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.1, now: new Date('2027-05-01T00:00:00Z') }),
      'AI_BUDGET_GLOBAL_EXHAUSTED'
    );
  });

  it('fails closed when the ledger cannot be read', async () => {
    db.failNext = 1;
    await expectRefused(reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.1, now: OCT }), 'AI_BUDGET_UNAVAILABLE');
  });

  it('refuses calls without a user id', async () => {
    await expectRefused(reserve(db, { uid: '', feature: 'questions', estimateUsd: 0.1, now: OCT }), 'AI_BUDGET_UNAVAILABLE');
  });

  it('honours the owner kill switch in config/spend', async () => {
    db.docs.set('config/spend', { aiEnabled: false });
    await expectRefused(reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.01, now: OCT }), 'AI_DISABLED');
  });

  it('lets Firestore config override env, and env override defaults', async () => {
    process.env.SPEND_GLOBAL_CAP_USD = '5';
    process.env.SPEND_USER_CAP_USD = '1';
    expect((await readBudget(db, undefined, OCT)).config).toMatchObject({ globalCapUsd: 5, userCapUsd: 1 });
    db.docs.set('config/spend', { userCapUsd: 2, globalCapUsd: 'not-a-number' });
    expect((await readBudget(db, undefined, OCT)).config).toMatchObject({ globalCapUsd: 5, userCapUsd: 2 });
  });

  it('never lets concurrent reservations jointly exceed the global cap', async () => {
    db.docs.set('config/spend', { globalCapUsd: 1, userCapUsd: 100 });
    const attempts = Array.from({ length: 50 }, (_, i) =>
      reserve(db, { uid: `u${i % 7}`, feature: 'questions', estimateUsd: 0.15, now: OCT })
    );
    const results = await Promise.allSettled(attempts);
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    expect(ok).toBe(6); // floor(1 / 0.15)
    expect(exposureUsd((await readBudget(db, undefined, OCT)).global)).toBeLessThanOrEqual(1);
  });

  it('never lets concurrent reservations jointly exceed a user cap', async () => {
    db.docs.set('config/spend', { userCapUsd: 0.5 });
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => reserve(db, { uid: 'same', feature: 'questions', estimateUsd: 0.2, now: OCT }))
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
  });

  it('charges abandoned reservations at their estimate after the TTL', async () => {
    db.docs.set('config/spend', { globalCapUsd: 1 });
    await reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.6, now: OCT }); // never settled
    const later = new Date(OCT.getTime() + PENDING_TTL_MS + 1000);
    await expectRefused(reserve(db, { uid: 'u2', feature: 'questions', estimateUsd: 0.6, now: later }), 'AI_BUDGET_GLOBAL_EXHAUSTED');
    // The next successful reservation persists the sweep: the abandoned
    // estimate is now committed spend, not pending.
    await reserve(db, { uid: 'u2', feature: 'questions', estimateUsd: 0.3, now: later });
    const g = (await readBudget(db, undefined, later)).global;
    expect(g.spentUsd).toBeCloseTo(0.6);
    expect(exposureUsd(g)).toBeCloseTo(0.9);
  });

  it('settle never throws, and a lost settle leaves the estimate counted', async () => {
    const r = await reserve(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.3, now: OCT });
    db.failNext = 1;
    await expect(settle(db, r, 0.01, OCT)).resolves.toBeUndefined();
    expect(exposureUsd((await readBudget(db, undefined, OCT)).global)).toBeCloseTo(0.3);
  });

  it('withReservation charges the error cost when the call fails', async () => {
    await expect(
      withReservation(db, { uid: 'u1', feature: 'questions', estimateUsd: 0.4, now: OCT }, async () => {
        throw new Error('network down');
      }, () => 0)
    ).rejects.toThrow('network down');
    // default chargeOnError = estimate; the reservation used `now: OCT` but
    // settle stamps the real clock, so read the 2026-10 bucket explicitly.
    expect(db.docs.get(globalDocPath('2026-10'))!.spentUsd).toBeCloseTo(0.4);
  });
});

describe('period helpers', () => {
  it('uses UTC calendar months', () => {
    expect(periodKey('monthly', new Date('2026-12-31T23:59:59Z'))).toBe('2026-12');
    expect(periodKey('monthly', new Date('2027-01-01T00:00:00Z'))).toBe('2027-01');
    expect(periodResetsAt('monthly', new Date('2026-12-15T00:00:00Z'))).toBe('2027-01-01T00:00:00.000Z');
    expect(periodKey('lifetime', OCT)).toBe('lifetime');
    expect(periodResetsAt('lifetime', OCT)).toBeUndefined();
  });
});
