// =====================================================
// AUTHENTICATION CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { User } from '../models';
import { githubService } from '../services';
import { generateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Initiate GitHub OAuth flow
 */
export async function initiateOAuth(req: Request, res: Response): Promise<void> {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=read:user,repo`;
  
  // Redirect directly to GitHub OAuth
  res.redirect(githubAuthUrl);
}

/**
 * Handle GitHub OAuth callback
 */
export async function handleCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.redirect(`${config.frontendUrl}/login?error=no_code`);
    return;
  }

  try {
    // Exchange code for access token
    const accessToken = await githubService.exchangeCodeForToken(
      code,
      config.github.clientId,
      config.github.clientSecret
    );

    // Get user info from GitHub
    const githubUser = await githubService.getAuthenticatedUser(accessToken);

    // Find or create user
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (user) {
      // Update existing user
      user.username = githubUser.login;
      user.displayName = githubUser.name || githubUser.login;
      user.email = githubUser.email || '';
      user.avatarUrl = githubUser.avatar_url;
      user.profileUrl = githubUser.html_url;
      user.bio = githubUser.bio || '';
      user.company = githubUser.company || '';
      user.location = githubUser.location || '';
      user.blog = githubUser.blog || '';
      user.publicRepos = githubUser.public_repos;
      user.followers = githubUser.followers;
      user.following = githubUser.following;
      user.accessToken = accessToken;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        displayName: githubUser.name || githubUser.login,
        email: githubUser.email || '',
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
        bio: githubUser.bio || '',
        company: githubUser.company || '',
        location: githubUser.location || '',
        blog: githubUser.blog || '',
        publicRepos: githubUser.public_repos,
        followers: githubUser.followers,
        following: githubUser.following,
        accessToken,
      });
    }

    // Generate JWT
    const token = generateToken(user._id.toString(), user.username);

    logger.info(`User ${user.username} logged in successfully`);

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    logger.error('OAuth callback error:', error.message);
    res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

/**
 * Logout user
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

/**
 * Refresh token
 */
export async function refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const token = generateToken(user._id.toString(), user.username);

  res.json({
    success: true,
    data: {
      token,
    },
  });
}
