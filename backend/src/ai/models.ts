import Anthropic from '@anthropic-ai/sdk';
import { AIModelConfig } from './types';
import { PROVIDERS } from './catalog';
import { AIProviderError, aiErrorFromStatus } from './errors';

const TIMEOUT_MS = 15_000;
/** Models that can't do chat completions (speech, images, embeddings, guards). */
const NON_CHAT = /whisper|tts|orpheus|transcri|speech|audio|embed|moderation|guard|dall-e|image|rerank/i;
const MAX_MODELS = 300;

/**
 * Ask the provider which models this key can use. Catalog defaults go stale
 * (providers retire models), so the settings UI offers the live list.
 */
export async function listModels(config: AIModelConfig): Promise<string[]> {
  const info = PROVIDERS[config.provider];
  const label = info.label;

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
    try {
      const ids: string[] = [];
      for await (const model of client.models.list()) {
        ids.push(model.id);
        if (ids.length >= MAX_MODELS) break;
      }
      return ids;
    } catch (error) {
      if (error instanceof Anthropic.APIError) throw aiErrorFromStatus(label, error.status);
      throw new AIProviderError('network', `${label} could not be reached.`);
    }
  }

  if (config.provider === 'gemini') {
    const data = await getJson(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
      { 'x-goog-api-key': config.apiKey },
      label
    );
    return (data?.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .slice(0, MAX_MODELS);
  }

  // OpenAI-compatible: GET {baseUrl}/models
  const baseUrl = (config.baseUrl || info.baseUrl || '').replace(/\/+$/, '');
  const headers: Record<string, string> = {};
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  const data = await getJson(`${baseUrl}/models`, headers, label);
  const items: any[] = Array.isArray(data) ? data : data?.data ?? data?.models ?? [];
  return items
    .map((m) => (typeof m === 'string' ? m : m?.id ?? m?.name))
    .filter((id): id is string => typeof id === 'string' && id.length > 0 && !NON_CHAT.test(id))
    .sort()
    .slice(0, MAX_MODELS);
}

async function getJson(url: string, headers: Record<string, string>, label: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'error',
    });
  } catch {
    throw new AIProviderError('network', `${label} could not be reached. Check the base URL.`);
  }
  if (!response.ok) throw aiErrorFromStatus(label, response.status);
  return response.json().catch(() => {
    throw new AIProviderError('parse', `${label} returned an unexpected model list.`);
  });
}
