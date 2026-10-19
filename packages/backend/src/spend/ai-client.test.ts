import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryLedgerDb } from './test-utils';
import { callGemini, withTtsBudget } from './ai-client';
import { exposureUsd, readBudget } from './ledger';
import { AiRefusedError } from './errors';

// No test here (or anywhere) reaches the real Gemini API: fetch is injected.
function okFetch(usageMetadata: Record<string, number>) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }], usageMetadata }), { status: 200 })
  ) as unknown as typeof fetch;
}

const req = { parts: [{ text: 'Pytanie testowe' }], generationConfig: { maxOutputTokens: 1024 } };

describe('callGemini (spend choke point)', () => {
  let ledger: MemoryLedgerDb;
  beforeEach(() => {
    ledger = new MemoryLedgerDb();
  });

  it('records the actual cost from usageMetadata', async () => {
    const fetchImpl = okFetch({ promptTokenCount: 1_000, candidatesTokenCount: 200, thoughtsTokenCount: 300 });
    await callGemini({ uid: 'u1', feature: 'moderation' }, req, { ledger, fetchImpl });
    const view = await readBudget(ledger, 'u1');
    expect(view.global.spentUsd).toBeCloseTo((1_000 * 0.5 + 500 * 3) / 1e6, 9);
    expect(view.user!.spentUsd).toBeCloseTo(view.global.spentUsd, 12);
    expect(Object.keys(view.global.pending)).toHaveLength(0);
  });

  it('does not call Gemini at all once the global cap is reached', async () => {
    const fetchImpl = okFetch({ promptTokenCount: 1 });
    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    ledger.docs.set(`spendLedger/${period}`, { spentUsd: 80 });
    await expect(callGemini({ uid: 'u1', feature: 'questions' }, req, { ledger, fetchImpl })).rejects.toBeInstanceOf(AiRefusedError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not call Gemini when the ledger is unreachable (fail closed)', async () => {
    const fetchImpl = okFetch({ promptTokenCount: 1 });
    ledger.failNext = 1;
    const err = await callGemini({ uid: 'u1', feature: 'questions' }, req, { ledger, fetchImpl }).catch((e) => e);
    expect(err.code).toBe('AI_BUDGET_UNAVAILABLE');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('charges nothing for an HTTP error reply but the estimate for a network failure', async () => {
    const httpErr = vi.fn(async () => new Response('quota', { status: 429 })) as unknown as typeof fetch;
    await expect(callGemini({ uid: 'u1', feature: 'questions' }, req, { ledger, fetchImpl: httpErr })).rejects.toThrow(/429/);
    expect((await readBudget(ledger)).global.spentUsd).toBe(0);

    const netErr = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    await expect(callGemini({ uid: 'u1', feature: 'questions' }, req, { ledger, fetchImpl: netErr })).rejects.toThrow('fetch failed');
    expect((await readBudget(ledger)).global.spentUsd).toBeGreaterThan(0);
  });
});

describe('withTtsBudget', () => {
  it('charges per character and refuses over the user cap', async () => {
    const ledger = new MemoryLedgerDb();
    ledger.docs.set('config/spend', { userCapUsd: 0.05 });
    await withTtsBudget({ uid: 'u1', feature: 'podcast-tts' }, 1_000, async () => 'audio', { ledger });
    expect(exposureUsd((await readBudget(ledger, 'u1')).user!)).toBeCloseTo(0.016, 9);

    const job = vi.fn(async () => 'audio');
    await expect(withTtsBudget({ uid: 'u1', feature: 'podcast-tts' }, 3_000, job, { ledger })).rejects.toMatchObject({
      code: 'AI_BUDGET_USER_EXHAUSTED',
    });
    expect(job).not.toHaveBeenCalled();
  });
});
