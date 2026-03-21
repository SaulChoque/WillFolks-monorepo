import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type ActivityAmountKind = 'credit' | 'debit' | 'neutral';

export interface DaySelection {
  id: string;
  label: string;
  isActive: boolean;
}

export interface ActivitySchedule {
  start: string;
  end: string;
}

export interface AlarmSettings {
  alarmTime: string;
  musicTitle: string;
  vibrationEnabled: boolean;
}

export interface TimerSettings {
  appId: string;
  appName: string;
  maxDailyMinutes: number;
}

interface ActivityBase {
  id: string;
  title: string;
  repeatLabel: string;
  summaryLabel: string;
  amountLabel: string;
  amountKind: ActivityAmountKind;
  iconName: MaterialIconName;
  days: DaySelection[];
  isActive: boolean;
  notificationsEnabled: boolean;
  schedule: ActivitySchedule;
}

export type Activity =
  | (ActivityBase & {
      type: 'alarm';
      alarmSettings: AlarmSettings;
    })
  | (ActivityBase & {
      type: 'timer';
      timerSettings: TimerSettings;
    });

export type HomeActivity = Activity;

export interface ActivityDraftState extends ActivityBase {
  type: 'alarm' | 'timer';
  alarmSettings: AlarmSettings;
  timerSettings: TimerSettings;
}
