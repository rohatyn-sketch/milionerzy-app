import { apiGet, apiPost } from './client';
import type { ProgressResponse, SaveProgressRequest } from '@milionerzy/shared';

export async function loadProgress(): Promise<ProgressResponse> {
  return apiGet<ProgressResponse>('/user/progress');
}

export async function saveProgress(data: SaveProgressRequest): Promise<void> {
  await apiPost('/user/progress', data);
}
