import { getApiError, ApiErrorInfo } from '../api/client';
import { toast } from '../store/toastStore';

/** Error codes that the user fixes in Settings → AI provider. */
const AI_SETTINGS_CODES = new Set(['AI_NOT_CONFIGURED', 'AI_AUTH', 'AI_NOT_FOUND', 'KEY_DECRYPT_FAILED']);

export function needsAISettings(info: Pick<ApiErrorInfo, 'code'>): boolean {
  return !!info.code && AI_SETTINGS_CODES.has(info.code);
}

/** Show an error toast and return the parsed error for inline display. */
export async function reportError(error: unknown, title: string, fallback?: string): Promise<ApiErrorInfo> {
  const info = await getApiError(error, fallback);
  toast.error(
    title,
    info.message,
    needsAISettings(info) ? { label: 'Open AI settings', href: '/dashboard/settings#ai-provider' } : undefined
  );
  return info;
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
