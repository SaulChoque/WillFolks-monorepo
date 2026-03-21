import { NativeModules, Platform } from 'react-native';

const AlarmNative = (NativeModules as any)?.AlarmModule;

export function scheduleNativeAlarm(id: string, timestampMs: number, title?: string, vibrate = true) {
  if (Platform.OS !== 'android' || !AlarmNative) return;
  try {
    AlarmNative.scheduleAlarm(id, timestampMs, title ?? 'Alarm', vibrate);
  } catch {
    // ignore
  }
}

export function cancelNativeAlarm(id: string) {
  if (Platform.OS !== 'android' || !AlarmNative) return;
  try {
    AlarmNative.cancelAlarm(id);
  } catch {
    // ignore
  }
}
