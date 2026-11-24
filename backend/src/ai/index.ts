import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { getServerAIConfig } from './config';
import { PROVIDERS } from './catalog';
import { extractJson } from './json';
import { AIProviderError } from './errors';
import { AnthropicProvider, GeminiProvider, OpenAICompatibleProvider } from './providers';
import { AIMeta, AIModelConfig, CompletionOptions, IAIProvider, ResolvedAI } from './types';

export function createProvider(config: AIModelConfig): IAIProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    default:
      if (PROVIDERS[config.provider]?.openAICompatible) {
        return new OpenAICompatibleProvider(config);
      }
      throw new AIProviderError('bad_request', `Unknown AI provider: ${config.provider}`);
  }
}

let serverProvider: IAIProvider | null = null;

/** Build the server-wide provider from env. Safe to call more than once. */
export function initializeAI(): void {
  const config = getServerAIConfig();
  if (!config) {
    serverProvider = null;
    logger.warn(
      'No server AI key configured. AI features work only for users who add their own key in Settings.'
    );
    return;
  }
  try {
    serverProvider = createProvider(config);
    logger.info(`Server AI provider: ${serverProvider.label} (${serverProvider.model})`);
  } catch (error: any) {
    serverProvider = null;
    logger.error(`Failed to initialize server AI provider: ${error.message}`);
  }
}

export function isServerAIAvailable(): boolean {
  return serverProvider !== null;
}

export function getServerProviderInfo(): { provider: string; label: string; model: string } | null {
  return serverProvider
    ? { provider: serverProvider.id, label: serverProvider.label, model: serverProvider.model }
    : null;
}

export class AINotConfiguredError extends AppError {
  constructor() {
    super(
      'AI is not set up. Add your own API key in Settings → AI provider to use AI features.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }
}

/**
 * Pick the provider for one request: the user's own key when they saved one,
 * otherwise the server key. Throws AINotConfiguredError when neither exists.
 */
export function resolveAI(userConfig?: AIModelConfig | null): ResolvedAI {
  if (userConfig) {
    return { provider: createProvider(userConfig), source: 'user' };
  }
  if (serverProvider) {
    return { provider: serverProvider, source: 'server' };
  }
  throw new AINotConfiguredError();
}

export function describeAI(ai: ResolvedAI): AIMeta {
  return {
    provider: ai.provider.id,
    providerLabel: ai.provider.label,
    model: ai.provider.model,
    source: ai.source,
  };
}

export async function generateText(
  ai: ResolvedAI,
  prompt: string,
  options?: CompletionOptions
): Promise<string> {
  const response = await ai.provider.complete(prompt, options);
  return response.content;
}

export async function generateJson<T>(
  ai: ResolvedAI,
  prompt: string,
  options: { maxTokens?: number } = {}
): Promise<T> {
  const response = await ai.provider.complete(prompt, { json: true, ...options });
  try {
    return extractJson<T>(response.content);
  } catch {
    throw new AIProviderError(
      'parse',
      `${ai.provider.label} returned a response that could not be read. Try again or pick a different model.`
    );
  }
}

export * from './types';
export { AIProviderError } from './errors';
export { getProviderCatalog, PROVIDERS, isProviderId } from './catalog';
