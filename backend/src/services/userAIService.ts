import { User } from '../models';
import {
  AIModelConfig,
  AIProviderError,
  AIProviderId,
  PROVIDERS,
  createProvider,
  getServerProviderInfo,
  resolveAI,
  ResolvedAI,
} from '../ai';
import { listModels } from '../ai/models';
import { assertSafeBaseUrl } from '../ai/urlSafety';
import { IUser, IUserAISettings } from '../types';
import { decryptSecret, encryptSecret, isEncryptionConfigured, maskSecret } from '../utils/crypto';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export interface AISettingsInput {
  provider: AIProviderId;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

/** True when the user has their own provider switched on. */
export function usesOwnKey(user: IUser): boolean {
  const s = user.aiSettings;
  if (!s?.enabled) return false;
  const info = PROVIDERS[s.provider as AIProviderId];
  return !!info && (!!s.keyHint || !info.requiresKey);
}

/** Decrypt the user's saved config. Only called right before an AI request. */
async function loadUserConfig(user: IUser): Promise<AIModelConfig | null> {
  if (!usesOwnKey(user)) return null;
  const doc = await User.findById(user._id).select('+aiSettings.encryptedKey').lean();
  const s = doc?.aiSettings;
  if (!s) return null;

  const info = PROVIDERS[s.provider as AIProviderId];
  const apiKey = s.encryptedKey ? decryptSecret(s.encryptedKey, user._id.toString()) : '';
  // Re-check custom URLs on every use: DNS can change after the URL was saved.
  const baseUrl = s.provider === 'custom' && s.baseUrl ? await assertSafeBaseUrl(s.baseUrl) : info.baseUrl;
  return {
    provider: s.provider as AIProviderId,
    model: s.model || info.defaultModel,
    apiKey,
    baseUrl,
    maxTokens: 4096,
    temperature: 0.7,
  };
}

/** The provider for this user's AI request: their own key first, else the server key. */
export async function resolveAIForUser(user: IUser): Promise<ResolvedAI> {
  return resolveAI(await loadUserConfig(user));
}

/** Public view of the user's settings. Never includes the key. */
export function publicSettings(user: IUser) {
  const s = user.aiSettings;
  return s
    ? {
        enabled: !!s.enabled,
        provider: s.provider,
        providerLabel: PROVIDERS[s.provider as AIProviderId]?.label ?? s.provider,
        model: s.model,
        baseUrl: s.baseUrl ?? null,
        keyHint: s.keyHint ?? null,
        hasKey: !!s.keyHint,
        updatedAt: s.updatedAt ?? null,
        lastTestedAt: s.lastTestedAt ?? null,
        lastTestOk: s.lastTestOk ?? null,
      }
    : null;
}

export function getAIStatusForUser(user: IUser) {
  const server = getServerProviderInfo();
  const own = usesOwnKey(user) ? user.aiSettings! : null;

  if (own) {
    const label = PROVIDERS[own.provider as AIProviderId]?.label ?? own.provider;
    return {
      available: true,
      source: 'user' as const,
      provider: { provider: own.provider, label, model: own.model },
      message: `AI features use your own ${label} key (${own.model}).`,
    };
  }
  return {
    available: !!server,
    source: server ? ('server' as const) : null,
    provider: server,
    message: server
      ? `AI features use ${server.label} (${server.model}).`
      : 'AI is not set up. Add your own API key in Settings → AI provider.',
  };
}

/** Fill in the key/baseUrl for a test or model list, falling back to the saved key. */
async function buildConfig(user: IUser, input: AISettingsInput): Promise<AIModelConfig> {
  const info = PROVIDERS[input.provider];
  let apiKey = input.apiKey?.trim() || '';

  if (!apiKey && user.aiSettings?.provider === input.provider && user.aiSettings.keyHint) {
    const doc = await User.findById(user._id).select('+aiSettings.encryptedKey').lean();
    if (doc?.aiSettings?.encryptedKey) {
      apiKey = decryptSecret(doc.aiSettings.encryptedKey, user._id.toString());
    }
  }
  if (info.requiresKey && !apiKey) {
    throw new ValidationError(`Enter your ${info.label} API key.`, { apiKey: 'Required' });
  }

  let baseUrl = info.baseUrl;
  if (input.provider === 'custom') {
    if (!input.baseUrl) {
      throw new ValidationError('Enter the base URL of your OpenAI-compatible server.', {
        baseUrl: 'Required',
      });
    }
    baseUrl = await assertSafeBaseUrl(input.baseUrl);
  }

  const model = input.model?.trim() || info.defaultModel;
  return { provider: input.provider, model, apiKey, baseUrl, maxTokens: 4096, temperature: 0.7 };
}

export async function saveSettings(user: IUser, input: AISettingsInput) {
  const info = PROVIDERS[input.provider];
  const config = await buildConfig(user, input);

  if (!config.model) {
    throw new ValidationError('Choose or type a model name.', { model: 'Required' });
  }

  const providerChanged = user.aiSettings?.provider !== input.provider;
  const newKey = input.apiKey?.trim();
  const update: Record<string, unknown> = {
    'aiSettings.enabled': input.enabled ?? true,
    'aiSettings.provider': input.provider,
    'aiSettings.model': config.model,
    'aiSettings.updatedAt': new Date(),
  };
  const unset: Record<string, ''> = {};

  if (input.provider === 'custom') update['aiSettings.baseUrl'] = config.baseUrl;
  else unset['aiSettings.baseUrl'] = '';

  if (newKey) {
    if (!isEncryptionConfigured()) {
      // Surfaces as 503 ENCRYPTION_NOT_CONFIGURED.
      encryptSecret('', user._id.toString());
    }
    update['aiSettings.encryptedKey'] = encryptSecret(newKey, user._id.toString());
    update['aiSettings.keyHint'] = maskSecret(newKey);
    unset['aiSettings.lastTestedAt'] = '';
    unset['aiSettings.lastTestOk'] = '';
  } else if (providerChanged) {
    // A key for one provider is useless for another: drop it.
    if (info.requiresKey) {
      throw new ValidationError(`Enter your ${info.label} API key.`, { apiKey: 'Required' });
    }
    unset['aiSettings.encryptedKey'] = '';
    unset['aiSettings.keyHint'] = '';
  }

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true }
  );
  if (!updated) throw new NotFoundError('User not found');
  logger.info(`User ${user.username} saved AI settings (${input.provider})`);
  return publicSettings(updated);
}

