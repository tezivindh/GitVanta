// =====================================================
// PUBLIC PROFILE ROUTES - No authentication required
// =====================================================

import { Router, Request, Response } from 'express';
import { User } from '../models';
import { AnalysisReport } from '../models';
import githubService from '../services/githubService';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/profile/:username
 * Public endpoint — returns portfolio data for the given username
 */
router.get('/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    // Find the user by GitHub username (keep accessToken for internal use)
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Profile not found. This user has not signed up on GitVanta.',
      });
      return;
    }

    // Find the latest analysis for this user
    const analysis = await AnalysisReport.findOne({ userId: user._id })
      .sort({ generatedAt: -1 })
      .lean();

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found. This user has not run a portfolio analysis yet.',
      });
      return;
    }

    // Fetch fresh GitHub profile data + social accounts in parallel
    let socialAccounts: { provider: string; url: string }[] = [];
    let githubProfile: any = null;
    try {
      const [socials, ghUser] = await Promise.all([
        githubService.getUserSocialAccounts(user.accessToken || '', username),
        githubService.getUserByUsername(user.accessToken || '', username),
      ]);
      socialAccounts = socials;
      githubProfile = ghUser;

      // Update user record with latest GitHub data if we got fresh data
      if (githubProfile) {
        const updates: Record<string, any> = {};
        if (githubProfile.bio && githubProfile.bio !== user.bio) updates.bio = githubProfile.bio;
        if (githubProfile.company && githubProfile.company !== user.company) updates.company = githubProfile.company;
        if (githubProfile.location && githubProfile.location !== user.location) updates.location = githubProfile.location;
        if (githubProfile.blog && githubProfile.blog !== user.blog) updates.blog = githubProfile.blog;
        if (githubProfile.email && githubProfile.email !== user.email) updates.email = githubProfile.email;
        if (githubProfile.followers !== user.followers) updates.followers = githubProfile.followers;
        if (githubProfile.public_repos !== user.publicRepos) updates.publicRepos = githubProfile.public_repos;
        if (githubProfile.avatar_url && githubProfile.avatar_url !== user.avatarUrl) updates.avatarUrl = githubProfile.avatar_url;
        if (githubProfile.name && githubProfile.name !== user.displayName) updates.displayName = githubProfile.name;

        if (Object.keys(updates).length > 0) {
          await User.updateOne({ _id: user._id }, { $set: updates });
          // Apply to current response too
          Object.assign(user, updates);
        }
      }
    } catch (err) {
      logger.warn(`Could not fetch fresh GitHub data for ${username}`);
    }

    // Build the public profile response (exclude sensitive data)
    const publicProfile = {
      username: user.username,
      displayName: githubProfile?.name || user.displayName,
      avatarUrl: githubProfile?.avatar_url || user.avatarUrl,
      bio: githubProfile?.bio || user.bio || '',
      company: githubProfile?.company || user.company || '',
      location: githubProfile?.location || user.location || '',
      blog: githubProfile?.blog || user.blog || '',
      profileUrl: user.profileUrl,
      followers: githubProfile?.followers ?? user.followers,
      publicRepos: githubProfile?.public_repos ?? user.publicRepos,
      socialAccounts,
      overallScore: analysis.overallScore,
      categoryScores: analysis.categoryScores,
      skills: analysis.skills || [],
      badges: analysis.badges || [],
      repositories: analysis.repositories || [],
      generatedAt: analysis.generatedAt,
    };

    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error: any) {
    logger.error(`Public profile error for ${username}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile',
    });
  }
});

export default router;
