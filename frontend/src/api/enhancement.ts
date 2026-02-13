// =====================================================
// ENHANCEMENT API SERVICE
// =====================================================

import apiClient from './client';
import {
  ApiResponse,
  ReadmeEnhancement,
  ResumeBullet,
  PortfolioSummary,
  ImprovementRoadmap,
} from '../types';

export const enhancementApi = {
  /**
   * Check AI status
   */
  async checkAiStatus(): Promise<{ available: boolean; message: string }> {
    const response = await apiClient.get<ApiResponse<{ available: boolean; message: string }>>('/enhance/status');
    return response.data.data!;
  },

  /**
   * Enhance README
   */
  async enhanceReadme(repoName: string): Promise<ReadmeEnhancement> {
    const response = await apiClient.post<ApiResponse<ReadmeEnhancement>>(`/enhance/readme/${repoName}`);
    return response.data.data!;
  },

  /**
   * Analyze README quality
   */
  async analyzeReadmeQuality(repoName: string): Promise<{
    score: number;
    feedback: string[];
    missingElements: string[];
  }> {
    const response = await apiClient.get<ApiResponse<{
      score: number;
      feedback: string[];
      missingElements: string[];
    }>>(`/enhance/readme/${repoName}/analyze`);
    return response.data.data!;
  },

  /**
   * Generate resume bullets for a repo
   */
  async generateResumeBullets(repoName: string): Promise<ResumeBullet> {
    const response = await apiClient.post<ApiResponse<ResumeBullet>>(`/enhance/resume/${repoName}`);
    return response.data.data!;
  },

  /**
   * Generate all resume bullets
   */
  async generateAllResumeBullets(limit?: number): Promise<ResumeBullet[]> {
    const response = await apiClient.post<ApiResponse<ResumeBullet[]>>('/enhance/resume', null, {
      params: { limit },
    });
    return response.data.data!;
  },

  /**
   * Generate portfolio summary
   */
  async generatePortfolioSummary(): Promise<PortfolioSummary> {
    const response = await apiClient.post<ApiResponse<PortfolioSummary>>('/enhance/summary');
    return response.data.data!;
  },

  /**
   * Generate improvement roadmap
   */
  async generateImprovementRoadmap(): Promise<ImprovementRoadmap> {
    const response = await apiClient.post<ApiResponse<ImprovementRoadmap>>('/enhance/roadmap');
    return response.data.data!;
  },

  /**
   * Generate project description
   */
  async generateProjectDescription(repoName: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ description: string }>>(`/enhance/description/${repoName}`);
    return response.data.data!.description;
  },
};
