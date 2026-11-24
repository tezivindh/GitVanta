import { Response } from 'express';
import { aiService, githubService, analysisService } from '../services';
import { resolveAIForUser, getAIStatusForUser } from '../services/userAIService';
import { describeAI } from '../ai';
import { AuthenticatedRequest, GitHubRepository, IUser } from '../types';
import { NotFoundError } from '../utils/errors';
import { AnalysisReport, RepoInsight } from '../models';

async function findOwnRepo(user: IUser, repoName: string): Promise<GitHubRepository> {
  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);
  const repo = repos.find((r) => r.name === repoName);
  if (!repo) throw new NotFoundError(`Repository "${repoName}" was not found in your account.`);
  return repo;
}

async function latestOrFreshAnalysis(user: IUser) {
  const analysis = await analysisService.getLatestAnalysis(user._id);
  return analysis ?? analysisService.analyzePortfolio(user._id, user.username, user.accessToken);
}

export async function checkAiStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ success: true, data: getAIStatusForUser(req.user!) });
}

export async function enhanceReadme(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;
  const ai = await resolveAIForUser(user);

  const repo = await findOwnRepo(user, repoName);
  const [currentReadme, languages] = await Promise.all([
    githubService.getReadmeContent(user.accessToken, user.username, repoName),
    githubService.getRepositoryLanguages(user.accessToken, user.username, repoName),
  ]);

  const data = await aiService.enhanceReadme(
    ai,
    repoName,
    currentReadme || '',
    repo.description || '',
    Object.keys(languages),
    repo.topics || []
  );
  res.json({ success: true, data, ai: describeAI(ai) });
}

export async function generateResumeBullets(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;
  const ai = await resolveAIForUser(user);

  const repo = await findOwnRepo(user, repoName);
  const [languages, readme] = await Promise.all([
    githubService.getRepositoryLanguages(user.accessToken, user.username, repoName),
    githubService.getReadmeContent(user.accessToken, user.username, repoName),
  ]);

  const data = await aiService.generateResumeBullets(ai, repo, languages, readme);
  res.json({ success: true, data, ai: describeAI(ai) });
}

export async function generateAllResumeBullets(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const limit = Number(req.query.limit ?? 5);
  const ai = await resolveAIForUser(user);

  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);
  const topRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);

  const results = await Promise.all(
    topRepos.map(async (repo) => {
      try {
        const [languages, readme] = await Promise.all([
          githubService.getRepositoryLanguages(user.accessToken, user.username, repo.name),
          githubService.getReadmeContent(user.accessToken, user.username, repo.name),
        ]);
        return await aiService.generateResumeBullets(ai, repo, languages, readme);
      } catch {
        return null;
      }
    })
  );

  res.json({ success: true, data: results.filter(Boolean), ai: describeAI(ai) });
}

export async function generatePortfolioSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const ai = await resolveAIForUser(user);

  const analysis = await latestOrFreshAnalysis(user);
  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);

  const data = await aiService.generatePortfolioSummary(
    ai,
    user.username,
    repos.filter((r) => !r.fork),
    analysis.skills,
    analysis.overallScore
  );
  res.json({ success: true, data, ai: describeAI(ai) });
}

export async function generateImprovementRoadmap(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const ai = await resolveAIForUser(user);

  const analysis = await latestOrFreshAnalysis(user);
  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);

  const data = await aiService.generateImprovementRoadmap(
    ai,
    user.username,
    analysis.overallScore,
    analysis.skills,
    analysis.weaknesses.map((w: { issue: string }) => w.issue),
    repos.filter((r) => !r.fork)
  );
  res.json({ success: true, data, ai: describeAI(ai) });
}

export async function analyzeReadmeQuality(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  const readme = await githubService.getReadmeContent(user.accessToken, user.username, repoName);
  if (!readme) {
    res.json({
      success: true,
      data: { score: 0, feedback: ['No README file found'], missingElements: ['README file'] },
    });
    return;
  }

  let ai;
  try {
    ai = await resolveAIForUser(user);
  } catch {
    res.json({
      success: true,
      data: {
        score: calculateBasicReadmeScore(readme),
        feedback: ['Basic analysis (AI is not set up)'],
        missingElements: [],
      },
    });
    return;
  }

  const data = await aiService.analyzeReadmeQuality(ai, readme);
  res.json({ success: true, data, ai: describeAI(ai) });
}

export async function generateProjectDescription(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;
  const ai = await resolveAIForUser(user);

  const repo = await findOwnRepo(user, repoName);
  const languages = await githubService.getRepositoryLanguages(user.accessToken, user.username, repoName);

  const description = await aiService.generateProjectDescription(
    ai,
    repoName,
    Object.keys(languages),
    repo.topics || [],
    repo.description
  );
  res.json({ success: true, data: { description }, ai: describeAI(ai) });
}

function calculateBasicReadmeScore(content: string): number {
  const lower = content.toLowerCase();
  let score = 0;
  if (content.length > 100) score += 10;
  if (content.length > 500) score += 15;
  if (content.length > 1000) score += 10;
  if (content.includes('#')) score += 10;
  if (content.includes('```')) score += 15;
  if (lower.includes('install')) score += 10;
  if (lower.includes('usage') || lower.includes('example')) score += 10;
  if (lower.includes('license')) score += 10;
  if (lower.includes('contributing')) score += 10;
  return Math.min(100, score);
}

const MAX_REVIEWED_REPOS = 30;

/** Rate every analysed repository (up to 30) in one AI request; cached on the report. */
export async function reviewRepositories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const analysis: any = await analysisService.getLatestAnalysis(user._id);
  if (!analysis) throw new NotFoundError('No analysis found. Run an analysis first.');

  const ai = await resolveAIForUser(user);
  const insights = await RepoInsight.find({ userId: user._id }).lean();
  const byName = new Map(insights.map((i: any) => [i.repoName, i]));

  const repos = [...(analysis.repositories ?? [])]
    .sort((x: any, y: any) => new Date(y.pushedAt || 0).getTime() - new Date(x.pushedAt || 0).getTime())
    .slice(0, MAX_REVIEWED_REPOS);

  const readmes = await Promise.all(
    repos.map((r: any) => githubService.getReadmeContent(user.accessToken, user.username, r.name).catch(() => null))
  );

  const items = await aiService.reviewRepositories(
    ai,
    repos.map((r: any, i: number) => {
      const insight: any = byName.get(r.name);
      const readme = readmes[i] || '';
      return {
        name: r.name,
        description: r.description,
        language: r.language,
        topics: r.topics || [],
        stars: r.stars || 0,
        hasReadme: !!readme,
        readmeLength: readme.length,
        readmeExcerpt: readme.replace(/\s+/g, ' ').slice(0, 400),
        hasLicense: !!insight?.hasLicense,
        hasTests: !!insight?.hasTests,
        hasContributing: !!insight?.hasContributing,
        lastPush: r.pushedAt || null,
      };
    })
  );

  const reviews = { items, ai: describeAI(ai), generatedAt: new Date() };
  await AnalysisReport.updateOne({ _id: analysis._id }, { $set: { aiRepoReviews: reviews } });
  res.json({ success: true, data: reviews, ai: reviews.ai });
}
