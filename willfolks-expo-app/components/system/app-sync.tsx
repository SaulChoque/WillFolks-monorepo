import * as Notifications from "expo-notifications";
import { Href, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";

import { useAppStore } from "@/hooks/use-app-store";
import { useSession } from "@/hooks/use-session";
import { reportAlarmResults, syncAlarms } from "@/lib/native/alarms";
import { reportMissedArrivals, syncGeofences } from "@/lib/native/location";
import { clearReminders, syncReminders } from "@/lib/native/notifications";
import { reportDevice } from "@/lib/native/permissions";
import { reportUsage } from "@/lib/native/usage";
import { updateWidget } from "@/lib/native/widget";
import { type ActiveAlarm, WillfolksNative } from "@/modules/willfolks-native";

/**
 * Keeps the three sides in step: the backend, the store and the device.
 * Renders nothing; it lives under every provider for as long as the app does.
 */
export function AppSync() {
  const router = useRouter();
  const { status, onboarded } = useSession();
  const { state, dispatch, actions } = useAppStore();
  const { goals, settings, theme, balance, activeGoals, pet, sync } = state;

  /**
   * One round of bookkeeping: tell the server what the device measured while the app
   * was away, then pull the result.
   */
  const pass = useCallback(async () => {
    await reportAlarmResults();
    const fresh = await actions.refresh();
    if (!fresh) return;
    const recorded = (await reportUsage(fresh)) + (await reportMissedArrivals(fresh));
    if (recorded) await actions.refresh();
    reportDevice().catch(() => {});
  }, [actions]);

  useEffect(() => {
    if (!onboarded) return;
    void pass();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void pass();
    });
    return () => subscription.remove();
  }, [onboarded, pass]);

  // Signing out leaves nothing behind on the device.
  useEffect(() => {
    if (status !== "signedOut") return;
    dispatch({ type: "reset" });
    syncAlarms([], false).catch(() => {});
    syncGeofences([]).catch(() => {});
    clearReminders().catch(() => {});
  }, [status, dispatch]);

  // Goals drive what the device schedules.
  useEffect(() => {
    if (!onboarded || sync !== "ready") return;
    syncAlarms(goals, settings.vibration).catch(() => {});
    syncGeofences(goals).catch(() => {});
  }, [onboarded, sync, goals, settings.vibration]);

  useEffect(() => {
    if (!onboarded || sync !== "ready") return;
    syncReminders(goals, settings.reminders).catch(() => {});
  }, [onboarded, sync, goals, settings.reminders]);

  useEffect(() => {
    if (status === "loading") return;
    updateWidget({ theme, inEscrow: balance.inEscrow, activeGoals, streak: pet.streak, goals }).catch(() => {});
  }, [status, theme, balance.inEscrow, activeGoals, pet.streak, goals]);

  // A native alarm takes over the screen, whether it started before or after the app.
  useEffect(() => {
    const native = WillfolksNative;
    if (!native || !onboarded) return;

    const show = (alarm: ActiveAlarm | null) => {
      if (!alarm) return;
      native.setShowWhenLocked(true).catch(() => {});
      dispatch({
        type: "alarm",
        alarm: {
          goalId: alarm.test ? null : alarm.id,
          title: alarm.title,
          time: alarm.time,
          stake: alarm.stake,
          total: alarm.reactionSeconds,
          firedAt: alarm.firedAt,
          phase: "ringing",
          test: alarm.test,
        },
      });
    };

    show(native.getActiveAlarm());
    const ringing = native.addListener("onAlarmRinging", show);
    const finished = native.addListener("onAlarmFinished", (event) => {
      native.setShowWhenLocked(false).catch(() => {});
      dispatch({ type: "alarmPhase", phase: event.result === "success" ? "won" : "lost" });
      if (!event.test) void pass();
    });
    const foreground = AppState.addEventListener("change", (next) => {
      if (next === "active") show(native.getActiveAlarm());
    });
    return () => {
      ringing.remove();
      finished.remove();
      foreground.remove();
    };
  }, [onboarded, dispatch, pass]);

  // Tapping a reminder opens the goal it talks about.
  const response = Notifications.useLastNotificationResponse();
  const tappedUrl = response?.notification.request.content.data?.url;
  useEffect(() => {
    if (onboarded && typeof tappedUrl === "string") router.push(tappedUrl as Href);
  }, [onboarded, tappedUrl, router]);

  return null;
}
