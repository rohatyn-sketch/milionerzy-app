import { describe, it, expect } from 'vitest';
import { estimateGeminiCostUsd, geminiCostUsd, priceFor, ttsCostUsd } from './pricing';

const M = 'gemini-3-flash-preview';

describe('geminiCostUsd', () => {
  it('bills input at $0.50/M and output at $3/M', () => {
    expect(geminiCostUsd(M, { promptTokenCount: 1_000_000 })).toBeCloseTo(0.5, 9);
    expect(geminiCostUsd(M, { candidatesTokenCount: 1_000_000 })).toBeCloseTo(3, 9);
  });

  it('bills thinking tokens at the output rate', () => {
    const cost = geminiCostUsd(M, { promptTokenCount: 2_000, candidatesTokenCount: 10_000, thoughtsTokenCount: 5_000 });
    expect(cost).toBeCloseTo((2_000 * 0.5 + 15_000 * 3) / 1e6, 12);
  });

  it('bills cached prompt tokens at the cache rate', () => {
    const cost = geminiCostUsd(M, { promptTokenCount: 10_000, cachedContentTokenCount: 8_000 });
    expect(cost).toBeCloseTo((2_000 * 0.5 + 8_000 * 0.05) / 1e6, 12);
  });

  it('falls back to totalTokenCount when per-part counts are missing', () => {
    const cost = geminiCostUsd(M, { promptTokenCount: 1_000, totalTokenCount: 4_000 });
    expect(cost).toBeCloseTo((1_000 * 0.5 + 3_000 * 3) / 1e6, 12);
  });

  it('treats missing usage as zero and ignores junk values', () => {
    expect(geminiCostUsd(M, undefined)).toBe(0);
    expect(geminiCostUsd(M, { promptTokenCount: -5, candidatesTokenCount: NaN })).toBe(0);
  });

  it('refuses unknown models instead of guessing a price', () => {
    expect(() => priceFor('gemini-99-ultra')).toThrow(/No price configured/);
  });
});

describe('estimateGeminiCostUsd', () => {
  it('is an upper bound: full max output at the output rate plus pessimistic input', () => {
    const est = estimateGeminiCostUsd(M, { promptChars: 4_000, images: 1, maxOutputTokens: 65_536 });
    expect(est).toBeCloseTo(((2_000 + 2_000) * 0.5 + 65_536 * 3) / 1e6, 12);
    // A realistic question-generation response is far cheaper than the estimate.
    expect(geminiCostUsd(M, { promptTokenCount: 1_500, candidatesTokenCount: 20_000, thoughtsTokenCount: 8_000 })).toBeLessThan(est);
  });
});

describe('ttsCostUsd', () => {
  it('charges per character', () => {
    expect(ttsCostUsd(1_000_000)).toBeCloseTo(16, 9);
    expect(ttsCostUsd(0)).toBe(0);
  });
});
