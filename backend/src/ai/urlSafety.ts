import dns from 'dns/promises';
import net from 'net';
import { AIProviderError } from './errors';

/**
 * Whether user-supplied base URLs may point at private/loopback addresses.
 * Needed for Ollama / LM Studio on localhost, but on a shared server it
 * would let any user make the API call internal services (SSRF), so it is
 * off by default in production.
 */
export function privateAIUrlsAllowed(): boolean {
  const flag = process.env.ALLOW_PRIVATE_AI_URLS;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast / reserved
  );
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateIPv4(v6.slice(7));
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') || // unique local
    v6.startsWith('fe8') ||
    v6.startsWith('fe9') ||
    v6.startsWith('fea') ||
    v6.startsWith('feb') // link-local
  );
}

/** Validate a user-supplied base URL. Returns the normalised URL. */
export async function assertSafeBaseUrl(raw: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new AIProviderError('bad_request', 'Base URL is not a valid URL.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AIProviderError('bad_request', 'Base URL must start with http:// or https://.');
  }
  if (url.username || url.password) {
    throw new AIProviderError('bad_request', 'Put the API key in the key field, not in the URL.');
  }

  const allowPrivate = privateAIUrlsAllowed();
  if (!allowPrivate && url.protocol !== 'https:') {
    throw new AIProviderError('bad_request', 'Base URL must use https://.');
  }

  if (!allowPrivate) {
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
      throw new AIProviderError(
        'bad_request',
        'Local and private addresses are not allowed on this server. Use a publicly reachable URL.'
      );
    }
    let addresses: string[];
    try {
      addresses = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((a) => a.address);
    } catch {
      throw new AIProviderError('network', `Could not resolve ${host}. Check the base URL.`);
    }
    if (addresses.some(isPrivateIP)) {
      throw new AIProviderError(
        'bad_request',
        'Local and private addresses are not allowed on this server. Use a publicly reachable URL.'
      );
    }
  }

  return url.toString().replace(/\/+$/, '');
}
