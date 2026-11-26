import { Response } from 'express';
import { githubService } from '../services';
import { AuthenticatedRequest } from '../types';
import { NotFoundError } from '../utils/errors';

type RepoListQuery = { page: number; per_page: number; sort: 'updated' | 'stars' | 'name' | 'created' };

export async function getRepositories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { page, per_page: perPage, sort } = req.query as unknown as RepoListQuery;

  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);
  const ownRepos = repos.filter((r) => !r.fork);

  const time = (d: string) => new Date(d).getTime();
  const comparators = {
    stars: (a: any, b: any) => b.stargazers_count - a.stargazers_count,
    name: (a: any, b: any) => a.name.localeCompare(b.name),
    created: (a: any, b: any) => time(b.created_at) - time(a.created_at),
    updated: (a: any, b: any) => time(b.updated_at) - time(a.updated_at),
  };
  ownRepos.sort(comparators[sort]);

  const start = (page - 1) * perPage;
  res.json({
    success: true,
    data: ownRepos.slice(start, start + perPage),
    pagination: {
      page,
      perPage,
      total: ownRepos.length,
      totalPages: Math.ceil(ownRepos.length / perPage),
    },
  });
}

export async function getRepository(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);
  const repo = repos.find((r) => r.name === repoName);
  if (!repo) throw new NotFoundError('Repository not found.');

  const [languages, readme] = await Promise.all([
    githubService.getRepositoryLanguages(user.accessToken, user.username, repoName),
    githubService.getReadmeContent(user.accessToken, user.username, repoName),
  ]);

  res.json({
    success: true,
    data: { ...repo, languages, hasReadme: !!readme, readmeLength: readme?.length || 0 },
  });
}

export async function getRepositoryLanguages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const data = await githubService.getRepositoryLanguages(user.accessToken, user.username, req.params.repoName);
  res.json({ success: true, data });
}

export async function getRepositoryReadme(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const readme = await githubService.getReadmeContent(user.accessToken, user.username, req.params.repoName);
  if (!readme) throw new NotFoundError('README not found.');
  res.json({ success: true, data: { content: readme, length: readme.length } });
}

export async function getRepositoryCommits(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { limit } = req.query as unknown as { limit: number };
  const data = await githubService.getRepositoryCommits(
    user.accessToken,
    user.username,
    req.params.repoName,
    limit
  );
  res.json({ success: true, data });
}

export async function getRepositoriesStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const repos = await githubService.getOwnRepositories(user.accessToken, user.username);
  const ownRepos = repos.filter((r) => !r.fork);

  const languageDistribution: Record<string, number> = {};
  for (const r of ownRepos) {
    if (r.language) languageDistribution[r.language] = (languageDistribution[r.language] || 0) + 1;
  }
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  res.json({
    success: true,
    data: {
      totalRepositories: ownRepos.length,
      privateRepositories: ownRepos.filter((r) => r.private).length,
      totalStars: ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0),
      totalForks: ownRepos.reduce((sum, r) => sum + r.forks_count, 0),
      uniqueLanguages: Object.keys(languageDistribution).length,
      languageDistribution,
      recentlyUpdated: ownRepos.filter((r) => new Date(r.pushed_at).getTime() > thirtyDaysAgo).length,
      topStarred: [...ownRepos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map((r) => ({ name: r.name, stars: r.stargazers_count })),
    },
  });
}
