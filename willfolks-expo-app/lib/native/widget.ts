import type { ThemeId } from "@/constants/theme";
import { getDeviceLocaleTag, t } from "@/i18n";
import type { Goal } from "@/lib/api";
import { formatClock, nextOccurrence } from "@/lib/dates";
import { WillfolksNative } from "@/modules/willfolks-native";

/** The soonest ring among the live alarm goals. */
export function nextAlarm(goals: Goal[]): Date | null {
  const times = goals
    .filter((goal) => goal.kind === "alarm" && goal.alarm && goal.status === "active" && goal.me?.status === "accepted")
    .map((goal) => nextOccurrence(goal, goal.alarm!.targetTime))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  return times[0] ?? null;
}

export function nextAlarmLabel(goals: Goal[]): string | null {
  const next = nextAlarm(goals);
  if (!next) return null;
  const weekday = next.toLocaleDateString(getDeviceLocaleTag(), { weekday: "short" });
  return `${weekday} ${formatClock(next)}`;
}

interface WidgetInput {
  theme: ThemeId;
  inEscrow: number;
  activeGoals: number;
  streak: number;
  goals: Goal[];
}

/** Pushes fresh numbers to the home-screen widget. */
export async function updateWidget({ theme, inEscrow, activeGoals, streak, goals }: WidgetInput): Promise<void> {
  if (!WillfolksNative) return;
  const alarm = nextAlarmLabel(goals);
  await WillfolksNative.updateWidget({
    theme,
    escrow: inEscrow.toFixed(2),
    streak: t("native.widget.streak", { count: streak }).toUpperCase(),
    goals: t("native.widget.goals", { count: activeGoals }).toUpperCase(),
    alarm: (alarm ? t("native.widget.alarm", { time: alarm }) : t("native.widget.noAlarm")).toUpperCase(),
  });
}

export async function requestPinWidget(): Promise<boolean> {
  return (await WillfolksNative?.requestPinWidget()) ?? false;
}
