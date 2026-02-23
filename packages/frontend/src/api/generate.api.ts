import { apiPost } from './client';
import type { GenerateRequest, GenerateResponse } from '@milionerzy/shared';

export async function generateQuestions(request: GenerateRequest): Promise<GenerateResponse> {
  return apiPost<GenerateResponse>('/generate', request);
}
