import logger from '../utils/logger';
import { getAIConfig, validateAIConfig } from "./config";
import { GroqProvider, GeminiProvider } from "./providers";
import { AIModelConfig, IAIProvider } from "./types";

let aiProvider: IAIProvider | null = null;

function createProvider(config: AIModelConfig): IAIProvider {
  switch (config.provider) {
    case 'groq':
      return new GroqProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openai':
      // TODO: Implement OpenAI provider
      throw new Error('OpenAI provider not yet implemented.');
    case 'anthropic':
      // TODO: Implement Anthropic provider
      throw new Error('Anthropic provider not yet implemented..');
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export function initializeAI(): void {
    const config = getAIConfig();
    const validation = validateAIConfig(config);

    if(!validation.valid){
        logger.warn(`AI Provider warning: ${validation.error}.`);
        logger.warn('AI features will be disabled until properly configured.')
        return;
    }
    try {
        aiProvider = createProvider(config);
        logger.info(`AI provider initialized: ${config.provider} (${config.model})`)
    } catch (error: any) {
        logger.error(`Failed to initialize AI provider: ${error.message}`);
    }
}

export function getAIProvider(): IAIProvider | null {
  return aiProvider;
}

export function isAIAvailable(): boolean {
  return aiProvider?.isConfigured() ?? false;
}

export async function generateContent(prompt: string): Promise<string> {
  if (!aiProvider) {
    throw new Error('AI provider not initialized. Check your configuration.');
  }
  const response = await aiProvider.generateContent(prompt);
  return response.content;
}

export async function generateStructuredContent<T>(prompt: string): Promise<T> {
  if (!aiProvider) {
    throw new Error('AI provider not initialized. Check your configuration.');
  }
  return aiProvider.generateStructuredContent<T>(prompt);
}

export * from './types';
export * from './config';