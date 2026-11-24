import apiClient, { SLOW_REQUEST_TIMEOUT } from './client';
import {
  ApiResponse,
  AnalysisReport,
  CategoryScores,
  DetailedBreakdown,
  ExtractedSkill,
  Badge,
  Weakness,
  Improvement,
  RepoInsight,
  ProfessionalProfile,
  ProfileComparison,
  ScoreHistory,
} from '../types';

export const analysisApi = {

  async analyzePortfolio(): Promise<AnalysisReport> {
    const response = await apiClient.post<ApiResponse<AnalysisReport>>('/analysis/analyze', null, {
      timeout: SLOW_REQUEST_TIMEOUT,
    });
    return response.data.data!;
  },

  async getLatestAnalysis(): Promise<AnalysisReport | null> {
    try {
      const response = await apiClient.get<ApiResponse<AnalysisReport>>('/analysis/latest');
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getScoreBreakdown(): Promise<{
    overallScore: number;
    categoryScores: CategoryScores;
    detailedBreakdown: DetailedBreakdown;
  }> {
    const response = await apiClient.get<ApiResponse<{
      overallScore: number;
      categoryScores: CategoryScores;
      detailedBreakdown: DetailedBreakdown;
    }>>('/analysis/score');
    return response.data.data!;
  },

  async getSkills(): Promise<ExtractedSkill[]> {
    const response = await apiClient.get<ApiResponse<{ skills: ExtractedSkill[] }>>('/analysis/skills');
    return response.data.data!.skills;
  },

  async getBadges(): Promise<Badge[]> {
    const response = await apiClient.get<ApiResponse<{ badges: Badge[] }>>('/analysis/badges');
    return response.data.data!.badges;
  },

  async getImprovements(): Promise<{
    weaknesses: Weakness[];
    improvements: Improvement[];
  }> {
    const response = await apiClient.get<ApiResponse<{
      weaknesses: Weakness[];
      improvements: Improvement[];
    }>>('/analysis/improvements');
    return response.data.data!;
  },

  async getRepoInsights(): Promise<RepoInsight[]> {
    const response = await apiClient.get<ApiResponse<RepoInsight[]>>('/analysis/insights');
    return response.data.data!;
  },

  async getProfessionalProfile(refresh = false): Promise<ProfessionalProfile> {
    const response = await apiClient.get<ApiResponse<ProfessionalProfile>>('/analysis/professional-profile', {
      timeout: SLOW_REQUEST_TIMEOUT,
      params: refresh ? { refresh: 'true' } : undefined,
    });
    return response.data.data!;
  },

  async compareProfiles(username: string): Promise<ProfileComparison> {
    const response = await apiClient.get<ApiResponse<ProfileComparison>>(
      `/analysis/compare/${encodeURIComponent(username)}`,
      { timeout: SLOW_REQUEST_TIMEOUT }
    );
    return response.data.data!;
  },

  async getHistory(limit = 30): Promise<ScoreHistory> {
    const response = await apiClient.get<ApiResponse<ScoreHistory>>('/analysis/history', { params: { limit } });
    return response.data.data!;
  },

  async exportToPDF(): Promise<Blob> {
    const response = await apiClient.get('/analysis/export/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },
};
