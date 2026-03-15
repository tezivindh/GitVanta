import { create } from 'zustand';
import {
  AnalysisReport,
  ExtractedSkill,
  Badge,
  Weakness,
  Improvement,
  RepoInsight,
  ProfessionalProfile,
  ProfileComparison,
  CategoryScore,
} from '../types';
import { analysisApi } from '../api';

export interface CurrentReport {
  _id: string;
  userId: string;
  createdAt: string;
  result: {
    score: {
      overall: number;
      categories: CategoryScore[];
    };
    repositories: Array<{
      name: string;
      description?: string;
      url: string;
      language?: string;
      stars?: number;
      forks?: number;
      topics?: string[];
      score?: number;
      updatedAt?: string;
    }>;
    skills: string[];
    badges?: string[];
    weaknesses?: string[];
  };
}

// Helper function to transform AnalysisReport to CurrentReport
function transformToCurrentReport(analysis: AnalysisReport): CurrentReport {
  // Convert categoryScores object to array format
  // Backend calculates each category as 0-100, so maxScore is always 100
  const categoryScoresArray: CategoryScore[] = [
    { category: 'Code Quality', score: analysis.categoryScores.codeQuality, maxScore: 100 },
    { category: 'Documentation', score: analysis.categoryScores.documentation, maxScore: 100 },
    { category: 'Activity', score: analysis.categoryScores.activity, maxScore: 100 },
    { category: 'Diversity', score: analysis.categoryScores.diversity, maxScore: 100 },
    { category: 'Community', score: analysis.categoryScores.community, maxScore: 100 },
    { category: 'Professionalism', score: analysis.categoryScores.professionalism, maxScore: 100 },
  ];

  // Transform repositories from AnalyzedRepository to CurrentReport format
  const repositories = (analysis.repositories || []).map(repo => ({
    name: repo.name,
    url: repo.url,
    description: repo.description || undefined,
    language: repo.language || undefined,
    stars: repo.stars,
    forks: repo.forks,
  }));

  return {
    _id: analysis._id,
    userId: analysis.userId,
    createdAt: analysis.generatedAt,
    result: {
      score: {
        overall: analysis.overallScore,
        categories: categoryScoresArray,
      },
      repositories,
      skills: analysis.skills.map(s => s.name),
      badges: analysis.badges.map(b => b.id),
      weaknesses: analysis.weaknesses.map(w => w.issue),
    },
  };
}

export interface AnalysisState {
  // Data
  analysis: AnalysisReport | null;
  currentReport: CurrentReport | null;
  skills: ExtractedSkill[];
  badges: Badge[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  repoInsights: RepoInsight[];
  professionalProfile: ProfessionalProfile | null;
  comparison: ProfileComparison | null;

  // Loading states
  isAnalyzing: boolean;
  isLoadingAnalysis: boolean;
  isLoadingSkills: boolean;
  isLoadingBadges: boolean;
  isLoadingImprovements: boolean;
  isLoadingInsights: boolean;
  isLoadingProfessionalProfile: boolean;
  isComparing: boolean;
  isExporting: boolean;

  // Error
  error: string | null;

  // Actions
  runAnalysis: (username?: string) => Promise<void>;
  fetchLatestAnalysis: () => Promise<void>;
  fetchLatestReport: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchImprovements: () => Promise<void>;
  fetchRepoInsights: () => Promise<void>;
  fetchProfessionalProfile: () => Promise<void>;
  compareWithUser: (username: string) => Promise<void>;
  exportPDF: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // Initial state
  analysis: null,
  currentReport: null,
  skills: [],
  badges: [],
  weaknesses: [],
  improvements: [],
  repoInsights: [],
  professionalProfile: null,
  comparison: null,

  isAnalyzing: false,
  isLoadingAnalysis: false,
  isLoadingSkills: false,
  isLoadingBadges: false,
  isLoadingImprovements: false,
  isLoadingInsights: false,
  isLoadingProfessionalProfile: false,
  isComparing: false,
  isExporting: false,

  error: null,

  runAnalysis: async (_username?: string) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await analysisApi.analyzePortfolio();
      set({
        currentReport: transformToCurrentReport(response),
        analysis: response,
        skills: response.skills,
        badges: response.badges,
        weaknesses: response.weaknesses,
        improvements: response.improvements,
        isAnalyzing: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to run analysis',
        isAnalyzing: false,
      });
    }
  },

  fetchLatestAnalysis: async () => {
    set({ isLoadingAnalysis: true, error: null });
    try {
      const analysis = await analysisApi.getLatestAnalysis();
      if (analysis) {
        set({
          analysis,
          currentReport: transformToCurrentReport(analysis),
          skills: analysis.skills,
          badges: analysis.badges,
          weaknesses: analysis.weaknesses,
          improvements: analysis.improvements,
          isLoadingAnalysis: false,
        });
      } else {
        set({ analysis: null, currentReport: null, isLoadingAnalysis: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch analysis',
        isLoadingAnalysis: false,
      });
    }
  },

  fetchLatestReport: async () => {
    set({ isLoadingAnalysis: true, error: null });
    try {
      const analysis = await analysisApi.getLatestAnalysis();
      if (analysis) {
        set({
          analysis,
          currentReport: transformToCurrentReport(analysis),
          skills: analysis.skills,
          badges: analysis.badges,
          weaknesses: analysis.weaknesses,
          improvements: analysis.improvements,
          isLoadingAnalysis: false,
        });
      } else {
        set({ analysis: null, currentReport: null, isLoadingAnalysis: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch analysis',
        isLoadingAnalysis: false,
      });
    }
  },

  fetchSkills: async () => {
    set({ isLoadingSkills: true, error: null });
    try {
      const skills = await analysisApi.getSkills();
      set({ skills, isLoadingSkills: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch skills',
        isLoadingSkills: false,
      });
    }
  },

  fetchBadges: async () => {
    set({ isLoadingBadges: true, error: null });
    try {
      const badges = await analysisApi.getBadges();
      set({ badges, isLoadingBadges: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch badges',
        isLoadingBadges: false,
      });
    }
  },

  fetchImprovements: async () => {
    set({ isLoadingImprovements: true, error: null });
    try {
      const { weaknesses, improvements } = await analysisApi.getImprovements();
      set({ weaknesses, improvements, isLoadingImprovements: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch improvements',
        isLoadingImprovements: false,
      });
    }
  },

  fetchRepoInsights: async () => {
    set({ isLoadingInsights: true, error: null });
    try {
      const repoInsights = await analysisApi.getRepoInsights();
      set({ repoInsights, isLoadingInsights: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch insights',
        isLoadingInsights: false,
      });
    }
  },

  fetchProfessionalProfile: async () => {
    set({ isLoadingProfessionalProfile: true, error: null });
    try {
      const professionalProfile = await analysisApi.getProfessionalProfile();
      set({ professionalProfile, isLoadingProfessionalProfile: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch professional profile',
        isLoadingProfessionalProfile: false,
      });
    }
  },

  compareWithUser: async (username: string) => {
    set({ isComparing: true, error: null, comparison: null });
    try {
      const comparison = await analysisApi.compareProfiles(username);
      set({ comparison, isComparing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to compare profiles',
        isComparing: false,
      });
    }
  },

  exportPDF: async () => {
    set({ isExporting: true, error: null });
    try {
      const blob = await analysisApi.exportToPDF();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      set({ isExporting: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to export PDF',
        isExporting: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    analysis: null,
    skills: [],
    badges: [],
    weaknesses: [],
    improvements: [],
    repoInsights: [],
    professionalProfile: null,
    comparison: null,
    error: null,
  }),
}));
