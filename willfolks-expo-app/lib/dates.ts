/** Local calendar day as yyyy-MM-dd (the format the API and the native alarms use). */
export function localDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Splits "HH:MM" into its numbers. */
export function parseTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Date carrying a "HH:MM" time, for the native time picker. */
export function timeToDate(value: string): Date {
  const { hour, minute } = parseTime(value);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** Local midnight of a yyyy-MM-dd day (new Date("yyyy-MM-dd") would be UTC). */
export function dayToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

interface Schedule {
  startDate: string;
  endDate: string;
  repeatDays: number[];
}

/** Whether a goal applies on the given local day. */
export function isScheduledOn(schedule: Schedule, date: Date): boolean {
  const day = localDate(date);
  return day >= schedule.startDate && day <= schedule.endDate && schedule.repeatDays.includes(date.getDay());
}

/** Next moment after `from` a goal's "HH:MM" falls on one of its scheduled days. */
export function nextOccurrence(schedule: Schedule, time: string, from: Date = new Date()): Date | null {
  const { hour, minute } = parseTime(time);
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = addDays(from, offset);
    candidate.setHours(hour, minute, 0, 0);
    if (candidate.getTime() > from.getTime() && isScheduledOn(schedule, candidate)) return candidate;
  }
  return null;
}
