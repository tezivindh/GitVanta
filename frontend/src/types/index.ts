// =====================================================
// FRONTEND TYPE DEFINITIONS
// =====================================================

// User types
export interface User {
  _id: string;
  githubId: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

// Analysis types
export interface CategoryScores {
  codeQuality: number;
  documentation: number;
  activity: number;
  diversity: number;
  community: number;
  professionalism: number;
}

// Category score for charts (array format)
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface BreakdownItem {
  metric: string;
  score: number;
  maxScore: number;
  description: string;
  suggestion?: string;
}

export interface DetailedBreakdown {
  codeQuality: BreakdownItem[];
  documentation: BreakdownItem[];
  activity: BreakdownItem[];
  diversity: BreakdownItem[];
  community: BreakdownItem[];
  professionalism: BreakdownItem[];
}

export interface ExtractedSkill {
  name: string;
  category: 'language' | 'framework' | 'tool' | 'database' | 'cloud' | 'other';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  projectCount: number;
  totalLines?: number;
}

export interface Weakness {
  category: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface Improvement {
  priority: number;
  title: string;
  description: string;
  estimatedImpact: string;
  actionItems: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: string;
}

export interface AnalyzedRepository {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
}

export interface AnalysisReport {
  _id: string;
  userId: string;
  overallScore: number;
  categoryScores: CategoryScores;
  detailedBreakdown: DetailedBreakdown;
  skills: ExtractedSkill[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  badges: Badge[];
  repositories: AnalyzedRepository[];
  generatedAt: string;
  expiresAt: string;
}

// Repository types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  topics: string[];
  license: {
    key: string;
    name: string;
  } | null;
}

export interface RepoInsight {
  _id: string;
  userId: string;
  repoId: number;
  repoName: string;
  repoFullName: string;
  languages: Record<string, number>;
  hasReadme: boolean;
  readmeQuality: number;
  hasLicense: boolean;
  hasContributing: boolean;
  hasTests: boolean;
  commitFrequency: number;
  lastCommitDate: string;
  documentationScore: number;
  analyzedAt: string;
}

// Enhancement types
export interface ReadmeEnhancement {
  originalContent: string;
  enhancedContent: string;
  suggestions: string[];
  addedSections: string[];
}

export interface ResumeBullet {
  repoName: string;
  bullets: string[];
  skills: string[];
  impact: string;
}

export interface PortfolioSummary {
  headline: string;
  summary: string;
  highlights: string[];
  technicalSkills: string[];
  softSkills: string[];
}

export interface RoadmapItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  resources: string[];
}

export interface ImprovementRoadmap {
  shortTerm: RoadmapItem[];
  mediumTerm: RoadmapItem[];
  longTerm: RoadmapItem[];
}

// Comparison types
export interface ComparisonProfile {
  username: string;
  overallScore: number;
  categoryScores: CategoryScores;
  topSkills: string[];
  badges: number;
}

export interface ComparisonBreakdown {
  codeQuality: { winner: string; difference: number };
  documentation: { winner: string; difference: number };
  activity: { winner: string; difference: number };
  diversity: { winner: string; difference: number };
  community: { winner: string; difference: number };
  professionalism: { winner: string; difference: number };
}

export interface ProfileComparisonScore {
  overall: number;
  categories: CategoryScore[];
}

export interface ProfileComparison {
  user1: ComparisonProfile;
  user2: ComparisonProfile;
  yourScore: ProfileComparisonScore;
  theirScore: ProfileComparisonScore;
  winner: string;
  breakdown: ComparisonBreakdown;
  insights?: string[];
}

// Recruiter types
export interface RecruiterProject {
  name: string;
  description: string;
  technologies: string[];
  stars: number;
  url: string;
  highlights: string[];
}

export interface RecruiterProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  headline: string;
  summary: string;
  overallScore: number;
  topSkills: ExtractedSkill[];
  topProjects: RecruiterProject[];
  badges: Badge[];
  strengths: string[];
  highlights?: string[];
  contact: {
    email: string;
    github: string;
    website: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Repository stats
export interface RepositoryStats {
  totalRepositories: number;
  totalStars: number;
  totalForks: number;
  uniqueLanguages: number;
  languageDistribution: Record<string, number>;
  recentlyUpdated: number;
  topStarred: Array<{ name: string; stars: number }>;
}
