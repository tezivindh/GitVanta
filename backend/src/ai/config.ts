import { AIModelConfig, AIProviderId } from './types';
import { PROVIDERS, isProviderId } from './catalog';

/** Env var holding the server key for each provider. */
const SERVER_KEY_ENV: Record<AIProviderId, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  together: 'TOGETHER_API_KEY',
  custom: 'AI_API_KEY',
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * The server-wide AI config from the environment. Returns null when no
 * provider key is configured, so callers can fall back or report clearly.
 */
export function getServerAIConfig(): AIModelConfig | null {
  const raw = (process.env.AI_PROVIDER || 'groq').trim().toLowerCase();
  if (!isProviderId(raw)) return null;
  const provider: AIProviderId = raw;
  const info = PROVIDERS[provider];

  // GEMINI_API_KEY is accepted as an alias because older docs used it.
  const apiKey =
    process.env[SERVER_KEY_ENV[provider]] ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : undefined) ||
    '';
  const baseUrl = process.env.AI_BASE_URL || info.baseUrl;

  if (info.requiresKey && !apiKey) return null;
  if (info.requiresBaseUrl && !baseUrl) return null;

  return {
    provider,
    model: process.env.AI_MODEL || info.defaultModel,
    apiKey,
    baseUrl,
    maxTokens: Math.round(parseNumber(process.env.AI_MAX_TOKENS, 4096)),
    temperature: parseNumber(process.env.AI_TEMPERATURE, 0.7),
  };
}

export function getServerKeyEnvName(provider: AIProviderId): string {
  return SERVER_KEY_ENV[provider];
}
