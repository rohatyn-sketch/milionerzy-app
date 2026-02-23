import { apiGet, apiPost } from './client';
import type { LeaderboardResponse, SubmitScoreRequest } from '@milionerzy/shared';

export async function getGlobalLeaderboard(): Promise<LeaderboardResponse> {
  return apiGet<LeaderboardResponse>('/leaderboard');
}

export async function submitGlobalScore(data: SubmitScoreRequest): Promise<void> {
  await apiPost('/leaderboard', data);
}
