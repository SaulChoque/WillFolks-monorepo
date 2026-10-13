import { ApiError, Goal, api } from "@/lib/api";
import { parseTime } from "@/lib/dates";
import { type AlarmSpec, WillfolksNative } from "@/modules/willfolks-native";

/** The goals that must ring on this device: live alarm goals the user has a stake in. */
function liveAlarmGoals(goals: Goal[]): Goal[] {
  return goals.filter((goal) => goal.kind === "alarm" && goal.alarm && goal.status === "active" && goal.me?.status === "accepted");
}

function toSpec(goal: Goal, vibration: boolean): AlarmSpec {
  const { hour, minute } = parseTime(goal.alarm!.targetTime);
  return {
    id: goal.id,
    title: goal.title,
    hour,
    minute,
    days: goal.repeatDays,
    startDate: goal.startDate,
    endDate: goal.endDate,
    reactionSeconds: goal.alarm!.reactionSeconds,
    // The global "alarm vibration" setting can silence the motor for every goal.
    vibrate: vibration && goal.alarm!.vibrationEnabled,
    stake: goal.me?.stakeAmount ?? goal.stakeAmount,
  };
}

/** Hands the current alarm goals to AlarmManager, replacing whatever was scheduled. */
export async function syncAlarms(goals: Goal[], vibration: boolean): Promise<void> {
  if (!WillfolksNative) return;
  await WillfolksNative.syncAlarms(liveAlarmGoals(goals).map((goal) => toSpec(goal, vibration)));
}

/** Rings a throwaway copy of the goal's alarm a few seconds from now. */
export async function scheduleTestAlarm(goal: Goal, vibration: boolean, delaySeconds = 3): Promise<boolean> {
  if (!WillfolksNative) return false;
  await WillfolksNative.scheduleTestAlarm({ ...toSpec(goal, vibration), id: `test-${goal.id}`, reactionSeconds: 20 }, delaySeconds);
  return true;
}

/**
 * Reports to the backend how alarms ended while the app was not looking.
 * Results stay on the device until the server has them, so nothing is lost offline.
 */
export async function reportAlarmResults(): Promise<number> {
  if (!WillfolksNative) return 0;
  const settled: string[] = [];
  for (const result of WillfolksNative.getAlarmResults()) {
    try {
      await api.checkin(result.id, {
        source: "alarm",
        result: result.result,
        scheduledFor: result.scheduledFor,
        measuredValue: result.reactionSeconds,
        measuredUnit: "seconds",
      });
      settled.push(result.key);
    } catch (error) {
      // The server said no (goal gone, paused, out of dates): retrying will not help.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401) {
        settled.push(result.key);
      }
    }
  }
  if (settled.length) WillfolksNative.acknowledgeAlarmResults(settled);
  return settled.length;
}
