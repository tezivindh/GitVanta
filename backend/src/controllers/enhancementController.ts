import { Response } from 'express';
import { aiService, githubService, analysisService } from '../services';
import { resolveAIForUser, getAIStatusForUser } from '../services/userAIService';
import { describeAI } from '../ai';
import { AuthenticatedRequest, GitHubRepository, IUser } from '../types';
import { NotFoundError } from '../utils/errors';

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
  const ai = resolveAIForUser(user);

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
  const ai = resolveAIForUser(user);

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
  const ai = resolveAIForUser(user);

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
  const ai = resolveAIForUser(user);

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
  const ai = resolveAIForUser(user);

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
    ai = resolveAIForUser(user);
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
  const ai = resolveAIForUser(user);

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
