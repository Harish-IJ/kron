export function parseLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(from: string, to: string): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function getBucketIndex(
  startDate: string,
  logLocalDate: string,
  intervalDays: number
): number {
  const days = daysBetween(startDate, logLocalDate);
  if (days < 0) return -1;
  return Math.floor(days / intervalDays);
}

export function getBucketBounds(
  startDate: string,
  bucketIndex: number,
  intervalDays: number
): { start: string; end: string } {
  const origin = parseLocalDate(startDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const startMs = origin.getTime() + bucketIndex * intervalDays * msPerDay;
  const endMs = startMs + (intervalDays - 1) * msPerDay;
  return {
    start: toLocalDateString(new Date(startMs)),
    end: toLocalDateString(new Date(endMs)),
  };
}

export function getCurrentBucketIndex(
  startDate: string,
  intervalDays: number,
  asOf: Date
): number {
  const localToday = toLocalDateString(asOf);
  return getBucketIndex(startDate, localToday, intervalDays);
}
