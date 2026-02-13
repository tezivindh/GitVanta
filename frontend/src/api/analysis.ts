// =====================================================
// ANALYSIS API SERVICE
// =====================================================

import apiClient from './client';
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
  RecruiterProfile,
  ProfileComparison,
} from '../types';

export const analysisApi = {
  /**
   * Run portfolio analysis
   */
  async analyzePortfolio(): Promise<AnalysisReport> {
    const response = await apiClient.post<ApiResponse<AnalysisReport>>('/analysis/analyze');
    return response.data.data!;
  },

  /**
   * Get latest analysis
   */
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

  /**
   * Get score breakdown
   */
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

  /**
   * Get skills
   */
  async getSkills(): Promise<ExtractedSkill[]> {
    const response = await apiClient.get<ApiResponse<{ skills: ExtractedSkill[] }>>('/analysis/skills');
    return response.data.data!.skills;
  },

  /**
   * Get badges
   */
  async getBadges(): Promise<Badge[]> {
    const response = await apiClient.get<ApiResponse<{ badges: Badge[] }>>('/analysis/badges');
    return response.data.data!.badges;
  },

  /**
   * Get improvements
   */
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

  /**
   * Get repository insights
   */
  async getRepoInsights(): Promise<RepoInsight[]> {
    const response = await apiClient.get<ApiResponse<RepoInsight[]>>('/analysis/insights');
    return response.data.data!;
  },

  /**
   * Get recruiter profile
   */
  async getRecruiterProfile(): Promise<RecruiterProfile> {
    const response = await apiClient.get<ApiResponse<RecruiterProfile>>('/analysis/recruiter');
    return response.data.data!;
  },

  /**
   * Compare with another profile
   */
  async compareProfiles(username: string): Promise<ProfileComparison> {
    const response = await apiClient.get<ApiResponse<ProfileComparison>>(`/analysis/compare/${username}`);
    return response.data.data!;
  },

  /**
   * Export to PDF
   */
  async exportToPDF(): Promise<Blob> {
    const response = await apiClient.get('/analysis/export/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },
};
