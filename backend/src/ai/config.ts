// =====================================================
// AI PROVIDER CONFIGURATION
// =====================================================
// Change the AI_PROVIDER in your .env file to switch providers
// Supported: 'gemini', 'groq', 'openai', 'anthropic'
// =====================================================

import { AIProvider, AIModelConfig } from './types';
import config from '../config';

/**
 * Default models for each provider
 */
const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
};

/**
 * Get the current AI configuration from environment
 */
export function getAIConfig(): AIModelConfig {
  const provider = (process.env.AI_PROVIDER || 'groq') as AIProvider;
  
  // Get API key based on provider
  let apiKey = '';
  switch (provider) {
    case 'gemini':
      apiKey = process.env.GOOGLE_API_KEY || '';
      break;
    case 'groq':
      apiKey = process.env.GROQ_API_KEY || '';
      break;
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || '';
      break;
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      break;
  }

  // Get model (use custom if specified, otherwise default)
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider];

  return {
    provider,
    model,
    apiKey,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  };
}

/**
 * Validate the AI configuration
 */
export function validateAIConfig(config: AIModelConfig): { valid: boolean; error?: string } {
  if (!config.apiKey) {
    return {
      valid: false,
      error: `API key not configured for ${config.provider}. Set the appropriate environment variable.`,
    };
  }

  const validProviders: AIProvider[] = ['gemini', 'groq', 'openai', 'anthropic'];
  if (!validProviders.includes(config.provider)) {
    return {
      valid: false,
      error: `Invalid AI provider: ${config.provider}. Supported: ${validProviders.join(', ')}`,
    };
  }

  return { valid: true };
}

export { AIProvider, AIModelConfig };
