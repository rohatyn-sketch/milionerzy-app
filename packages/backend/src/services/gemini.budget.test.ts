import { describe, it, expect, vi } from 'vitest';
import { AiRefusedError } from '../spend/errors';

import { moderateTopic, generateWithGemini } from './gemini.service';

const { callGemini } = vi.hoisted(() => ({ callGemini: vi.fn() }));
vi.mock('../spend/ai-client', () => ({ callGemini: (...a: unknown[]) => callGemini(...a) }));

describe('budget refusals inside the Gemini services', () => {
  it('moderation does not retry or swallow a budget refusal', async () => {
    callGemini.mockReset().mockRejectedValue(new AiRefusedError('AI_BUDGET_GLOBAL_EXHAUSTED'));
    await expect(moderateTopic('u1', 'Matematyka: ulamki')).rejects.toMatchObject({ code: 'AI_BUDGET_GLOBAL_EXHAUSTED' });
    expect(callGemini).toHaveBeenCalledTimes(1);
  });

  it('every paid call is attributed to the requesting user and a feature', async () => {
    callGemini.mockReset().mockResolvedValue({ candidates: [{ content: { parts: [{ text: '{"allowed": true, "reason": ""}' }] } }] });
    await moderateTopic('user-42', 'Historia Polski');
    expect(callGemini.mock.calls[0][0]).toEqual({ uid: 'user-42', feature: 'moderation' });

    callGemini.mockReset().mockRejectedValue(new AiRefusedError('AI_BUDGET_USER_EXHAUSTED'));
    await expect(generateWithGemini('user-42', 'Historia Polski')).rejects.toBeInstanceOf(AiRefusedError);
    expect(callGemini.mock.calls[0][0]).toEqual({ uid: 'user-42', feature: 'questions' });
  });
});
