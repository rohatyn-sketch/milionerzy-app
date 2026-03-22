import { apiPost } from './client';

export interface GeneratePodcastRequest {
  questionText: string;
  category: string;
  correctAnswer: string;
  explanation?: string;
}

export interface PodcastInfo {
  podcastId: string;
  audioUrl: string;
  title: string;
  duration: number;
  script: string;
}

export async function generatePodcast(request: GeneratePodcastRequest): Promise<PodcastInfo> {
  return apiPost<PodcastInfo>('/podcast/generate', request);
}

export async function lookupPodcasts(questionTexts: string[]): Promise<Record<string, PodcastInfo>> {
  const res = await apiPost<{ podcasts: Record<string, PodcastInfo> }>('/podcast/lookup', { questionTexts });
  return res.podcasts;
}
