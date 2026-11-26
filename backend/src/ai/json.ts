/**
 * Pull a JSON value out of a model response. Handles code fences and
 * leading/trailing prose that some models add despite instructions.
 *
 * Order matters: the response is parsed as-is first. JSON values often contain
 * Markdown with its own code fences (a README rewrite almost always does), so
 * looking for a fence first would cut a snippet out of the middle of a string.
 */
export function extractJson<T>(raw: string): T {
  const text = raw.trim();

  const direct = tryParse<T>(text);
  if (direct.ok) return direct.value;

  // The whole response wrapped in a fence: ```json { ... } ```
  const wrapped = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (wrapped) {
    const inner = tryParse<T>(wrapped[1]);
    if (inner.ok) return inner.value;
  }

  // Prose around the value: take the outermost object or array.
  const starts = ['{', '[']
    .map((c) => text.indexOf(c))
    .filter((i) => i >= 0);
  if (starts.length === 0) throw new Error('No JSON found in AI response');
  const start = Math.min(...starts);
  const close = text[start] === '{' ? '}' : ']';
  const end = text.lastIndexOf(close);
  if (end <= start) throw new Error('No JSON found in AI response');

  return JSON.parse(text.slice(start, end + 1)) as T;
}

function tryParse<T>(text: string): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false };
  }
}
