import { Response } from 'express';
import { githubService } from '../services';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export async function getRepositories(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 30;
  const sort = (req.query.sort as string) || 'updated';

  try {
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );

    let filteredRepos = repos.filter(r => !r.fork);

    switch (sort) {
      case 'stars':
        filteredRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
        break;
      case 'name':
        filteredRepos.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'created':
        filteredRepos.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      default:
        filteredRepos.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }

    // Paginate
    const startIndex = (page - 1) * perPage;
    const paginatedRepos = filteredRepos.slice(startIndex, startIndex + perPage);

    res.json({
      success: true,
      data: paginatedRepos,
      pagination: {
        page,
        perPage,
        total: filteredRepos.length,
        totalPages: Math.ceil(filteredRepos.length / perPage),
      },
    });
  } catch (error: any) {
    logger.error('Get repositories error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories',
    });
  }
}

export async function getRepository(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  try {
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );
    
    const repo = repos.find(r => r.name === repoName);

    if (!repo) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }

    // Get additional details
    const [languages, readme] = await Promise.all([
      githubService.getRepositoryLanguages(user.accessToken, user.username, repoName),
      githubService.getReadmeContent(user.accessToken, user.username, repoName),
    ]);

    res.json({
      success: true,
      data: {
        ...repo,
        languages,
        hasReadme: !!readme,
        readmeLength: readme?.length || 0,
      },
    });
  } catch (error: any) {
    logger.error('Get repository error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository',
    });
  }
}


export async function getRepositoryLanguages(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  try {
    const languages = await githubService.getRepositoryLanguages(
      user.accessToken,
      user.username,
      repoName
    );

    res.json({
      success: true,
      data: languages,
    });
  } catch (error: any) {
    logger.error('Get languages error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch languages',
    });
  }
}


export async function getRepositoryReadme(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  try {
    const readme = await githubService.getReadmeContent(
      user.accessToken,
      user.username,
      repoName
    );

    if (!readme) {
      res.status(404).json({
        success: false,
        error: 'README not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        content: readme,
        length: readme.length,
      },
    });
  } catch (error: any) {
    logger.error('Get README error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch README',
    });
  }
}

export async function getRepositoryCommits(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;
  const limit = parseInt(req.query.limit as string) || 30;

  try {
    const commits = await githubService.getRepositoryCommits(
      user.accessToken,
      user.username,
      repoName,
      limit
    );

    res.json({
      success: true,
      data: commits,
    });
  } catch (error: any) {
    logger.error('Get commits error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commits',
    });
  }
}


export async function getRepositoriesStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );

    const ownRepos = repos.filter(r => !r.fork);

    // Calculate statistics
    const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = ownRepos.reduce((sum, r) => sum + r.forks_count, 0);
    const languages = new Set<string>();
    ownRepos.forEach(r => {
      if (r.language) languages.add(r.language);
    });

    // Language distribution
    const languageDistribution: Record<string, number> = {};
    ownRepos.forEach(r => {
      if (r.language) {
        languageDistribution[r.language] = (languageDistribution[r.language] || 0) + 1;
      }
    });

    // Recent activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentlyUpdated = ownRepos.filter(
      r => new Date(r.pushed_at) > thirtyDaysAgo
    ).length;

    res.json({
      success: true,
      data: {
        totalRepositories: ownRepos.length,
        totalStars,
        totalForks,
        uniqueLanguages: languages.size,
        languageDistribution,
        recentlyUpdated,
        topStarred: ownRepos
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5)
          .map(r => ({ name: r.name, stars: r.stargazers_count })),
      },
    });
  } catch (error: any) {
    logger.error('Get repository stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository statistics',
    });
  }
}
