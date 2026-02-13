// =====================================================
// GITHUB PORTFOLIO ANALYZER - TYPE DEFINITIONS
// =====================================================

import { Request } from 'express';
import { Document, Types } from 'mongoose';

// =====================================================
// USER TYPES
// =====================================================

export interface IUser extends Document {
  _id: Types.ObjectId;
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
  accessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

// =====================================================
// GITHUB API TYPES
// =====================================================

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  languages_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  default_branch: string;
  topics: string[];
  has_wiki: boolean;
  has_issues: boolean;
  fork: boolean;
  archived: boolean;
  license: {
    key: string;
    name: string;
  } | null;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  twitter_username: string | null;
  hireable: boolean | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubSocialAccount {
  provider: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
}

export interface GitHubContribution {
  total: number;
  weeks: Array<{
    w: number;
    a: number;
    d: number;
    c: number;
  }>;
}

// =====================================================
// ANALYSIS TYPES
// =====================================================

export interface AnalyzedRepository {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
}

export interface AnalysisReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  overallScore: number;
  categoryScores: CategoryScores;
  detailedBreakdown: DetailedBreakdown;
  skills: ExtractedSkill[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  badges: Badge[];
  repositories: AnalyzedRepository[];
  generatedAt: Date;
  expiresAt: Date;
}

export interface CategoryScores {
  codeQuality: number;
  documentation: number;
  activity: number;
  diversity: number;
  community: number;
  professionalism: number;
}

export interface DetailedBreakdown {
  codeQuality: BreakdownItem[];
  documentation: BreakdownItem[];
  activity: BreakdownItem[];
  diversity: BreakdownItem[];
  community: BreakdownItem[];
  professionalism: BreakdownItem[];
}

export interface BreakdownItem {
  metric: string;
  score: number;
  maxScore: number;
  description: string;
  suggestion?: string;
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
  earnedAt: Date;
  category: string;
}

// =====================================================
// REPO INSIGHT TYPES
// =====================================================

export interface RepoInsight extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
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
  lastCommitDate: Date;
  issueResponseTime: number;
  codeComplexity: number;
  documentationScore: number;
  analyzedAt: Date;
}

// =====================================================
// AI ENHANCEMENT TYPES
// =====================================================

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

export interface ImprovementRoadmap {
  shortTerm: RoadmapItem[];
  mediumTerm: RoadmapItem[];
  longTerm: RoadmapItem[];
}

export interface RoadmapItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  resources: string[];
}

// =====================================================
// COMPARISON TYPES
// =====================================================

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
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

// =====================================================
// RECRUITER MODE TYPES
// =====================================================

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
  contact: {
    email: string;
    github: string;
    website: string;
  };
}

export interface RecruiterProject {
  name: string;
  description: string;
  technologies: string[];
  stars: number;
  url: string;
  highlights: string[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

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
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// JWT TYPES
// =====================================================

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// =====================================================
// CACHE TYPES
// =====================================================

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
