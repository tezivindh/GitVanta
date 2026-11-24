import apiClient, { SLOW_REQUEST_TIMEOUT } from './client';
import {
  ApiResponse,
  ReadmeEnhancement,
  ResumeBullet,
  PortfolioSummary,
  ImprovementRoadmap,
  AIStatus,
  RepoReviews,
  WithAI,
} from '../types';

const slow = { timeout: SLOW_REQUEST_TIMEOUT };

async function withAI<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<WithAI<T>> {
  const res = await promise;
  return { data: res.data.data as T, ai: res.data.ai ?? null };
}

const repoPath = (name: string) => encodeURIComponent(name);

export const enhancementApi = {
  async checkAiStatus(): Promise<AIStatus> {
    const response = await apiClient.get<ApiResponse<AIStatus>>('/enhance/status');
    return response.data.data!;
  },

  enhanceReadme(repoName: string): Promise<WithAI<ReadmeEnhancement>> {
    return withAI(apiClient.post(`/enhance/readme/${repoPath(repoName)}`, null, slow));
  },

  analyzeReadmeQuality(
    repoName: string
  ): Promise<WithAI<{ score: number; feedback: string[]; missingElements: string[] }>> {
    return withAI(apiClient.get(`/enhance/readme/${repoPath(repoName)}/analyze`, slow));
  },

  generateResumeBullets(repoName: string): Promise<WithAI<ResumeBullet>> {
    return withAI(apiClient.post(`/enhance/resume/${repoPath(repoName)}`, null, slow));
  },

  generateAllResumeBullets(limit?: number): Promise<WithAI<ResumeBullet[]>> {
    return withAI(apiClient.post('/enhance/resume', null, { ...slow, params: { limit } }));
  },

  generatePortfolioSummary(): Promise<WithAI<PortfolioSummary>> {
    return withAI(apiClient.post('/enhance/summary', null, slow));
  },

  generateImprovementRoadmap(): Promise<WithAI<ImprovementRoadmap>> {
    return withAI(apiClient.post('/enhance/roadmap', null, slow));
  },

  async reviewRepositories(): Promise<RepoReviews> {
    const res = await apiClient.post<ApiResponse<RepoReviews>>('/enhance/repo-reviews', null, slow);
    return res.data.data!;
  },

  async generateProjectDescription(repoName: string): Promise<WithAI<string>> {
    const res = await withAI<{ description: string }>(
      apiClient.post(`/enhance/description/${repoPath(repoName)}`, null, slow)
    );
    return { data: res.data?.description ?? '', ai: res.ai };
  },
};
