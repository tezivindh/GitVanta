import crypto from 'crypto';
import { AppError } from './errors';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION = 'v1';

let cachedKey: Buffer | null | undefined;

/**
 * ENCRYPTION_KEY must decode to exactly 32 bytes. Accepts 64 hex chars or
 * base64. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return (cachedKey = null);

  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) key = Buffer.from(raw, 'hex');
  else key = Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters or 44 base64 characters).');
  }
  return (cachedKey = key);
}

export function isEncryptionConfigured(): boolean {
  try {
    return getKey() !== null;
  } catch {
    return false;
  }
}

function requireKey(): Buffer {
  const key = getKey();
  if (!key) {
    throw new AppError(
      'Saving personal API keys is not enabled on this server (ENCRYPTION_KEY is not set).',
      503,
      'ENCRYPTION_NOT_CONFIGURED'
    );
  }
  return key;
}

/**
 * Encrypt with AES-256-GCM. `context` (the user id) is bound as associated
 * data, so a ciphertext copied onto another user's record will not decrypt.
 * Output: v1:<iv>:<tag>:<ciphertext>, each part base64.
 */
export function encryptSecret(plaintext: string, context: string): string {
  const key = requireKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(context, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decryptSecret(payload: string, context: string): string {
  const key = requireKey();
  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new AppError('Stored API key is unreadable. Please save it again.', 500, 'KEY_DECRYPT_FAILED');
  }
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAAD(Buffer.from(context, 'utf8'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    // Wrong ENCRYPTION_KEY, tampered data, or a record moved between users.
    throw new AppError(
      'Your saved API key could not be decrypted. Please save it again in Settings.',
      500,
      'KEY_DECRYPT_FAILED'
    );
  }
}

/** "sk-proj-abc…a1b2". Never reveals more than the first few and last 4 chars. */
export function maskSecret(secret: string): string {
  const s = secret.trim();
  if (s.length <= 8) return '••••';
  const prefixMatch = s.match(/^([a-zA-Z]{2,4}[-_](?:[a-zA-Z]{2,5}[-_])?)/);
  const prefix = prefixMatch ? prefixMatch[1] : s.slice(0, 3);
  return `${prefix}…${s.slice(-4)}`;
}
