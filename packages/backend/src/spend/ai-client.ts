// THE choke point for paid AI calls. Every Gemini generateContent request and
// every Cloud TTS synthesis in the backend goes through this file, which
//   1. reserves a worst-case cost against the global and per-user caps,
//   2. makes the call,
//   3. records the actual cost from the response (usageMetadata / characters).
// Nothing else in the codebase should call generativelanguage.googleapis.com or
// TextToSpeechClient directly.

import { defaultLedgerDb } from './firestore-ledger';
import { withReservation, type AiFeature, type LedgerDb } from './ledger';
import { estimateGeminiCostUsd, geminiCostUsd, ttsCostUsd, type UsageMetadata } from './pricing';

export const GEMINI_MODEL = 'gemini-3-flash-preview';

/** Who is spending, and on what. Required for every paid call. */
export interface SpendContext {
  uid: string;
  feature: AiFeature;
}

export interface GeminiRequest {
  parts: any[];
  generationConfig: { maxOutputTokens: number; [k: string]: unknown };
  model?: string;
}

export interface GeminiResponse {
  candidates?: any[];
  usageMetadata?: UsageMetadata;
  [k: string]: unknown;
}

/** Thrown for a non-2xx Gemini reply. Not billed by Google, charged $0. */
export class GeminiHttpError extends Error {
  constructor(readonly status: number, body: string) {
    super(`Gemini API error: ${status} - ${body}`);
    this.name = 'GeminiHttpError';
  }
}

function promptChars(parts: any[]): number {
  return parts.reduce((sum, p) => sum + (typeof p?.text === 'string' ? p.text.length : 0), 0);
}

function imageCount(parts: any[]): number {
  return parts.filter((p) => p?.inlineData).length;
}

/** Test seam: inject a fake ledger / fetch. */
export interface AiClientDeps {
  ledger?: LedgerDb;
  fetchImpl?: typeof fetch;
}

/**
 * Calls Gemini generateContent under the spend guard and returns the parsed
 * JSON body. Throws AiRefusedError when a cap is hit or the ledger is down.
 */
export async function callGemini(ctx: SpendContext, req: GeminiRequest, deps: AiClientDeps = {}): Promise<GeminiResponse> {
  const model = req.model ?? GEMINI_MODEL;
  const ledger = deps.ledger ?? (await defaultLedgerDb());
  const doFetch = deps.fetchImpl ?? fetch;
  const estimateUsd = estimateGeminiCostUsd(model, {
    promptChars: promptChars(req.parts),
    images: imageCount(req.parts),
    maxOutputTokens: req.generationConfig.maxOutputTokens,
  });

  return withReservation(
    ledger,
    { uid: ctx.uid, feature: ctx.feature, estimateUsd },
    async () => {
      const key = process.env.GEMINI_API_KEY || '';
      const response = await doFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: req.parts }], generationConfig: req.generationConfig }),
        }
      );
      if (!response.ok) throw new GeminiHttpError(response.status, await response.text());
      return (await response.json()) as GeminiResponse;
    },
    (data) => geminiCostUsd(model, data.usageMetadata),
    // An HTTP error reply is not billed. A network failure/timeout might have
    // been, so we charge the full estimate to stay on the safe side.
    (err) => (err instanceof GeminiHttpError ? 0 : estimateUsd)
  );
}

/**
 * Runs a Cloud TTS job for `characters` billable characters under the spend
 * guard. The job itself is passed in so this file stays free of TTS details.
 */
export async function withTtsBudget<T>(
  ctx: SpendContext,
  characters: number,
  job: () => Promise<T>,
  deps: Pick<AiClientDeps, 'ledger'> = {}
): Promise<T> {
  const ledger = deps.ledger ?? (await defaultLedgerDb());
  const cost = ttsCostUsd(characters);
  // TTS bills on input characters, which we know exactly up front.
  return withReservation(ledger, { uid: ctx.uid, feature: ctx.feature, estimateUsd: cost }, job, () => cost);
}
