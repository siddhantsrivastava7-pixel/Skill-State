export function toggleLimitedSelection(
  current: string[],
  value: string,
  limit = 5
): string[] {
  if (current.includes(value)) return current.filter((item) => item !== value);
  if (current.length >= limit) return current;
  return [...current, value];
}

export function addLimitedSelection(
  current: string[],
  value: string,
  limit = 5
): string[] {
  const trimmed = value.trim();
  if (!trimmed || current.includes(trimmed) || current.length >= limit) return current;
  return [...current, trimmed];
}
