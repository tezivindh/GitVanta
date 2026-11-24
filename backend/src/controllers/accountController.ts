import { Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { AnalysisReport, RepoInsight, User } from '../models';
import { generateToken } from '../middleware/auth';
import { publicSettings } from '../services/userAIService';
import { ValidationError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';

/** Everything GitVanta stores about the user, minus secrets. */
export async function exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const [reports, insights] = await Promise.all([
    AnalysisReport.find({ userId: user._id }).sort({ generatedAt: -1 }).lean(),
    RepoInsight.find({ userId: user._id }).lean(),
  ]);

  const profile = user.toJSON() as Record<string, unknown>;
  delete profile.aiSettings;

  const payload = {
    exportedAt: new Date().toISOString(),
    format: 'gitvanta-export-v1',
    note: 'GitHub access tokens and AI API keys are never included in exports.',
    profile,
    aiSettings: publicSettings(user),
    analyses: reports,
    repositoryInsights: insights,
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="gitvanta-data-${user.username}.json"`);
  res.send(JSON.stringify(payload, null, 2));
}

/** Invalidate every existing token; return a fresh one for this device. */
export async function signOutEverywhere(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  // Whole seconds, because JWT iat is in seconds: the new token below is
  // issued in this same second or later, so it stays valid.
  const cutoff = new Date(Math.floor(Date.now() / 1000) * 1000);
  await User.updateOne({ _id: user._id }, { $set: { sessionsRevokedAt: cutoff } });
  const keepCurrent = req.body?.keepCurrent !== false;
  logger.info(`User ${user.username} signed out of all sessions`);
  res.json({
    success: true,
    data: { token: keepCurrent ? generateToken(user._id.toString(), user.username) : null },
  });
}

/** Permanently delete the account and all stored data. */
export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  if (String(req.body?.confirm ?? '').toLowerCase() !== user.username.toLowerCase()) {
    throw new ValidationError('Type your GitHub username to confirm.', { confirm: 'Does not match' });
  }

  // Best effort: revoke the OAuth grant so GitVanta no longer has access.
  if (config.github.clientId && config.github.clientSecret && user.accessToken) {
    try {
      await axios.delete(`https://api.github.com/applications/${config.github.clientId}/grant`, {
        auth: { username: config.github.clientId, password: config.github.clientSecret },
        data: { access_token: user.accessToken },
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
        timeout: 10_000,
      });
    } catch (error: any) {
      logger.warn(`Could not revoke GitHub grant for ${user.username}: HTTP ${error.response?.status ?? 'n/a'}`);
    }
  }

  await Promise.all([
    AnalysisReport.deleteMany({ userId: user._id }),
    RepoInsight.deleteMany({ userId: user._id }),
  ]);
  await User.deleteOne({ _id: user._id });
  logger.info(`Deleted account ${user.username}`);
  res.json({ success: true, data: { deleted: true } });
}
