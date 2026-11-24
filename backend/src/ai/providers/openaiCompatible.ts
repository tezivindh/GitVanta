import { AIModelConfig, AIProviderId, AIResponse, CompletionOptions, IAIProvider } from '../types';
import { PROVIDERS } from '../catalog';
import { AIProviderError, aiErrorFromStatus } from '../errors';

const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Provider for any API that speaks the OpenAI chat-completions format:
 * OpenAI, Groq, OpenRouter, Mistral, DeepSeek, Together, and self-hosted
 * servers such as Ollama, LM Studio, vLLM or LiteLLM.
 */
export class OpenAICompatibleProvider implements IAIProvider {
  readonly id: AIProviderId;
  readonly label: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(config: AIModelConfig) {
    const info = PROVIDERS[config.provider];
    this.id = config.provider;
    this.label = info.label;
    this.model = config.model || info.defaultModel;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || info.baseUrl || '').replace(/\/+$/, '');
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 0.7;

    if (!this.baseUrl) throw new AIProviderError('bad_request', 'A base URL is required for this provider.');
    if (!this.model) throw new AIProviderError('bad_request', 'A model name is required for this provider.');
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<AIResponse> {
    const info = PROVIDERS[this.id];
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    };

    if (this.id === 'openai') {
      // Current OpenAI models take max_completion_tokens; reasoning models
      // reject a non-default temperature, so leave it at the default.
      body.max_completion_tokens = options.maxTokens ?? this.maxTokens;
    } else {
      body.max_tokens = options.maxTokens ?? this.maxTokens;
      body.temperature = this.temperature;
    }

    if (options.json && info.supportsJsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    if (this.id === 'openrouter') {
      headers['HTTP-Referer'] = process.env.FRONTEND_URL || 'https://gitvanta.app';
      headers['X-Title'] = 'GitVanta';
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: any) {
      const reason = error?.name === 'TimeoutError' ? 'timed out' : 'could not be reached';
      throw new AIProviderError('network', `${this.label} ${reason}. Check the base URL and try again.`);
    }

    if (!response.ok) {
      throw aiErrorFromStatus(this.label, response.status, await readErrorMessage(response));
    }

    const data: any = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new AIProviderError('parse', `${this.label} returned an empty response.`);
    }

    return {
      content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json?.error?.message || json?.message || json?.error || undefined;
    } catch {
      return text || undefined;
    }
  } catch {
    return undefined;
  }
}
