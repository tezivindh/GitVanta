// =====================================================
// AI PROVIDER TYPES - Common interfaces for all providers
// =====================================================

/**
 * Supported AI providers
 */
export type AIProvider = 'gemini' | 'groq' | 'openai' | 'anthropic';

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Message format for chat-based APIs
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Response from AI provider
 */
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  /**
   * Generate text content
   */
  generateContent(prompt: string): Promise<AIResponse>;

  /**
   * Generate content with structured output (JSON)
   */
  generateStructuredContent<T>(prompt: string): Promise<T>;

  /**
   * Chat-based generation with message history
   */
  chat(messages: AIMessage[]): Promise<AIResponse>;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
