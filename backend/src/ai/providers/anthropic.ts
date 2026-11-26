import Anthropic from '@anthropic-ai/sdk';
import { AIModelConfig, AIResponse, CompletionOptions, IAIProvider } from '../types';
import { PROVIDERS } from '../catalog';
import { AIProviderError, aiErrorFromStatus } from '../errors';

/**
 * Models that accept the server-side refusal fallback. On these, if a safety
 * classifier declines the request, the API retries it on a suitable model in
 * the same call instead of returning an empty refusal.
 */
const FALLBACK_MODELS = new Set([
  'claude-fable-5-2',
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
]);

export class AnthropicProvider implements IAIProvider {
  readonly id = 'anthropic' as const;
  readonly label = PROVIDERS.anthropic.label;
  readonly model: string;
  private readonly client: Anthropic;

  constructor(config: AIModelConfig) {
    this.model = config.model || PROVIDERS.anthropic.defaultModel;
    this.client = new Anthropic({ apiKey: config.apiKey, timeout: 120_000, maxRetries: 1 });
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<AIResponse> {
    // Temperature is not sent: current Claude models reject sampling params.
    const params = {
      model: this.model,
      max_tokens: options.maxTokens ?? 16000,
      messages: [{ role: 'user' as const, content: prompt }],
    };

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = FALLBACK_MODELS.has(this.model)
        ? await this.client.beta.messages.create({
            ...params,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
          })
        : await this.client.beta.messages.create(params);
    } catch (error) {
      throw toProviderError(error);
    }

    if (response.stop_reason === 'refusal') {
      throw new AIProviderError('refusal', 'Claude declined to answer this request.');
    }

    const content = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!content.trim()) {
      throw new AIProviderError('parse', 'Claude returned an empty response.');
    }

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}

function toProviderError(error: unknown): AIProviderError {
  const label = PROVIDERS.anthropic.label;
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AIProviderError('network', `${label} timed out. Try again.`);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AIProviderError('network', `${label} could not be reached. Try again.`);
  }
  if (error instanceof Anthropic.APIError) {
    const detail = (error.error as any)?.error?.message;
    return aiErrorFromStatus(label, error.status, detail);
  }
  return new AIProviderError('unknown', `${label} request failed.`);
}
