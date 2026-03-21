import { apiPost } from './client';

export interface GeneratePodcastRequest {
  questionText: string;
  category: string;
  correctAnswer: string;
  explanation?: string;
}

export interface GeneratePodcastResponse {
  podcastId: string;
  audioUrl: string;
  title: string;
  duration: number;
  script: string;
}

export async function generatePodcast(request: GeneratePodcastRequest): Promise<GeneratePodcastResponse> {
  return apiPost<GeneratePodcastResponse>('/podcast/generate', request);
}
