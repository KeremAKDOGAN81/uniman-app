export function parseMissedDates(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw.filter((item): item is string => typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item))
      ),
    ].sort((a, b) => b.localeCompare(a));
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return parseMissedDates(JSON.parse(raw));
  } catch {
    return [];
  }
}
