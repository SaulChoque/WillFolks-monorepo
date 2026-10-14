import { requireOptionalNativeModule } from "expo";
import type { EventSubscription } from "expo-modules-core";

/** An alarm goal as the device needs it to ring on its own. */
export interface AlarmSpec {
  id: string;
  title: string;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Local days, yyyy-MM-dd. */
  startDate: string;
  endDate: string;
  reactionSeconds: number;
  vibrate: boolean;
  stake: number;
}

export interface ActiveAlarm {
  id: string;
  title: string;
  /** HH:MM */
  time: string;
  stake: number;
  reactionSeconds: number;
  /** Epoch ms the alarm started ringing. */
  firedAt: number;
  scheduledFor: string;
  test: boolean;
}

export interface AlarmResult {
  key: string;
  id: string;
  scheduledFor: string;
  result: "success" | "fail";
  reactionSeconds: number;
}

export interface AlarmFinishedEvent {
  id: string;
  result: "success" | "fail";
  test: boolean;
  reactionSeconds: number;
}

export interface AppUsage {
  packageName: string;
  appName: string;
  minutes: number;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
}

export interface WidgetData {
  escrow: string;
  streak: string;
  goals: string;
  alarm: string;
  theme: "acid" | "void";
}

interface WillfolksNativeModule {
  syncAlarms(specs: AlarmSpec[]): Promise<Record<string, number>>;
  scheduleTestAlarm(spec: AlarmSpec, delaySeconds: number): Promise<void>;
  getActiveAlarm(): ActiveAlarm | null;
  dismissAlarm(): Promise<boolean>;
  getAlarmResults(): AlarmResult[];
  acknowledgeAlarmResults(keys: string[]): void;
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): Promise<void>;
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): Promise<void>;
  setShowWhenLocked(enabled: boolean): Promise<void>;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): Promise<void>;
  getUsageStats(startMs: number, endMs: number): Promise<AppUsage[]>;
  getInstalledApps(): Promise<InstalledApp[]>;
  updateWidget(data: WidgetData): Promise<void>;
  requestPinWidget(): Promise<boolean>;
  addListener(event: "onAlarmRinging", listener: (alarm: ActiveAlarm) => void): EventSubscription;
  addListener(event: "onAlarmFinished", listener: (event: AlarmFinishedEvent) => void): EventSubscription;
}

/** Null on iOS, web and in Expo Go, where the Android module is not compiled in. */
export const WillfolksNative = requireOptionalNativeModule<WillfolksNativeModule>("WillfolksNative");
