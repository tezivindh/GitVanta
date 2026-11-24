/**
 * Pull a JSON value out of a model response. Handles code fences and
 * leading/trailing prose that some models add despite instructions.
 */
export function extractJson<T>(raw: string): T {
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  try {
    return JSON.parse(text) as T;
  } catch {
    // Fall back to the outermost object or array in the text.
  }

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
