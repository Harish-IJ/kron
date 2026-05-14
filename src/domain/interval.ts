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
  if (intervalDays <= 0) return -1;
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

// Returns every date from startDate..asOf that falls on one of the selected weekdays.
// weekdays: 0=Mon, 1=Tue, ..., 6=Sun
export function getScheduledWeekdayDates(
  startDate: string,
  weekdays: number[],
  asOf: Date
): string[] {
  if (weekdays.length === 0) return [];
  // Map 0=Mon..6=Sun to JS getDay() values (0=Sun..6=Sat)
  const jsWeekdays = weekdays.map(d => (d + 1) % 7);
  const today = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const result: string[] = [];
  const d = parseLocalDate(startDate);
  while (d <= today) {
    if (jsWeekdays.includes(d.getDay())) {
      result.push(toLocalDateString(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return result;
}

// Returns every occurrence of the selected month-dates from startDate..asOf.
// monthDates: 1-31; invalid dates for a given month (e.g. Feb 30) are skipped.
export function getScheduledMonthDates(
  startDate: string,
  monthDates: number[],
  asOf: Date
): string[] {
  if (monthDates.length === 0) return [];
  const today = toLocalDateString(asOf);
  const sorted = [...monthDates].sort((a, b) => a - b);
  const result: string[] = [];
  const start = parseLocalDate(startDate);
  let year = start.getFullYear();
  let month = start.getMonth(); // 0-indexed

  while (true) {
    const firstOfMonth = toLocalDateString(new Date(year, month, 1));
    if (firstOfMonth > today) break;

    for (const d of sorted) {
      const date = new Date(year, month, d);
      if (date.getDate() !== d) continue; // invalid date (e.g. Feb 30)
      const dateStr = toLocalDateString(date);
      if (dateStr < startDate) continue;
      if (dateStr > today) continue;
      result.push(dateStr);
    }

    month++;
    if (month > 11) { month = 0; year++; }
  }

  return result;
}
