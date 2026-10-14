import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { t } from "@/i18n";
import type { Goal } from "@/lib/api";
import { parseTime } from "@/lib/dates";

const REMINDERS = "reminders";
const RESULTS = "results";

// Show banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function notificationsGranted(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestNotifications(): Promise<boolean> {
  await ensureChannels();
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDERS, {
    name: t("native.channels.reminders"),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(RESULTS, {
    name: t("native.channels.results"),
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Posts a notification right away (a verdict, a locked stake…). */
export async function notifyNow(title: string, body: string, goalId?: string): Promise<void> {
  if (!(await notificationsGranted())) return;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: goalId ? { url: `/activity/${goalId}` } : {} },
    trigger: Platform.OS === "android" ? { channelId: RESULTS } : null,
  });
}

/** When, and with what words, each kind of goal nudges the user on its days. */
function reminderFor(goal: Goal): { hour: number; minute: number; dayShift: number; body: string } | null {
  if (goal.kind === "alarm" && goal.alarm) {
    // The evening before, while there is still time to go to bed early.
    return { hour: 21, minute: 0, dayShift: -1, body: t("native.reminders.alarm", { time: goal.alarm.targetTime, amount: goal.stakeAmount }) };
  }
  if (goal.kind === "appTimer" && goal.appTimer) {
    return { hour: 12, minute: 0, dayShift: 0, body: t("native.reminders.appTimer", { app: goal.appTimer.appName, minutes: goal.appTimer.maxDailyMinutes }) };
  }
  if (goal.kind === "locator" && goal.location) {
    const { hour, minute } = parseTime(goal.location.arriveBy);
    const lead = new Date(2000, 0, 1, hour, minute - 30);
    // A deadline before 00:30 would put the reminder on the previous day.
    const dayShift = lead.getDate() === 1 ? 0 : -1;
    return { hour: lead.getHours(), minute: lead.getMinutes(), dayShift, body: t("native.reminders.locator", { place: goal.location.placeLabel, time: goal.location.arriveBy }) };
  }
  if (goal.kind === "ai") {
    return { hour: 18, minute: 0, dayShift: 0, body: t("native.reminders.ai", { amount: goal.stakeAmount }) };
  }
  return null;
}

/**
 * Rebuilds the weekly local reminders from the live goals. They are scheduled on the
 * device, so they fire with no network and with the app closed.
 */
export async function syncReminders(goals: Goal[], enabled: boolean): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled || !(await notificationsGranted())) return;
  await ensureChannels();

  for (const goal of goals) {
    if (goal.status !== "active" || goal.me?.status !== "accepted" || !goal.notificationsEnabled) continue;
    const reminder = reminderFor(goal);
    if (!reminder) continue;
    for (const day of goal.repeatDays) {
      await Notifications.scheduleNotificationAsync({
        content: { title: goal.title, body: reminder.body, data: { url: `/activity/${goal.id}` } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: REMINDERS,
          // Expo counts week days from 1 = Sunday.
          weekday: ((day + reminder.dayShift + 7) % 7) + 1,
          hour: reminder.hour,
          minute: reminder.minute,
        },
      });
    }
  }
}

export async function clearReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
