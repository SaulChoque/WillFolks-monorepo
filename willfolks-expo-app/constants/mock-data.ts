import { t } from '@/i18n';
import { AccountInfo } from '@/types/account';
import { Activity, ActivityDraftState, ActivitySchedule, DaySelection } from '@/types/home';

export interface FriendTimeZone {
  id: string;
  city: string;
  timeZone: string;
  differenceLabel: string;
  isHighlighted?: boolean;
}

export interface InstalledApp {
  id: string;
  name: string;
  iconName: string;
}

const DAY_TEMPLATE: Pick<DaySelection, 'id' | 'label'>[] = [
  { id: 'mon', label: t('days.monShort') },
  { id: 'tue', label: t('days.tueShort') },
  { id: 'wed', label: t('days.wedShort') },
  { id: 'thu', label: t('days.thuShort') },
  { id: 'fri', label: t('days.friShort') },
  { id: 'sat', label: t('days.satShort') },
  { id: 'sun', label: t('days.sunShort') },
];

const buildDaySelection = (activeIds: string[]): DaySelection[] =>
  DAY_TEMPLATE.map((day) => ({
    ...day,
    isActive: activeIds.includes(day.id),
  }));

const buildSchedule = (start: string, end: string): ActivitySchedule => ({ start, end });

export const friendTimeZones: FriendTimeZone[] = [
  {
    id: 'cdmx',
    city: 'Ciudad de México',
    timeZone: 'America/Mexico_City',
    differenceLabel: t('time.localTime'),
    isHighlighted: true,
  },
  {
    id: 'buenos-aires',
    city: 'Buenos Aires',
    timeZone: 'America/Argentina/Buenos_Aires',
    differenceLabel: t('mock.differencePlus', { count: 1 }),
  },
  {
    id: 'xela',
    city: 'Xela',
    timeZone: 'America/Guatemala',
    differenceLabel: t('mock.differenceMinus', { count: 2 }),
  },
  {
    id: 'asuncion',
    city: 'Asunción',
    timeZone: 'America/Asuncion',
    differenceLabel: t('mock.differencePlus', { count: 0 }),
  },
];

export const installedApps: InstalledApp[] = [
  { id: 'facebook', name: 'Facebook', iconName: 'public' },
  { id: 'instagram', name: 'Instagram', iconName: 'camera-alt' },
  { id: 'reddit', name: 'Reddit', iconName: 'chat' },
  { id: 'x', name: 'X', iconName: 'alternate-email' },
];

export const activitiesMock: Activity[] = [
  {
    id: 'missed-alarm',
    title: t('mock.titles.missedAlarm'),
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '07:41',
    amountLabel: '-2 USDC',
    amountKind: 'debit',
    iconName: 'alarm',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-10-23T06:30:00', '2025-11-12T15:45:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-10-23T07:41:00',
      musicTitle: t('mock.music.morningVibes'),
      vibrationEnabled: true,
    },
  },
  {
    id: 'instagram-limit',
    title: 'Instagram',
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '3 hrs',
    amountLabel: '-0 USDC',
    amountKind: 'neutral',
    iconName: 'apps',
    days: buildDaySelection(['mon', 'tue', 'wed']),
    isActive: false,
    notificationsEnabled: false,
    schedule: buildSchedule('2025-10-15T09:20:00', '2025-10-15T12:20:00'),
    type: 'timer',
    timerSettings: {
      appId: 'instagram',
      appName: 'Instagram',
      maxDailyMinutes: 180,
    },
  },
  {
    id: 'finish-test',
    title: t('mock.titles.finishTestFirst'),
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '15:41',
    amountLabel: '+5 USDC',
    amountKind: 'credit',
    iconName: 'check-circle',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-09-08T08:00:00', '2025-09-08T15:41:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-09-08T15:41:00',
      musicTitle: t('mock.music.focusPlaylist'),
      vibrationEnabled: true,
    },
  },
  {
    id: 'wake-uppp',
    title: t('mock.titles.wakeUppp'),
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '06:30',
    amountLabel: '5 USDC',
    amountKind: 'credit',
    iconName: 'alarm',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-10-23T06:30:00', '2025-11-12T15:45:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-10-23T06:30:00',
      musicTitle: t('mock.music.favorites'),
      vibrationEnabled: true,
    },
  },
  {
    id: 'reddit-timer',
    title: t('mock.titles.redditTimer'),
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '2 hrs',
    amountLabel: '5 USDC',
    amountKind: 'neutral',
    iconName: 'timer',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-10-23T10:30:00', '2025-11-12T15:45:00'),
    type: 'timer',
    timerSettings: {
      appId: 'reddit',
      appName: 'Reddit',
      maxDailyMinutes: 120,
    },
  },
  {
    id: 'alarm-0615',
    title: '06:15',
    repeatLabel: t('days.workWeekLabel'),
    summaryLabel: '06:15',
    amountLabel: '0 USDC',
    amountKind: 'neutral',
    iconName: 'alarm',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-10-24T06:15:00', '2025-10-24T06:15:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-10-24T06:15:00',
      musicTitle: t('mock.music.default'),
      vibrationEnabled: false,
    },
  },
  {
    id: 'alarm-0630',
    title: '06:30',
    repeatLabel: t('days.workWeekLabel'),
    summaryLabel: '06:30',
    amountLabel: '0 USDC',
    amountKind: 'neutral',
    iconName: 'alarm',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule('2025-10-24T06:30:00', '2025-10-24T06:30:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-10-24T06:30:00',
      musicTitle: t('mock.music.default'),
      vibrationEnabled: false,
    },
  },
  {
    id: 'alarm-0645',
    title: '06:45',
    repeatLabel: t('days.workWeekLabel'),
    summaryLabel: '06:45',
    amountLabel: '0 USDC',
    amountKind: 'neutral',
    iconName: 'alarm',
    days: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    isActive: false,
    notificationsEnabled: false,
    schedule: buildSchedule('2025-10-24T06:45:00', '2025-10-24T06:45:00'),
    type: 'alarm',
    alarmSettings: {
      alarmTime: '2025-10-24T06:45:00',
      musicTitle: t('mock.music.default'),
      vibrationEnabled: false,
    },
  },
];

export const dashboardActivityIds = ['missed-alarm', 'instagram-limit', 'finish-test'];

export function createEmptyActivityDraft(): ActivityDraftState {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    id: `draft-${now.getTime()}`,
    title: t('activities.newActivity'),
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '--:--',
    amountLabel: '0 USDC',
    amountKind: 'neutral',
    iconName: 'alarm',
    days: buildDaySelection([]),
    isActive: true,
    notificationsEnabled: true,
    schedule: buildSchedule(now.toISOString(), oneHourLater.toISOString()),
    type: 'alarm',
    alarmSettings: {
      alarmTime: now.toISOString(),
      musicTitle: t('activity.selectAudio'),
      vibrationEnabled: true,
    },
    timerSettings: {
      appId: installedApps[0].id,
      appName: installedApps[0].name,
      maxDailyMinutes: 60,
    },
  };
}

export const accountInfo: AccountInfo = {
  id: 'baluchop',
  displayName: 'Baluchop',
  username: '@baluchop',
  dateOfInvitation: '15/06',
  chain: 'Fuji Testnet',
  totalTransacted: '+6/-5 USDC',
  generalScore: '5/3',
  location: 'CDMX, 11:41',
  numberOfFriends: 15,
  goalsAchieved: 5,
  favoriteFriend: 'Noemiel',
  streak: t('mock.days', { count: 16 }),
};
