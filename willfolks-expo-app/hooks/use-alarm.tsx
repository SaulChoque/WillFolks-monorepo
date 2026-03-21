import { activitiesMock } from '@/constants/mock-data';
import type { HomeActivity } from '@/types/home';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type ActiveAlarm = HomeActivity | null;

interface ScheduledEntry {
  id: string;
  timeoutId: number | null;
}

export default function useAlarm() {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm>(null);
  const scheduled = useRef<Record<string, ScheduledEntry>>({});
  const AlarmNative = (NativeModules as any).AlarmModule;

  const requestNotificationPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const apiLevel = Platform.constants?.Version ?? 0;
      // Android 13 (API 33) requires POST_NOTIFICATIONS at runtime
      if (apiLevel >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        // We don't strictly need the permission to vibrate/play audio inside the app,
        // but the permission helps for showing notifications if we implement them.
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (e) {
      // ignore
    }
    return true;
  }, []);

  useEffect(() => {
    // Request notification permission once on mount
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    // schedule alarms for activitiesMock (only those with future time)
    const now = Date.now();
    activitiesMock.forEach((activity) => {
      if (activity.type !== 'alarm') return;
      const alarmTime = Date.parse(activity.alarmSettings.alarmTime);
      if (Number.isNaN(alarmTime)) return;
      const ms = alarmTime - now;
      if (ms <= 0) return;

      // If native AlarmModule is available on Android, delegate scheduling to native
      if (Platform.OS === 'android' && AlarmNative && AlarmNative.scheduleAlarm) {
        try {
          AlarmNative.scheduleAlarm(activity.id, alarmTime, activity.title ?? "Alarm", activity.alarmSettings.vibrationEnabled ?? true);
        } catch {
          // fallback to JS timer if native scheduling fails
        }
        return;
      }

      // fallback JS scheduling (in-app)
      const maxMs = 1000 * 60 * 60 * 24 * 7;
      if (ms > maxMs) return;
      if (scheduled.current[activity.id]) return; // already scheduled
      const id = setTimeout(() => {
        setActiveAlarm(activity);
        scheduled.current[activity.id].timeoutId = null;
      }, ms) as unknown as number;
      scheduled.current[activity.id] = { id: activity.id, timeoutId: id };
    });

    return () => {
      // clear timeouts on unmount
      Object.values(scheduled.current).forEach((entry) => {
        if (entry.timeoutId) clearTimeout(entry.timeoutId);
      });
      scheduled.current = {};
    };
  }, [AlarmNative]);

  const stop = useCallback(() => {
    setActiveAlarm(null);
    // cancel native alarm if available
    if (Platform.OS === 'android' && AlarmNative) {
      try {
        AlarmNative.cancelAlarm(activeAlarm?.id ?? '');
      } catch {}
    }
  }, [AlarmNative, activeAlarm?.id]);

  const snooze = useCallback(() => {
    if (!activeAlarm) return;
    // stop current alarm and schedule 5 minutes later
    const snoozeMs = 5 * 60 * 1000;
    setActiveAlarm(null);
    // If native module exists, schedule native snooze
    if (Platform.OS === 'android' && AlarmNative && AlarmNative.scheduleAlarm) {
      try {
        const newTime = Date.now() + snoozeMs;
        AlarmNative.scheduleAlarm(activeAlarm.id, newTime, activeAlarm.title ?? 'Alarm', activeAlarm.alarmSettings.vibrationEnabled ?? true);
        return;
      } catch {
          // fallback to JS timer
        }
    }

    const id = setTimeout(() => {
      setActiveAlarm(activeAlarm);
    }, snoozeMs) as unknown as number;
    scheduled.current[activeAlarm.id] = { id: activeAlarm.id, timeoutId: id };
  }, [activeAlarm, AlarmNative]);

  return { activeAlarm, stop, snooze };
}
