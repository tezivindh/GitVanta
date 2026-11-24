import { Types } from 'mongoose';
import { AnalysisReport, RepoInsight, User } from '../models';
import githubService from './githubService';
import aiService from './aiService';
import { resolveAIForUser } from './userAIService';
import { visibleRepos } from './showcaseService';
import { describeAI, AIMeta } from '../ai';
import config from '../config';
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
import { computeQuickWins, QuickWinsResult } from '../utils/quickWins';

export interface PortfolioResult {
  quickWins: QuickWinsResult;
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

  const commitSample = await sampleRecentCommits(accessToken, username, ownRepos);

  const scoringInput: FullScoringInput = {
    codeQuality: {
      repos: ownRepos,
      languages: repoDetails.map(d => d.languages),
      hasTests: repoDetails.map(d => d.hasTests),
      hasLinting: repoDetails.map(() => false),
      commitMessages: commitSample.messages,
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
      commitDates: commitSample.dates,
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

  // Concrete per-repo fixes, with the real score gain from re-running the engine.
  const quickWins = computeQuickWins(
    scoringInput,
    repoDetails.map((d) => ({
      name: d.repo.name,
      isPrivate: !!d.repo.private,
      hasReadme: !!d.readme,
      readmeLength: d.readme?.length || 0,
      hasLicense: !!d.repo.license,
      hasTests: d.hasTests,
      hasContributing: d.hasContributing,
      topicCount: d.repo.topics?.length || 0,
    }))
  );

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
    quickWins,
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
    quickWins,
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
    quickWins,
    generatedAt: new Date(),
  });
  await pruneOldReports(userId);

  // Save repo insights
  await saveRepoInsights(userId, repoDetails);

  logger.info(`Portfolio analysis completed for ${username}. Score: ${overallScore}`);

  return result;
}

const COMMIT_SAMPLE_REPOS = 10;

/**
 * The user's own commits from their most recently pushed repos, within the
 * last year: real dates for consistency and messages for message quality.
 */
async function sampleRecentCommits(
  accessToken: string,
  username: string,
  repos: GitHubRepository[]
): Promise<{ dates: Date[][]; messages: string[] }> {
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const recent = [...repos]
    .filter((r) => new Date(r.pushed_at).getTime() > oneYearAgo)
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, COMMIT_SAMPLE_REPOS);

  const perRepo = await Promise.all(
    recent.map((r) => githubService.getRepositoryCommits(accessToken, username, r.name, 100))
  );

  const me = username.toLowerCase();
  const dates: Date[][] = [];
  const messages: string[] = [];
  for (const commits of perRepo) {
    const mine = commits.filter(
      (c) => c.author?.login?.toLowerCase() === me && new Date(c.commit.author.date).getTime() > oneYearAgo
    );
    dates.push(mine.map((c) => new Date(c.commit.author.date)));
    messages.push(...mine.map((c) => c.commit.message.split('\n')[0]));
  }
  return { dates, messages };
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


const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  codeQuality: 'Code quality',
  documentation: 'Documentation',
  activity: 'Consistent activity',
  diversity: 'Technical breadth',
  community: 'Community impact',
  professionalism: 'Professional presence',
};

export async function generateProfessionalProfile(
  userId: Types.ObjectId,
  username: string,
  accessToken: string,
  options: { refreshSummary?: boolean } = {}
): Promise<ProfessionalProfile> {
  let analysis: any = await getLatestAnalysis(userId);
  if (!analysis) {
    await analyzePortfolio(userId, username, accessToken);
    analysis = await getLatestAnalysis(userId);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Same visibility rules as the public page.
  const projects = visibleRepos(analysis.repositories, user)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  let headline = `${user.displayName} | Software Developer`;
  let summary = `Developer with ${analysis.repositories?.length ?? 0} projects and a GitVanta score of ${analysis.overallScore}/100.`;
  let highlights: string[] = [];
  let ai: AIMeta | null = null;
  let summaryGeneratedAt: Date | null = null;

  const cached = analysis.aiSummary;
  if (cached && !options.refreshSummary) {
    ({ headline, summary } = cached);
    highlights = cached.highlights ?? [];
    ai = cached.ai ?? null;
    summaryGeneratedAt = cached.generatedAt ?? null;
  } else {
    try {
      const resolved = await resolveAIForUser(user);
      // Only what visitors may see goes into the prompt.
      const promptRepos = visibleRepos(analysis.repositories, user).map((r) => ({
        name: r.name,
        description: r.description,
        stargazers_count: r.stars,
      })) as unknown as GitHubRepository[];
      const result = await aiService.generatePortfolioSummary(
        resolved,
        username,
        promptRepos,
        analysis.skills,
        analysis.overallScore
      );
      headline = result.headline;
      summary = result.summary;
      highlights = result.highlights ?? [];
      ai = describeAI(resolved);
      summaryGeneratedAt = new Date();
      await AnalysisReport.updateOne(
        { _id: analysis._id },
        { $set: { aiSummary: { headline, summary, highlights, ai, generatedAt: summaryGeneratedAt } } }
      );
    } catch (error: any) {
      // Plain fallback when AI isn't set up or fails. Only surface the error
      // when the user explicitly asked for a refresh.
      if (options.refreshSummary) throw error;
      logger.warn(`AI summary unavailable for ${username}: ${error.message}`);
    }
  }

  const strengths = (Object.keys(CATEGORY_LABELS) as Array<keyof CategoryScores>)
    .map((k) => ({ k, score: analysis.categoryScores[k] as number }))
    .filter((c) => c.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => `${CATEGORY_LABELS[c.k]} (${c.score}/100)`);

  return {
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    headline,
    summary,
    highlights,
    overallScore: analysis.overallScore,
    topSkills: analysis.skills.slice(0, 10),
    topProjects: projects.map((r) => ({
      name: r.name,
      description: r.description || '',
      technologies: r.topics.slice(0, 5),
      language: r.language,
      stars: r.stars,
      url: r.url,
      homepage: r.homepage,
      isPrivate: r.isPrivate,
      highlights: [],
    })),
    badges: analysis.badges,
    strengths,
    contact: {
      email: user.email,
      github: user.profileUrl,
      website: user.blog,
    },
    ai,
    summaryGeneratedAt,
    publicUrl: `${config.frontendUrl.replace(/\/+$/, '')}/profile/${user.username}`,
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
