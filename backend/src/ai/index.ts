// =====================================================
// AI PROVIDER FACTORY
// =====================================================
// This is the main entry point for AI functionality.
// It automatically creates the right provider based on your .env config.
//
// To switch AI providers, simply change AI_PROVIDER in your .env file:
//   AI_PROVIDER=groq    # Uses Groq with Llama models (fast & free)
//   AI_PROVIDER=gemini  # Uses Google Gemini
//   AI_PROVIDER=openai  # Uses OpenAI GPT models
//
// =====================================================

import { IAIProvider } from './types';
import { getAIConfig, validateAIConfig, AIModelConfig } from './config';
import { GroqProvider, GeminiProvider } from './providers';
import logger from '../utils/logger';

let aiProvider: IAIProvider | null = null;

/**
 * Create an AI provider based on the configuration
 */
function createProvider(config: AIModelConfig): IAIProvider {
  switch (config.provider) {
    case 'groq':
      return new GroqProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openai':
      // TODO: Implement OpenAI provider
      throw new Error('OpenAI provider not yet implemented. Use groq or gemini.');
    case 'anthropic':
      // TODO: Implement Anthropic provider
      throw new Error('Anthropic provider not yet implemented. Use groq or gemini.');
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

/**
 * Initialize the AI provider
 * Call this once at application startup
 */
export function initializeAI(): void {
  const config = getAIConfig();
  const validation = validateAIConfig(config);

  if (!validation.valid) {
    logger.warn(`AI Provider Warning: ${validation.error}`);
    logger.warn('AI features will be disabled until properly configured.');
    return;
  }

  try {
    aiProvider = createProvider(config);
    logger.info(`AI Provider initialized: ${config.provider} (${config.model})`);
  } catch (error: any) {
    logger.error(`Failed to initialize AI provider: ${error.message}`);
  }
}

/**
 * Get the current AI provider instance
 */
export function getAIProvider(): IAIProvider | null {
  return aiProvider;
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return aiProvider?.isConfigured() ?? false;
}

/**
 * Generate content using the configured AI provider
 */
export async function generateContent(prompt: string): Promise<string> {
  if (!aiProvider) {
    throw new Error('AI provider not initialized. Check your configuration.');
  }
  const response = await aiProvider.generateContent(prompt);
  return response.content;
}

/**
 * Generate structured JSON content
 */
export async function generateStructuredContent<T>(prompt: string): Promise<T> {
  if (!aiProvider) {
    throw new Error('AI provider not initialized. Check your configuration.');
  }
  return aiProvider.generateStructuredContent<T>(prompt);
}

// Export types
export * from './types';
export * from './config';
