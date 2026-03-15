import { Request, Response } from 'express';
import { User } from '../models';
import { githubService } from '../services';
import { generateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import config from '../config';
import logger from '../utils/logger';


export async function initiateOAuth(req: Request, res: Response): Promise<void> {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=read:user,repo`;
  
  res.redirect(githubAuthUrl);
}


export async function handleCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.redirect(`${config.frontendUrl}/login?error=no_code`);
    return;
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(
      code,
      config.github.clientId,
      config.github.clientSecret
    );

    const githubUser = await githubService.getAuthenticatedUser(accessToken);

    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (user) {
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

    const token = generateToken(user._id.toString(), user.username);

    logger.info(`User ${user.username} logged in successfully`);

    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    logger.error('OAuth callback error:', error.message);
    res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}


export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}


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
