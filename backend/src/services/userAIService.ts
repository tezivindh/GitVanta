import { resolveAI, getServerProviderInfo, isServerAIAvailable, ResolvedAI } from '../ai';
import { IUser } from '../types';

/** The provider to use for this user's AI request. */
export function resolveAIForUser(_user: IUser): ResolvedAI {
  return resolveAI(null);
}

export function getAIStatusForUser(_user: IUser) {
  const server = getServerProviderInfo();
  return {
    available: isServerAIAvailable(),
    source: server ? ('server' as const) : null,
    provider: server,
    message: server
      ? `AI features use ${server.label} (${server.model}).`
      : 'AI is not set up. Add your own API key in Settings → AI provider.',
  };
}
