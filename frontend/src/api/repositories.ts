// =====================================================
// REPOSITORIES API SERVICE
// =====================================================

import apiClient from './client';
import { ApiResponse, Repository, RepositoryStats, PaginatedResponse } from '../types';

export const repositoriesApi = {
  /**
   * Get all repositories
   */
  async getRepositories(
    page: number = 1,
    perPage: number = 30,
    sort: string = 'updated'
  ): Promise<{ data: Repository[]; pagination: any }> {
    const response = await apiClient.get<PaginatedResponse<Repository>>('/repositories', {
      params: { page, per_page: perPage, sort },
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  /**
   * Get repository statistics
   */
  async getRepositoriesStats(): Promise<RepositoryStats> {
    const response = await apiClient.get<ApiResponse<RepositoryStats>>('/repositories/stats');
    return response.data.data!;
  },

  /**
   * Get single repository
   */
  async getRepository(repoName: string): Promise<Repository & { languages: Record<string, number>; hasReadme: boolean }> {
    const response = await apiClient.get<ApiResponse<Repository & { languages: Record<string, number>; hasReadme: boolean }>>(`/repositories/${repoName}`);
    return response.data.data!;
  },

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(repoName: string): Promise<Record<string, number>> {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>(`/repositories/${repoName}/languages`);
    return response.data.data!;
  },

  /**
   * Get repository README
   */
  async getRepositoryReadme(repoName: string): Promise<{ content: string; length: number }> {
    const response = await apiClient.get<ApiResponse<{ content: string; length: number }>>(`/repositories/${repoName}/readme`);
    return response.data.data!;
  },

  /**
   * Get repository commits
   */
  async getRepositoryCommits(repoName: string, limit: number = 30): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/repositories/${repoName}/commits`, {
      params: { limit },
    });
    return response.data.data!;
  },
};
