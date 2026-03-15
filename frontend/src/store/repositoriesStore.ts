import { create } from 'zustand';
import { Repository, RepositoryStats } from '../types';
import { repositoriesApi } from '../api';

interface RepositoriesState {
  // Data
  repositories: Repository[];
  stats: RepositoryStats | null;
  selectedRepo: (Repository & { languages: Record<string, number>; hasReadme: boolean }) | null;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingRepo: boolean;

  // Error
  error: string | null;

  // Actions
  fetchRepositories: (page?: number, perPage?: number, sort?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRepository: (repoName: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useRepositoriesStore = create<RepositoriesState>((set) => ({
  // Initial state
  repositories: [],
  stats: null,
  selectedRepo: null,
  pagination: null,

  isLoading: false,
  isLoadingStats: false,
  isLoadingRepo: false,

  error: null,

  fetchRepositories: async (page = 1, perPage = 30, sort = 'updated') => {
    set({ isLoading: true, error: null });
    try {
      const result = await repositoriesApi.getRepositories(page, perPage, sort);
      set({
        repositories: result.data,
        pagination: result.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch repositories',
        isLoading: false,
      });
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const stats = await repositoriesApi.getRepositoriesStats();
      set({ stats, isLoadingStats: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch stats',
        isLoadingStats: false,
      });
    }
  },

  fetchRepository: async (repoName: string) => {
    set({ isLoadingRepo: true, error: null });
    try {
      const repo = await repositoriesApi.getRepository(repoName);
      set({ selectedRepo: repo, isLoadingRepo: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch repository',
        isLoadingRepo: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    repositories: [],
    stats: null,
    selectedRepo: null,
    pagination: null,
    error: null,
  }),
}));
