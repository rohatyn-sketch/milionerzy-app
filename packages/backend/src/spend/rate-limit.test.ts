import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limit';
import { AiRefusedError } from './errors';

describe('RateLimiter', () => {
  const limiter = () =>
    new RateLimiter(() => [
      { ms: 60_000, limit: 2 },
      { ms: 3_600_000, limit: 3 },
    ]);

  it('allows up to the per-minute limit, then refuses with a retry hint', () => {
    const rl = limiter();
    rl.check('u', 0);
    rl.check('u', 1_000);
    const err = (() => {
      try {
        rl.check('u', 2_000);
      } catch (e) {
        return e as AiRefusedError;
      }
    })();
    expect(err).toBeInstanceOf(AiRefusedError);
    expect(err!.code).toBe('AI_RATE_LIMITED');
    expect(err!.retryAfterSeconds).toBe(58);
  });

  it('applies the hourly window after the minute window clears', () => {
    const rl = limiter();
    rl.check('u', 0);
    rl.check('u', 1_000);
    rl.check('u', 61_000);
    expect(() => rl.check('u', 122_000)).toThrow(AiRefusedError);
    expect(() => rl.check('u', 3_600_001)).not.toThrow();
  });

  it('tracks users independently', () => {
    const rl = limiter();
    rl.check('a', 0);
    rl.check('a', 0);
    expect(() => rl.check('b', 0)).not.toThrow();
  });
});
