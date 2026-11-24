import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getProviderCatalog } from '../ai';
import { isEncryptionConfigured } from '../utils/crypto';
import * as userAI from '../services/userAIService';

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
