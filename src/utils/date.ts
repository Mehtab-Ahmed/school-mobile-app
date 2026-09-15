/**
 * A date as YYYY-MM-DD in the phone's own time zone. `toISOString()` converts to
 * UTC first, which in India turns any time before 5:30 a.m. into yesterday and
 * shifts month ranges by a day.
 */
export function localIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True once a YYYY-MM-DD due date has fully passed (due today is not overdue). */
export function isPastDue(dueDate?: string | null): boolean {
  return !!dueDate && dueDate.slice(0, 10) < localIsoDate();
}
