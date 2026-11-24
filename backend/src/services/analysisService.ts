import { Types } from 'mongoose';
import { AnalysisReport, RepoInsight, User } from '../models';
import githubService from './githubService';
import aiService from './aiService';
import { resolveAIForUser } from './userAIService';
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
  ProfessionalProfile,
  ProfileComparison,
  AnalyzedRepository,
} from '../types';
import logger from '../utils/logger';

export interface PortfolioResult {
  overallScore: number;
  categoryScores: CategoryScores;
  detailedBreakdown: DetailedBreakdown;
  skills: ExtractedSkill[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  badges: Badge[];
  repositories: AnalyzedRepository[];
}

type RepoDetail = {
  repo: GitHubRepository;
  languages: Record<string, number>;
  readme: string | null;
  hasContributing: boolean;
  hasTests: boolean;
};

/**
 * Score a GitHub account with the full engine. Used for the signed-in user
 * (with private repos) and for comparison targets (public repos only), so
 * both sides of a comparison are scored the same way.
 */
async function computePortfolio(
  accessToken: string,
  username: string,
  repos: GitHubRepository[]
): Promise<PortfolioResult & { repoDetails: RepoDetail[] }> {
  const [githubUser, hasProfileReadme, socialAccounts] = await Promise.all([
    githubService.getUserByUsername(accessToken, username),
    githubService.hasProfileReadme(accessToken, username),
    githubService.getUserSocialAccounts(accessToken, username),
  ]);

  //Filtering out forked repositories for analysis
  const ownRepos = repos.filter(r => !r.fork);

  //Fetch detailed data for each repository
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
      hasTwitter: !!githubUser.twitter_username,
      blogUrl: githubUser.blog || '',
      socialAccounts: socialAccounts,
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
    githubUser.followers,
    repos,            // all repos including forks for open-source badge
    hasProfileReadme  // for professional profile badge
  );

  const repositories: AnalyzedRepository[] = ownRepos.map(repo => ({
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    topics: repo.topics || [],
    isPrivate: !!repo.private,
    homepage: repo.homepage,
    pushedAt: repo.pushed_at,
  }));

  return {
    overallScore,
    categoryScores,
    detailedBreakdown,
    skills,
    weaknesses,
    improvements,
    badges,
    repositories,
    repoDetails,
  };
}

export async function analyzePortfolio(
  userId: Types.ObjectId,
  username: string,
  accessToken: string
): Promise<PortfolioResult> {
  logger.info(`Starting portfolio analysis for ${username}`);

  const repos = await githubService.getOwnRepositories(accessToken, username);
  const { repoDetails, ...result } = await computePortfolio(accessToken, username, repos);
  const {
    overallScore,
    categoryScores,
    detailedBreakdown,
    skills,
    weaknesses,
    improvements,
    badges,
    repositories,
  } = result;

  // Save a new report each run so users can track progress over time.
  await AnalysisReport.create({
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
  });
  await pruneOldReports(userId);

  // Save repo insights
  await saveRepoInsights(userId, repoDetails);

  logger.info(`Portfolio analysis completed for ${username}. Score: ${overallScore}`);

  return result;
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

function calculateProfileCompleteness(user: any): number {
  let complete = 0;
  const fields = ['bio', 'company', 'location', 'blog', 'email', 'name'];
  
  fields.forEach(field => {
    if (user[field]) complete++;
  });
  
  return (complete / fields.length) * 100;
}

async function saveRepoInsights(
  userId: Types.ObjectId,
  repoDetails: RepoDetail[]
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


export async function getLatestAnalysis(userId: Types.ObjectId): Promise<any | null> {
  return await AnalysisReport.findOne({ userId })
    .sort({ generatedAt: -1 })
    .lean();
}

const MAX_REPORTS_PER_USER = 60;

/** Keep the newest reports only, so history stays bounded. */
async function pruneOldReports(userId: Types.ObjectId): Promise<void> {
  const stale = await AnalysisReport.find({ userId })
    .sort({ generatedAt: -1 })
    .skip(MAX_REPORTS_PER_USER)
    .select('_id')
    .lean();
  if (stale.length > 0) {
    await AnalysisReport.deleteMany({ _id: { $in: stale.map((r) => r._id) } });
  }
}

export interface HistoryPoint {
  id: string;
  overallScore: number;
  categoryScores: CategoryScores;
  badgeCount: number;
  generatedAt: Date;
}

/** Score history, oldest first. */
export async function getAnalysisHistory(
  userId: Types.ObjectId,
  limit = 30
): Promise<HistoryPoint[]> {
  const reports = await AnalysisReport.find({ userId })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .select('overallScore categoryScores badges generatedAt')
    .lean();

  return reports.reverse().map((r: any) => ({
    id: r._id.toString(),
    overallScore: r.overallScore,
    categoryScores: r.categoryScores,
    badgeCount: r.badges?.length ?? 0,
    generatedAt: r.generatedAt,
  }));
}

export async function getRepoInsights(userId: Types.ObjectId): Promise<any[]> {
  return await RepoInsight.find({ userId })
    .sort({ analyzedAt: -1 })
    .lean();
}


export async function generateProfessionalProfile(
  userId: Types.ObjectId,
  username: string,
  accessToken: string
): Promise<ProfessionalProfile> {
  let analysis = await getLatestAnalysis(userId);
  
  if (!analysis) {
    analysis = await analyzePortfolio(userId, username, accessToken);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const repos = await githubService.getOwnRepositories(accessToken, username);
  const topRepos = repos
    .filter(r => !r.fork && !r.private)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  let headline = `${user.displayName} | Software Developer`;
  let summary = `Experienced developer with ${repos.length} public repositories and a portfolio score of ${analysis.overallScore}/100.`;

  {
    try {
      const ai = await resolveAIForUser(user);
      const aiSummary = await aiService.generatePortfolioSummary(
        ai,
        username,
        repos.filter(r => !r.fork && !r.private),
        analysis.skills,
        analysis.overallScore
      );
      headline = aiSummary.headline;
      summary = aiSummary.summary;
    } catch (error: any) {
      // Fall back to the plain headline when AI isn't set up or fails.
      logger.warn(`AI summary unavailable for ${username}: ${error.message}`);
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

  // Score the other developer with the same engine (public repos only).
  const compareRepos = await githubService.getAllUserRepositories(accessToken, compareUsername);
  const compareResult = await computePortfolio(accessToken, compareUsername, compareRepos);
  const compareScores: CategoryScores = compareResult.categoryScores;
  const compareOverall = compareResult.overallScore;

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
      topSkills: compareResult.skills.slice(0, 5).map((sk: ExtractedSkill) => sk.name),
      badges: compareResult.badges.length,
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

export default {
  analyzePortfolio,
  getLatestAnalysis,
  getAnalysisHistory,
  getRepoInsights,
  generateProfessionalProfile,
  compareProfiles,
};
