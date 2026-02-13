// =====================================================
// ANALYSIS SERVICE
// =====================================================

import { Types } from 'mongoose';
import { AnalysisReport, RepoInsight, User } from '../models';
import githubService from './githubService';
import aiService from './aiService';
import scoringEngine, {
  calculateFullScore,
  extractSkills,
  detectWeaknesses,
  generateImprovements,
  calculateBadges,
  FullScoringInput,
} from '../utils/scoringEngine';
import {
  GitHubRepository,
  ExtractedSkill,
  Weakness,
  Badge,
  Improvement,
  CategoryScores,
  DetailedBreakdown,
  RecruiterProfile,
  ProfileComparison,
  AnalyzedRepository,
} from '../types';
import logger from '../utils/logger';

/**
 * Perform full portfolio analysis
 */
export async function analyzePortfolio(
  userId: Types.ObjectId,
  username: string,
  accessToken: string
): Promise<{
  overallScore: number;
  categoryScores: CategoryScores;
  detailedBreakdown: DetailedBreakdown;
  skills: ExtractedSkill[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  badges: Badge[];
  repositories: AnalyzedRepository[];
}> {
  logger.info(`Starting portfolio analysis for ${username}`);

  // Fetch all necessary data from GitHub
  const [repos, githubUser, hasProfileReadme] = await Promise.all([
    githubService.getAllUserRepositories(accessToken, username),
    githubService.getUserByUsername(accessToken, username),
    githubService.hasProfileReadme(accessToken, username),
  ]);

  // Filter out forked repositories for analysis
  const ownRepos = repos.filter(r => !r.fork);

  // Fetch detailed data for each repository
  const repoDetails = await Promise.all(
    ownRepos.slice(0, 30).map(async (repo) => {
      const [languages, readme, hasContributing, hasTests] = await Promise.all([
        githubService.getRepositoryLanguages(accessToken, username, repo.name),
        githubService.getReadmeContent(accessToken, username, repo.name),
        githubService.checkFileExists(accessToken, username, repo.name, 'CONTRIBUTING.md'),
        checkForTests(accessToken, username, repo.name),
      ]);

      return {
        repo,
        languages,
        readme,
        hasContributing,
        hasTests,
      };
    })
  );

  // Prepare scoring input
  const scoringInput: FullScoringInput = {
    codeQuality: {
      repos: ownRepos,
      languages: repoDetails.map(d => d.languages),
      hasTests: repoDetails.map(d => d.hasTests),
      hasLinting: repoDetails.map(() => false), // Would need deeper analysis
      avgCommitSize: repoDetails.map(() => 100), // Default value
    },
    documentation: {
      repos: ownRepos,
      hasReadme: repoDetails.map(d => !!d.readme),
      readmeLength: repoDetails.map(d => d.readme?.length || 0),
      hasLicense: ownRepos.map(r => !!r.license),
      hasContributing: repoDetails.map(d => d.hasContributing),
      hasCodeOfConduct: repoDetails.map(() => false),
    },
    activity: {
      repos: ownRepos,
      commitDates: repoDetails.map(() => [new Date()]), // Simplified
      lastPushDates: ownRepos.map(r => new Date(r.pushed_at)),
      accountAge: Math.floor(
        (Date.now() - new Date(githubUser.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    },
    diversity: {
      repos: ownRepos,
      languages: repoDetails.map(d => d.languages),
      topics: ownRepos.map(r => r.topics),
    },
    community: {
      repos: ownRepos,
      followers: githubUser.followers,
      following: githubUser.following,
      totalStars: ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0),
      totalForks: ownRepos.reduce((sum, r) => sum + r.forks_count, 0),
    },
    professionalism: {
      hasProfileReadme,
      hasBio: !!githubUser.bio,
      hasCompany: !!githubUser.company,
      hasLocation: !!githubUser.location,
      hasWebsite: !!githubUser.blog,
      hasEmail: !!githubUser.email,
      profileComplete: calculateProfileCompleteness(githubUser),
      repos: ownRepos,
    },
  };

  // Calculate scores
  const { overallScore, categoryScores, detailedBreakdown } = calculateFullScore(scoringInput);

  // Extract skills
  const skills = extractSkills(
    repoDetails.map(d => d.languages),
    ownRepos
  );

  // Detect weaknesses
  const weaknesses = detectWeaknesses(categoryScores, detailedBreakdown);

  // Generate improvements
  const improvements = generateImprovements(categoryScores, detailedBreakdown);

  // Calculate badges
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const badges = calculateBadges(
    categoryScores,
    ownRepos,
    skills,
    totalStars,
    githubUser.followers
  );

  // Transform repositories for storage
  const repositories = ownRepos.map(repo => ({
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    topics: repo.topics || [],
  }));

  // Save analysis report
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await AnalysisReport.findOneAndUpdate(
    { userId },
    {
      userId,
      overallScore,
      categoryScores,
      detailedBreakdown,
      skills,
      weaknesses,
      improvements,
      badges,
      repositories,
      generatedAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true }
  );

  // Save repo insights
  await saveRepoInsights(userId, repoDetails);

  logger.info(`Portfolio analysis completed for ${username}. Score: ${overallScore}`);

  return {
    overallScore,
    categoryScores,
    detailedBreakdown,
    skills,
    weaknesses,
    improvements,
    badges,
    repositories,
  };
}

/**
 * Check if repository has tests
 */
async function checkForTests(
  accessToken: string,
  owner: string,
  repo: string
): Promise<boolean> {
  const testPaths = ['test', 'tests', '__tests__', 'spec', 'specs'];
  
  for (const path of testPaths) {
    const exists = await githubService.checkFileExists(accessToken, owner, repo, path);
    if (exists) return true;
  }
  
  return false;
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(user: any): number {
  let complete = 0;
  const fields = ['bio', 'company', 'location', 'blog', 'email', 'name'];
  
  fields.forEach(field => {
    if (user[field]) complete++;
  });
  
  return (complete / fields.length) * 100;
}

/**
 * Save repository insights to database
 */
async function saveRepoInsights(
  userId: Types.ObjectId,
  repoDetails: Array<{
    repo: GitHubRepository;
    languages: Record<string, number>;
    readme: string | null;
    hasContributing: boolean;
    hasTests: boolean;
  }>
): Promise<void> {
  const operations = repoDetails.map(({ repo, languages, readme, hasContributing, hasTests }) => ({
    updateOne: {
      filter: { userId, repoId: repo.id },
      update: {
        $set: {
          userId,
          repoId: repo.id,
          repoName: repo.name,
          repoFullName: repo.full_name,
          languages,
          hasReadme: !!readme,
          readmeQuality: readme ? Math.min(100, readme.length / 10) : 0,
          hasLicense: !!repo.license,
          hasContributing,
          hasTests,
          lastCommitDate: new Date(repo.pushed_at),
          analyzedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await RepoInsight.bulkWrite(operations);
  }
}

/**
 * Get latest analysis report for user
 */
export async function getLatestAnalysis(userId: Types.ObjectId): Promise<any | null> {
  return await AnalysisReport.findOne({ userId })
    .sort({ generatedAt: -1 })
    .lean();
}

/**
 * Get repository insights for user
 */
export async function getRepoInsights(userId: Types.ObjectId): Promise<any[]> {
  return await RepoInsight.find({ userId })
    .sort({ analyzedAt: -1 })
    .lean();
}

/**
 * Generate recruiter profile
 */
export async function generateRecruiterProfile(
  userId: Types.ObjectId,
  username: string,
  accessToken: string
): Promise<RecruiterProfile> {
  // Get or create analysis
  let analysis = await getLatestAnalysis(userId);
  
  if (!analysis) {
    analysis = await analyzePortfolio(userId, username, accessToken);
  }

  // Get user info
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Get top repos
  const repos = await githubService.getAllUserRepositories(accessToken, username);
  const topRepos = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  // Generate AI summary if available
  let headline = `${user.displayName} | Software Developer`;
  let summary = `Experienced developer with ${repos.length} public repositories and a portfolio score of ${analysis.overallScore}/100.`;

  if (aiService.isAiAvailable()) {
    try {
      const aiSummary = await aiService.generatePortfolioSummary(
        username,
        repos,
        analysis.skills,
        analysis.overallScore
      );
      headline = aiSummary.headline;
      summary = aiSummary.summary;
    } catch (error) {
      logger.error('Failed to generate AI summary:', error);
    }
  }

  return {
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    headline,
    summary,
    overallScore: analysis.overallScore,
    topSkills: analysis.skills.slice(0, 10),
    topProjects: topRepos.map(r => ({
      name: r.name,
      description: r.description || 'No description',
      technologies: r.topics.slice(0, 5),
      stars: r.stargazers_count,
      url: r.html_url,
      highlights: [],
    })),
    badges: analysis.badges,
    strengths: analysis.improvements
      .filter((imp: Improvement) => imp.priority > 3)
      .map((imp: Improvement) => imp.title)
      .slice(0, 5),
    contact: {
      email: user.email,
      github: user.profileUrl,
      website: user.blog,
    },
  };
}

/**
 * Compare two profiles
 */
export async function compareProfiles(
  userId: Types.ObjectId,
  username: string,
  compareUsername: string,
  accessToken: string
): Promise<ProfileComparison> {
  // Get analysis for current user
  let userAnalysis = await getLatestAnalysis(userId);
  if (!userAnalysis) {
    userAnalysis = await analyzePortfolio(userId, username, accessToken);
  }

  // Analyze compare user (limited)
  const compareUser = await githubService.getUserByUsername(accessToken, compareUsername);
  const compareRepos = await githubService.getAllUserRepositories(accessToken, compareUsername);
  
  // Calculate basic scores for compare user
  const ownRepos = compareRepos.filter(r => !r.fork);
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  
  // Simplified scoring for comparison
  const compareScores: CategoryScores = {
    codeQuality: Math.min(100, ownRepos.length * 5),
    documentation: Math.min(100, ownRepos.filter(r => r.description).length * 10),
    activity: calculateActivityScore(ownRepos),
    diversity: calculateDiversityScore(ownRepos),
    community: calculateCommunityScore(compareUser.followers, totalStars),
    professionalism: calculateProfessionalismScore(compareUser),
  };

  const compareOverall = Math.round(
    compareScores.codeQuality * 0.25 +
    compareScores.documentation * 0.20 +
    compareScores.activity * 0.20 +
    compareScores.diversity * 0.15 +
    compareScores.community * 0.10 +
    compareScores.professionalism * 0.10
  );

  // Determine winners
  const breakdown = {
    codeQuality: {
      winner: userAnalysis.categoryScores.codeQuality >= compareScores.codeQuality ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.codeQuality - compareScores.codeQuality),
    },
    documentation: {
      winner: userAnalysis.categoryScores.documentation >= compareScores.documentation ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.documentation - compareScores.documentation),
    },
    activity: {
      winner: userAnalysis.categoryScores.activity >= compareScores.activity ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.activity - compareScores.activity),
    },
    diversity: {
      winner: userAnalysis.categoryScores.diversity >= compareScores.diversity ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.diversity - compareScores.diversity),
    },
    community: {
      winner: userAnalysis.categoryScores.community >= compareScores.community ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.community - compareScores.community),
    },
    professionalism: {
      winner: userAnalysis.categoryScores.professionalism >= compareScores.professionalism ? username : compareUsername,
      difference: Math.abs(userAnalysis.categoryScores.professionalism - compareScores.professionalism),
    },
  };

  // Build category arrays for frontend (all scores are 0-100)
  const yourCategories = [
    { category: 'Code Quality', score: userAnalysis.categoryScores.codeQuality, maxScore: 100 },
    { category: 'Documentation', score: userAnalysis.categoryScores.documentation, maxScore: 100 },
    { category: 'Activity', score: userAnalysis.categoryScores.activity, maxScore: 100 },
    { category: 'Diversity', score: userAnalysis.categoryScores.diversity, maxScore: 100 },
    { category: 'Community', score: userAnalysis.categoryScores.community, maxScore: 100 },
    { category: 'Professionalism', score: userAnalysis.categoryScores.professionalism, maxScore: 100 },
  ];

  const theirCategories = [
    { category: 'Code Quality', score: compareScores.codeQuality, maxScore: 100 },
    { category: 'Documentation', score: compareScores.documentation, maxScore: 100 },
    { category: 'Activity', score: compareScores.activity, maxScore: 100 },
    { category: 'Diversity', score: compareScores.diversity, maxScore: 100 },
    { category: 'Community', score: compareScores.community, maxScore: 100 },
    { category: 'Professionalism', score: compareScores.professionalism, maxScore: 100 },
  ];

  return {
    user1: {
      username,
      overallScore: userAnalysis.overallScore,
      categoryScores: userAnalysis.categoryScores,
      topSkills: userAnalysis.skills.slice(0, 5).map((s: ExtractedSkill) => s.name),
      badges: userAnalysis.badges.length,
    },
    user2: {
      username: compareUsername,
      overallScore: compareOverall,
      categoryScores: compareScores,
      topSkills: [],
      badges: 0,
    },
    yourScore: {
      overall: userAnalysis.overallScore,
      categories: yourCategories,
    },
    theirScore: {
      overall: compareOverall,
      categories: theirCategories,
    },
    winner: userAnalysis.overallScore >= compareOverall ? username : compareUsername,
    breakdown,
    insights: [
      userAnalysis.overallScore > compareOverall
        ? `You have a ${userAnalysis.overallScore - compareOverall} point lead overall`
        : `${compareUsername} leads by ${compareOverall - userAnalysis.overallScore} points`,
    ],
  };
}

// Helper functions for comparison
function calculateActivityScore(repos: GitHubRepository[]): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentRepos = repos.filter(r => new Date(r.pushed_at) > thirtyDaysAgo);
  return Math.min(100, recentRepos.length * 20);
}

function calculateDiversityScore(repos: GitHubRepository[]): number {
  const languages = new Set<string>();
  repos.forEach(r => {
    if (r.language) languages.add(r.language);
  });
  return Math.min(100, languages.size * 10);
}

function calculateCommunityScore(followers: number, stars: number): number {
  return Math.min(100, Math.sqrt(followers) * 5 + Math.sqrt(stars) * 3);
}

function calculateProfessionalismScore(user: any): number {
  let score = 0;
  if (user.bio) score += 20;
  if (user.company) score += 20;
  if (user.location) score += 20;
  if (user.blog) score += 20;
  if (user.email) score += 20;
  return score;
}

export default {
  analyzePortfolio,
  getLatestAnalysis,
  getRepoInsights,
  generateRecruiterProfile,
  compareProfiles,
};
