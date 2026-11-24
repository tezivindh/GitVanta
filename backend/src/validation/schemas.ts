import { z } from 'zod';

/** GitHub logins: 1-39 chars, alphanumeric or single hyphens, no leading hyphen. */
export const githubUsername = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Not a valid GitHub username');

/** GitHub repository names: letters, digits, ".", "-", "_" (max 100). */
export const repoName = z
  .string()
  .regex(/^[A-Za-z0-9._-]{1,100}$/, 'Not a valid repository name')
  .refine((v) => v !== '.' && v !== '..', 'Not a valid repository name');

export const usernameParams = z.object({ username: githubUsername });
export const repoParams = z.object({ repoName });

export const historyQuery = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(30),
});

export const resumeQuery = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const repoListQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(30),
  sort: z.enum(['updated', 'stars', 'name', 'created']).default('updated'),
});

export const commitsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** SVG badge style options. */
export const badgeQuery = z.object({
  style: z.enum(['flat', 'flat-square']).default('flat'),
  label: z.string().trim().max(30).regex(/^[\w .\-]*$/).optional(),
});
