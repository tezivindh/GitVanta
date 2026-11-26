import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelConfig, AIResponse, CompletionOptions, IAIProvider } from '../types';
import { PROVIDERS } from '../catalog';
import { AIProviderError, aiErrorFromStatus } from '../errors';

export class GeminiProvider implements IAIProvider {
  readonly id = 'gemini' as const;
  readonly label = PROVIDERS.gemini.label;
  readonly model: string;
  private readonly client: GoogleGenerativeAI;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(config: AIModelConfig) {
    this.model = config.model || PROVIDERS.gemini.defaultModel;
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.maxTokens = config.maxTokens ?? 8192;
    this.temperature = config.temperature ?? 0.7;
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<AIResponse> {
    const model = this.client.getGenerativeModel(
      {
        model: this.model,
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? this.maxTokens,
          temperature: this.temperature,
          ...(options.json ? { responseMimeType: 'application/json' } : {}),
        },
      },
      { timeout: 120_000 }
    );

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      if (!content.trim()) {
        throw new AIProviderError('parse', 'Gemini returned an empty response.');
      }
      return {
        content,
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              completionTokens: response.usageMetadata.candidatesTokenCount || 0,
              totalTokens: response.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) throw error;
      const status: number | undefined = error?.status;
      if (status) throw aiErrorFromStatus(this.label, status, error?.statusText);
      if (/API key not valid/i.test(error?.message || '')) {
        throw aiErrorFromStatus(this.label, 401);
      }
      if (/blocked|SAFETY/i.test(error?.message || '')) {
        throw new AIProviderError('refusal', 'Gemini blocked this response for safety reasons.');
      }
      throw new AIProviderError('network', `${this.label} request failed. Try again.`);
    }
  }
}
