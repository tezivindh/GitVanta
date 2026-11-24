import { AppError } from '../utils/errors';

export type AIErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'not_found'
  | 'bad_request'
  | 'refusal'
  | 'network'
  | 'parse'
  | 'unknown';

/**
 * Error raised by an AI provider. The message is safe to show to the user:
 * it never contains the API key.
 */
export class AIProviderError extends AppError {
  public kind: AIErrorKind;

  constructor(kind: AIErrorKind, message: string) {
    const status =
      kind === 'auth' || kind === 'bad_request' || kind === 'not_found'
        ? 400
        : kind === 'rate_limit'
          ? 429
          : 502;
    super(message, status, `AI_${kind.toUpperCase()}`);
    this.kind = kind;
  }
}

export function aiErrorFromStatus(
  label: string,
  status: number | undefined,
  detail?: string
): AIProviderError {
  const suffix = detail ? ` (${truncate(detail, 200)})` : '';
  switch (status) {
    case 401:
    case 403:
      return new AIProviderError(
        'auth',
        `${label} rejected the API key. Check the key in Settings → AI provider.${suffix}`
      );
    case 404:
      return new AIProviderError(
        'not_found',
        `${label} could not find that model or endpoint. Check the model name and base URL.${suffix}`
      );
    case 429:
      return new AIProviderError(
        'rate_limit',
        `${label} rate limit or quota reached. Try again shortly or check your plan.${suffix}`
      );
    case 400:
    case 422:
      return new AIProviderError('bad_request', `${label} rejected the request.${suffix}`);
    default:
      return new AIProviderError(
        'unknown',
        `${label} returned an error${status ? ` (HTTP ${status})` : ''}.${suffix}`
      );
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