export async function setEnabled(user: IUser, enabled: boolean) {
  if (!user.aiSettings) {
    throw new AppError('Add an API key first.', 400, 'AI_SETTINGS_MISSING');
  }
  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: { 'aiSettings.enabled': enabled, 'aiSettings.updatedAt': new Date() } },
    { new: true }
  );
  return publicSettings(updated!);
}

export async function deleteSettings(user: IUser): Promise<void> {
  await User.updateOne({ _id: user._id }, { $unset: { aiSettings: '' } });
  logger.info(`User ${user.username} removed their AI key`);
}

/** One small real request to prove the key, model and URL work. */
export async function testConnection(user: IUser, input: AISettingsInput) {
  const config = await buildConfig(user, input);
  const provider = createProvider({ ...config, maxTokens: 1024 });
  const started = Date.now();

  let reply = '';
  let warning: string | undefined;
  try {
    const response = await provider.complete('Reply with exactly: OK', { maxTokens: 1024 });
    reply = response.content.trim().slice(0, 80);
  } catch (error) {
    // A 200 with no text (e.g. a reasoning model spent its budget thinking)
    // still proves the key and model work.
    if (error instanceof AIProviderError && error.kind === 'parse') {
      warning = 'Connected, but the model returned no text for the test prompt.';
    } else {
      await recordTest(user, input.provider, false);
      throw error;
    }
  }

  await recordTest(user, input.provider, true);
  return {
    ok: true,
    provider: provider.id,
    providerLabel: provider.label,
    model: provider.model,
    latencyMs: Date.now() - started,
    reply,
    ...(warning ? { warning } : {}),
  };
}

async function recordTest(user: IUser, provider: string, ok: boolean): Promise<void> {
  // Only record against the saved config it actually tested.
  if (user.aiSettings?.provider !== provider) return;
  await User.updateOne(
    { _id: user._id },
    { $set: { 'aiSettings.lastTestedAt': new Date(), 'aiSettings.lastTestOk': ok } }
  );
}

export async function listModelsFor(user: IUser, input: AISettingsInput): Promise<string[]> {
  const config = await buildConfig(user, input);
  return listModels(config);
}

export type { IUserAISettings };
