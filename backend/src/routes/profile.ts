import { Router, Request, Response } from 'express';
import { User, AnalysisReport } from '../models';
import githubService from '../services/githubService';
import { visibleRepos } from '../services/showcaseService';
import { asyncHandler } from '../middleware';
import { validate } from '../middleware/validate';
import { usernameParams } from '../validation/schemas';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

/** GitHub usernames are case-insensitive. */
export function findUserByUsername(username: string) {
  return User.findOne({ username }).collation({ locale: 'en', strength: 2 });
}

/**
 * GET /api/profile/:username
 * Public, no auth. Returns only what the owner has chosen to show:
 * private repos appear only if opted in, and never with a link.
 */
router.get(
  '/:username',
  validate({ params: usernameParams }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await findUserByUsername(req.params.username);
    if (!user) {
      throw new NotFoundError('Profile not found. This user has not signed up on GitVanta.');
    }

    const analysis: any = await AnalysisReport.findOne({ userId: user._id }).sort({ generatedAt: -1 }).lean();
    if (!analysis) {
      throw new NotFoundError('No analysis yet. This user has not run a portfolio analysis.');
    }

    // Refresh public GitHub details. Done without the owner's token so
    // public page views never spend their GitHub quota.
    let socialAccounts: { provider: string; url: string }[] = [];
    let gh: any = null;
    try {
      [socialAccounts, gh] = await Promise.all([
        githubService.getUserSocialAccounts('', user.username),
        githubService.getUserByUsername('', user.username),
      ]);
      const updates: Record<string, unknown> = {};
      const fields: Array<[string, unknown, unknown]> = [
        ['bio', gh?.bio, user.bio],
        ['company', gh?.company, user.company],
        ['location', gh?.location, user.location],
        ['blog', gh?.blog, user.blog],
        ['followers', gh?.followers, user.followers],
        ['publicRepos', gh?.public_repos, user.publicRepos],
        ['avatarUrl', gh?.avatar_url, user.avatarUrl],
        ['displayName', gh?.name, user.displayName],
      ];
      for (const [key, fresh, current] of fields) {
        if (fresh !== undefined && fresh !== null && fresh !== '' && fresh !== current) updates[key] = fresh;
      }
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        Object.assign(user, updates);
      }
    } catch {
      logger.warn(`Could not refresh GitHub data for public profile ${user.username}`);
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      data: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio || '',
        company: user.company || '',
        location: user.location || '',
        blog: user.blog || '',
        profileUrl: user.profileUrl || `https://github.com/${user.username}`,
        followers: user.followers,
        publicRepos: user.publicRepos,
        socialAccounts,
        overallScore: analysis.overallScore,
        categoryScores: analysis.categoryScores,
        skills: analysis.skills || [],
        badges: analysis.badges || [],
        repositories: visibleRepos(analysis.repositories, user),
        headline: analysis.aiSummary?.headline ?? null,
        summary: analysis.aiSummary?.summary ?? null,
        generatedAt: analysis.generatedAt,
      },
    });
  })
);

export default router;
