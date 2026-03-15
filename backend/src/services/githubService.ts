import axios, { AxiosInstance } from 'axios';
import { 
  GitHubRepository, 
  GitHubUser, 
  GitHubCommit,
  GitHubSocialAccount,
} from '../types';
import logger from '../utils/logger';
import { ExternalServiceError } from '../utils/errors';
import { cacheGet, cacheSet } from '../config/redis';

const GITHUB_API_BASE = 'https://api.github.com';

function createGitHubClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 30000,
  });
}

export async function getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get<GitHubUser>('/user');
    return response.data;
  } catch (error: any) {
    logger.error('Failed to get authenticated user:', error.message);
    throw new ExternalServiceError('GitHub', 'Failed to fetch user profile');
  }
}

export async function getUserRepositories(
  accessToken: string,
  username: string,
  page: number = 1,
  perPage: number = 100
): Promise<GitHubRepository[]> {
  const cacheKey = `repos:${username}:${page}`;
  const cached = await cacheGet<GitHubRepository[]>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get<GitHubRepository[]>(`/users/${username}/repos`, {
      params: {
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page,
      },
    });

    await cacheSet(cacheKey, response.data, { prefix: 'github', ttl: 3600 });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to get user repositories:', error.message);
    throw new ExternalServiceError('GitHub', 'Failed to fetch repositories');
  }
}

export async function getAllUserRepositories(
  accessToken: string,
  username: string
): Promise<GitHubRepository[]> {
  const cacheKey = `all-repos:${username}`;
  const cached = await cacheGet<GitHubRepository[]>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  const allRepos: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const repos = await getUserRepositories(accessToken, username, page, perPage);
      allRepos.push(...repos);

      if (repos.length < perPage) break;
      page++;

      // Safety limit
      if (page > 10) break;
    }

    await cacheSet(cacheKey, allRepos, { prefix: 'github', ttl: 3600 });
    return allRepos;
  } catch (error: any) {
    logger.error('Failed to get all repositories:', error.message);
    throw new ExternalServiceError('GitHub', 'Failed to fetch all repositories');
  }
}

export async function getRepositoryLanguages(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const cacheKey = `languages:${owner}/${repo}`;
  const cached = await cacheGet<Record<string, number>>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
    await cacheSet(cacheKey, response.data, { prefix: 'github', ttl: 86400 });
    return response.data;
  } catch (error: any) {
    logger.error(`Failed to get languages for ${owner}/${repo}:`, error.message);
    return {};
  }
}

export async function getRepositoryCommits(
  accessToken: string,
  owner: string,
  repo: string,
  perPage: number = 100
): Promise<GitHubCommit[]> {
  const cacheKey = `commits:${owner}/${repo}`;
  const cached = await cacheGet<GitHubCommit[]>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get<GitHubCommit[]>(`/repos/${owner}/${repo}/commits`, {
      params: {
        per_page: perPage,
      },
    });
    await cacheSet(cacheKey, response.data, { prefix: 'github', ttl: 3600 });
    return response.data;
  } catch (error: any) {
    logger.error(`Failed to get commits for ${owner}/${repo}:`, error.message);
    return [];
  }
}

export async function getReadmeContent(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get(`/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: 'application/vnd.github.raw+json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    logger.error(`Failed to get README for ${owner}/${repo}:`, error.message);
    return null;
  }
}

export async function checkFileExists(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<boolean> {
  const client = createGitHubClient(accessToken);
  
  try {
    await client.get(`/repos/${owner}/${repo}/contents/${path}`);
    return true;
  } catch (error: any) {
    return false;
  }
}

export async function hasProfileReadme(
  accessToken: string,
  username: string
): Promise<boolean> {
  return await checkFileExists(accessToken, username, username, 'README.md');
}

export async function getUserByUsername(
  accessToken: string,
  username: string
): Promise<GitHubUser> {
  const cacheKey = `user:${username}`;
  const cached = await cacheGet<GitHubUser>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  try {
    // Use public endpoint (works without auth, just lower rate limit)
    const response = await axios.get<GitHubUser>(
      `${GITHUB_API_BASE}/users/${username}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: 10000,
      }
    );
    await cacheSet(cacheKey, response.data, { prefix: 'github', ttl: 3600 });
    return response.data;
  } catch (error: any) {
    logger.error(`Failed to get user ${username}:`, error.message);
    throw new ExternalServiceError('GitHub', `Failed to fetch user: ${username}`);
  }
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || response.data.error);
    }

    return response.data.access_token;
  } catch (error: any) {
    logger.error('Failed to exchange OAuth code:', error.message);
    throw new ExternalServiceError('GitHub', 'Failed to authenticate with GitHub');
  }
}


export async function getContributorStats(
  accessToken: string,
  owner: string,
  repo: string
): Promise<any[]> {
  const client = createGitHubClient(accessToken);
  
  try {
    const response = await client.get(`/repos/${owner}/${repo}/stats/contributors`);
    return response.data || [];
  } catch (error: any) {
    logger.error(`Failed to get contributor stats for ${owner}/${repo}:`, error.message);
    return [];
  }
}


export async function getUserSocialAccounts(
  accessToken: string,
  username: string
): Promise<GitHubSocialAccount[]> {
  const cacheKey = `social:${username}`;
  const cached = await cacheGet<GitHubSocialAccount[]>(cacheKey, { prefix: 'github' });
  if (cached) return cached;

  try {
    const response = await axios.get<GitHubSocialAccount[]>(
      `${GITHUB_API_BASE}/users/${username}/social_accounts`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: 10000,
      }
    );
    const accounts = response.data || [];
    await cacheSet(cacheKey, accounts, { prefix: 'github', ttl: 3600 });
    return accounts;
  } catch (error: any) {
    logger.warn(`Failed to fetch social accounts for ${username}: ${error.message}`);
    return []; // Non-critical, return empty
  }
}

export default {
  getAuthenticatedUser,
  getUserRepositories,
  getAllUserRepositories,
  getRepositoryLanguages,
  getRepositoryCommits,
  getReadmeContent,
  checkFileExists,
  hasProfileReadme,
  getUserByUsername,
  exchangeCodeForToken,
  getContributorStats,
  getUserSocialAccounts,
};
