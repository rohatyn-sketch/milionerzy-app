// Price list for every paid AI call the backend makes, and helpers that turn a
// response's usage into USD.
//
// SOURCES (checked 2026-10-18):
//   Gemini API — https://ai.google.dev/gemini-api/docs/pricing
//     (page "Last updated 2026-10-16 UTC"), Standard paid tier, per 1M tokens:
//     gemini-3-flash-preview: input text/image/video $0.50, input audio $1.00,
//     output $3.00 "including thinking tokens", context-cache read $0.05.
//     No separate >200k-token tier is listed for this model.
//   Thinking billing — https://ai.google.dev/gemini-api/docs/thinking
//     "response pricing is the sum of output tokens and thinking tokens".
//   usageMetadata fields — https://ai.google.dev/api/generate-content#UsageMetadata
//     totalTokenCount = prompt + toolUsePrompt + thoughts + candidates, so
//     candidatesTokenCount excludes thoughtsTokenCount and we add both.
//   Cloud Text-to-Speech — https://cloud.google.com/text-to-speech/pricing
//     WaveNet is listed at $4 / 1M characters after 4M free per month (it used to
//     be $16). We deliberately charge the ledger $16 / 1M and ignore the free
//     tier: over-estimating is the safe direction for a spend guard, and
//     podcasts are a small share of spend either way.
//
// When Google changes prices, update this table; nothing else needs to change.
// An unknown model is refused rather than guessed (see priceFor).

export interface ModelPrice {
  /** USD per 1M input tokens (text / image / video). */
  inputPerM: number;
  /** USD per 1M cached input tokens. */
  cachedInputPerM: number;
  /** USD per 1M output tokens, thinking included. */
  outputPerM: number;
}

export const GEMINI_PRICES: Record<string, ModelPrice> = {
  'gemini-3-flash-preview': { inputPerM: 0.5, cachedInputPerM: 0.05, outputPerM: 3.0 },
};

/** USD per character for Cloud TTS WaveNet voices (conservative, see above). */
export const TTS_USD_PER_CHAR = 16 / 1_000_000;

export interface UsageMetadata {
  promptTokenCount?: number;
  cachedContentTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  totalTokenCount?: number;
}

export function priceFor(model: string): ModelPrice {
  const p = GEMINI_PRICES[model];
  if (!p) throw new Error(`No price configured for model "${model}" — add it to spend/pricing.ts`);
  return p;
}

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** Actual cost of one generateContent call from its usageMetadata. */
export function geminiCostUsd(model: string, usage: UsageMetadata | undefined): number {
  const p = priceFor(model);
  if (!usage) return 0;
  const prompt = n(usage.promptTokenCount) + n(usage.toolUsePromptTokenCount);
  const cached = Math.min(n(usage.cachedContentTokenCount), prompt);
  let output = n(usage.candidatesTokenCount) + n(usage.thoughtsTokenCount);
  // If the per-part counts are missing but the total is present, bill the
  // remainder as output (the more expensive rate).
  const total = n(usage.totalTokenCount);
  if (total > prompt + output) output = total - prompt;
  return ((prompt - cached) * p.inputPerM + cached * p.cachedInputPerM + output * p.outputPerM) / 1_000_000;
}

/**
 * Tokens we budget for one inline image. Gemini 3 bills images by
 * media_resolution (up to 1120 tokens at "high", the default for images); we
 * round up generously.
 */
export const IMAGE_TOKEN_ESTIMATE = 2_000;

/**
 * Worst-case cost of a call before it is made: prompt length (assume 2 chars
 * per token, pessimistic for Polish/English) plus images, plus the full
 * maxOutputTokens at the output rate. On Gemini thinking models maxOutputTokens
 * is documented to cap thinking + answer together, so this should be an upper
 * bound; settle() records the real usage either way, so a wrong guess only
 * shifts the reservation, never the recorded spend.
 */
export function estimateGeminiCostUsd(
  model: string,
  opts: { promptChars: number; images?: number; maxOutputTokens: number }
): number {
  const p = priceFor(model);
  const inputTokens = Math.ceil(opts.promptChars / 2) + (opts.images ?? 0) * IMAGE_TOKEN_ESTIMATE;
  return (inputTokens * p.inputPerM + opts.maxOutputTokens * p.outputPerM) / 1_000_000;
}

/** Cloud TTS cost: billed per input character, spaces and newlines included. */
export function ttsCostUsd(characters: number): number {
  return n(characters) * TTS_USD_PER_CHAR;
}
