import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getProviderCatalog } from '../ai';
import { isEncryptionConfigured } from '../utils/crypto';
import * as userAI from '../services/userAIService';
import { analysisService } from '../services';
import { showcaseSettingsView } from '../services/showcaseService';
import { User } from '../models';

export async function getProviders(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    data: { providers: getProviderCatalog(), canStoreKeys: isEncryptionConfigured() },
  });
}

export async function getAISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      settings: userAI.publicSettings(user),
      status: userAI.getAIStatusForUser(user),
      canStoreKeys: isEncryptionConfigured(),
    },
  });
}

export async function saveAISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const settings = await userAI.saveSettings(req.user!, req.body);
  res.json({ success: true, data: { settings } });
}

export async function toggleAISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const settings = await userAI.setEnabled(req.user!, req.body.enabled);
  res.json({ success: true, data: { settings } });
}

export async function deleteAISettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  await userAI.deleteSettings(req.user!);
  res.json({ success: true, data: { settings: null } });
}

export async function testAIConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
  const result = await userAI.testConnection(req.user!, req.body);
  res.json({ success: true, data: result });
}

export async function listAIModels(req: AuthenticatedRequest, res: Response): Promise<void> {
  const models = await userAI.listModelsFor(req.user!, req.body);
  res.json({ success: true, data: { models } });
}

export async function getShowcaseSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const analysis = await analysisService.getLatestAnalysis(user._id);
  res.json({
    success: true,
    data: {
      hasAnalysis: !!analysis,
      repos: showcaseSettingsView(analysis?.repositories, user),
      hiddenRepos: user.profileSettings?.hiddenRepos ?? [],
      shownPrivateRepos: user.profileSettings?.shownPrivateRepos ?? [],
    },
  });
}

export async function saveShowcaseSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { hiddenRepos, shownPrivateRepos } = req.body as { hiddenRepos: string[]; shownPrivateRepos: string[] };
  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: { 'profileSettings.hiddenRepos': hiddenRepos, 'profileSettings.shownPrivateRepos': shownPrivateRepos } },
    { new: true }
  );
  const analysis = await analysisService.getLatestAnalysis(user._id);
  res.json({
    success: true,
    data: {
      hasAnalysis: !!analysis,
      repos: showcaseSettingsView(analysis?.repositories, updated!),
      hiddenRepos,
      shownPrivateRepos,
    },
  });
}
