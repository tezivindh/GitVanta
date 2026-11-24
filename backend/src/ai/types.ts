export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'deepseek'
  | 'together'
  | 'custom';

export interface AIModelConfig {
  provider: AIProviderId;
  model: string;
  apiKey: string;
  /** Only used by OpenAI-compatible providers. */
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface CompletionOptions {
  /** Ask the provider for a JSON object when it supports a native JSON mode. */
  json?: boolean;
  maxTokens?: number;
}

export interface IAIProvider {
  readonly id: AIProviderId;
  readonly label: string;
  readonly model: string;
  complete(prompt: string, options?: CompletionOptions): Promise<AIResponse>;
}

/** Where the credentials for an AI call came from. */
export type AIKeySource = 'user' | 'server';

export interface ResolvedAI {
  provider: IAIProvider;
  source: AIKeySource;
}

export interface AIMeta {
  provider: AIProviderId;
  providerLabel: string;
  model: string;
  source: AIKeySource;
}
