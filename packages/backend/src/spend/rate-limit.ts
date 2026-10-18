// Per-user request rate limit for AI endpoints — a cheap abuse guard in front
// of the spend ledger. It stops a single account (or a script holding its
// token) from hammering the paid endpoints, long before the dollar caps bite.
//
// State is in-memory per Cloud Run instance (max 10 instances), so the
// effective worst-case limit is limit x instance count. That is acceptable:
// the ledger's dollar caps are the hard guarantee; this only smooths bursts.
//
// Configure with AI_RATE_LIMIT_PER_MINUTE (default 3) and
// AI_RATE_LIMIT_PER_HOUR (default 20). Set either to 0 to disable that window.

import { AiRefusedError, CODES } from './errors';

interface Window {
  ms: number;
  limit: number;
}

function intEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
}

export function rateLimitWindows(): Window[] {
  return [
    { ms: 60_000, limit: intEnv('AI_RATE_LIMIT_PER_MINUTE', 3) },
    { ms: 3_600_000, limit: intEnv('AI_RATE_LIMIT_PER_HOUR', 20) },
  ].filter((w) => w.limit > 0);
}

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(private readonly windows: () => Window[] = rateLimitWindows) {}

  /** Records a hit for `key`, or throws AiRefusedError if over a limit. */
  check(key: string, now: number = Date.now()): void {
    const windows = this.windows();
    if (windows.length === 0) return;
    const longest = Math.max(...windows.map((w) => w.ms));
    const recent = (this.hits.get(key) || []).filter((t) => now - t < longest);

    for (const w of windows) {
      const inWindow = recent.filter((t) => now - t < w.ms);
      if (inWindow.length >= w.limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil((inWindow[0] + w.ms - now) / 1000));
        this.hits.set(key, recent);
        throw new AiRefusedError(CODES.RATE_LIMITED, { retryAfterSeconds });
      }
    }
    recent.push(now);
    this.hits.set(key, recent);

    // Keep memory bounded on a long-lived instance.
    if (this.hits.size > 10_000) {
      for (const [k, ts] of this.hits) {
        if (!ts.some((t) => now - t < longest)) this.hits.delete(k);
      }
    }
  }
}

const shared = new RateLimiter();

/** Throws AiRefusedError(AI_RATE_LIMITED) when `uid` is over its AI request rate. */
export function checkAiRateLimit(uid: string): void {
  shared.check(uid);
}
