import { Goal, UsageSample, api } from "@/lib/api";
import { addDays, isScheduledOn, localDate, startOfDay } from "@/lib/dates";
import { type AppUsage, WillfolksNative } from "@/modules/willfolks-native";

export function hasUsageAccess(): boolean {
  return WillfolksNative?.hasUsageAccess() ?? false;
}

/** Per-app foreground minutes for one local day (up to now, when the day is today). */
export async function usageOn(day: Date): Promise<AppUsage[]> {
  if (!WillfolksNative || !hasUsageAccess()) return [];
  const start = startOfDay(day);
  const end = Math.min(addDays(start, 1).getTime(), Date.now());
  return WillfolksNative.getUsageStats(start.getTime(), end);
}

export function minutesFor(usage: AppUsage[], packageName: string): number {
  return Math.floor(usage.find((app) => app.packageName === packageName)?.minutes ?? 0);
}

const toSamples = (usage: AppUsage[], day: Date): UsageSample[] =>
  usage.slice(0, 20).map((app) => ({
    appPackage: app.packageName,
    appName: app.appName.slice(0, 80),
    usageDate: localDate(day),
    foregroundMinutes: Math.min(1440, Math.floor(app.minutes)),
  }));

/** Days whose final usage was already sent this session, per goal. */
const settledDays = new Map<string, string>();

/**
 * Judges app-timer goals from real usage and uploads the daily samples.
 * Today only counts once the limit is broken (it can still be broken later);
 * yesterday is final either way. Returns how many verdicts were recorded.
 */
export async function reportUsage(goals: Goal[]): Promise<number> {
  if (!hasUsageAccess()) return 0;
  const now = new Date();
  const yesterday = addDays(now, -1);
  const [today, previous] = await Promise.all([usageOn(now), usageOn(yesterday)]);

  api.reportUsage([...toSamples(today, now), ...toSamples(previous, yesterday)]).catch(() => {});

  let recorded = 0;
  for (const goal of goals) {
    if (goal.kind !== "appTimer" || !goal.appTimer || goal.status !== "active" || goal.me?.status !== "accepted") continue;
    const { appPackage, maxDailyMinutes } = goal.appTimer;
    const last = goal.progress.lastCheckin?.scheduledFor ?? "";

    const post = async (day: Date, minutes: number) => {
      try {
        await api.checkin(goal.id, { source: "usage", scheduledFor: localDate(day), measuredValue: minutes });
        recorded++;
      } catch {
        // Offline or the goal just closed: the next foreground tries again.
      }
    };

    const yesterdayKey = localDate(yesterday);
    if (isScheduledOn(goal, yesterday) && last < yesterdayKey && settledDays.get(goal.id) !== yesterdayKey) {
      settledDays.set(goal.id, yesterdayKey);
      await post(yesterday, minutesFor(previous, appPackage));
    }

    const usedToday = minutesFor(today, appPackage);
    const failedToday = last === localDate(now) && goal.progress.lastCheckin?.result === "fail";
    if (isScheduledOn(goal, now) && usedToday > maxDailyMinutes && !failedToday) await post(now, usedToday);
  }
  return recorded;
}
