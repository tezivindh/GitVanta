import { AIProviderId } from './types';

export interface ProviderInfo {
  id: AIProviderId;
  label: string;
  description: string;
  /** Suggested models. Users can always type any other model ID. */
  models: string[];
  defaultModel: string;
  /** Base URL for OpenAI-compatible providers. */
  baseUrl?: string;
  /** True when the user must supply the base URL themselves. */
  requiresBaseUrl?: boolean;
  /** False for local servers such as Ollama that don't need a key. */
  requiresKey: boolean;
  keyPlaceholder: string;
  keyUrl?: string;
  /** Uses the OpenAI chat-completions wire format. */
  openAICompatible: boolean;
  /** Supports `response_format: { type: 'json_object' }`. */
  supportsJsonMode?: boolean;
}

export const PROVIDERS: Record<AIProviderId, ProviderInfo> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT models from OpenAI.',
    models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'],
    defaultModel: 'gpt-4.1-mini',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    openAICompatible: true,
    supportsJsonMode: true,
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Claude models from Anthropic.',
    models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-2'],
    defaultModel: 'claude-opus-5-5',
    requiresKey: true,
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    openAICompatible: false,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini models from Google AI Studio.',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    defaultModel: 'gemini-2.5-flash',
    requiresKey: true,
    keyPlaceholder: 'AIza...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    openAICompatible: false,
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    description: 'Very fast open-weight models hosted by Groq.',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    defaultModel: 'openai/gpt-oss-120b',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    keyPlaceholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
    openAICompatible: true,
    supportsJsonMode: true,
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'One key for hundreds of models from many vendors.',
    models: [
      'openai/gpt-4.1-mini',
      'anthropic/claude-sonnet-5.5',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    defaultModel: 'openai/gpt-4.1-mini',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    keyPlaceholder: 'sk-or-...',
    keyUrl: 'https://openrouter.ai/keys',
    openAICompatible: true,
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    description: 'Mistral AI models.',
    models: ['mistral-large-latest', 'mistral-small-latest'],
    defaultModel: 'mistral-small-latest',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    keyPlaceholder: 'Your Mistral API key',
    keyUrl: 'https://console.mistral.ai/api-keys',
    openAICompatible: true,
    supportsJsonMode: true,
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    description: 'DeepSeek chat and reasoning models.',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    openAICompatible: true,
    supportsJsonMode: true,
  },
  together: {
    id: 'together',
    label: 'Together AI',
    description: 'Open models hosted by Together AI.',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    baseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    keyPlaceholder: 'Your Together API key',
    keyUrl: 'https://api.together.ai/settings/api-keys',
    openAICompatible: true,
  },
  custom: {
    id: 'custom',
    label: 'OpenAI-compatible (custom URL)',
    description:
      'Any server that speaks the OpenAI API: Ollama, LM Studio, vLLM, LiteLLM and more.',
    models: [],
    defaultModel: '',
    requiresBaseUrl: true,
    requiresKey: false,
    keyPlaceholder: 'Optional for local servers',
    openAICompatible: true,
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as AIProviderId[];

export function isProviderId(value: unknown): value is AIProviderId {
  return typeof value === 'string' && value in PROVIDERS;
}

/** Public catalog for the settings UI. */
export function getProviderCatalog() {
  return PROVIDER_IDS.map((id) => {
    const p = PROVIDERS[id];
    return {
      id: p.id,
      label: p.label,
      description: p.description,
      models: p.models,
      defaultModel: p.defaultModel,
      baseUrl: p.baseUrl ?? null,
      requiresBaseUrl: !!p.requiresBaseUrl,
      requiresKey: p.requiresKey,
      keyPlaceholder: p.keyPlaceholder,
      keyUrl: p.keyUrl ?? null,
    };
  });
}
