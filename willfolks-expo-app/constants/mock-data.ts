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
    titulo: t('mock.titles.missedAlarm'),
    esGrupal: false,
    participantes: ['@baluchop'],
    montoStake: 2,
    fechaInicio: '2025-10-23T06:30:00',
    fechaFin: '2025-11-12T15:45:00',
    diasBloqueoDefiExtra: 2,
    porcentajeTipDev: 5,
    estado: 'active',

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
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
    horaObjetivo: '2025-10-23T07:41:00',
    diasActivos: buildDaySelection(['mon', 'tue', 'wed', 'thu', 'fri']),
    tiempoMaximoReaccionSegundos: 120,

    // Campo legacy (fuera del UML): se mantiene por compatibilidad.
    alarmSettings: {
      alarmTime: '2025-10-23T07:41:00',
      musicTitle: t('mock.music.morningVibes'),
      vibrationEnabled: true,
    },

    // Campo legacy (fuera del UML): se mantiene por compatibilidad.
    timerSettings: {
      appId: installedApps[0].id,
      appName: installedApps[0].name,
      maxDailyMinutes: 60,
    },
  },
  {
    id: 'instagram-limit-week',
    titulo: 'Instagram',
    esGrupal: true,
    participantes: ['@baluchop', '@noemiel'],
    montoStake: 5,
    fechaInicio: '2025-10-15T09:20:00',
    fechaFin: '2025-10-15T12:20:00',
    diasBloqueoDefiExtra: 0,
    porcentajeTipDev: 3,
    estado: 'paused',

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
    title: 'Instagram',
    repeatLabel: t('activity.noRepeat'),
    summaryLabel: '180 min/sem',
    amountLabel: '-0 USDC',
    amountKind: 'neutral',
    iconName: 'apps',
    days: buildDaySelection(['mon', 'tue', 'wed']),
    isActive: false,
    notificationsEnabled: false,
    schedule: buildSchedule('2025-10-15T09:20:00', '2025-10-15T12:20:00'),
    type: 'timer',

    appObjetivoId: 'instagram',
    minutosMaximosSemana: 180,

    // Campo legacy (fuera del UML): se mantiene por compatibilidad.
    timerSettings: {
      appId: 'instagram',
      appName: 'Instagram',
      maxDailyMinutes: 180,
    },

    // Campo legacy (fuera del UML): se mantiene por compatibilidad.
    alarmSettings: {
      alarmTime: '2025-10-15T09:20:00',
      musicTitle: t('mock.music.default'),
      vibrationEnabled: false,
    },
  },
  {
    id: 'finish-test-irl',
    titulo: t('mock.titles.finishTestFirst'),
    esGrupal: false,
    participantes: ['@baluchop'],
    montoStake: 5,
    fechaInicio: '2025-09-08T08:00:00',
    fechaFin: '2025-09-08T15:41:00',
    diasBloqueoDefiExtra: 1,
    porcentajeTipDev: 2,
    estado: 'active',

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
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
    type: 'irl',

    promptIA: 'Terminar la práctica técnica y subir evidencia.',
    cidsEvidencia: [],

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
    alarmSettings: {
      alarmTime: '2025-09-08T15:41:00',
      musicTitle: t('mock.music.focusPlaylist'),
      vibrationEnabled: true,
    },

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
    timerSettings: {
      appId: installedApps[2].id,
      appName: installedApps[2].name,
      maxDailyMinutes: 30,
    },
  },
];

export const dashboardActivityIds = ['missed-alarm', 'instagram-limit-week', 'finish-test-irl'];

export function createEmptyActivityDraft(): ActivityDraftState {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    id: `draft-${now.getTime()}`,
    titulo: t('activities.newActivity'),
    esGrupal: false,
    participantes: ['@baluchop'],
    montoStake: 0,
    fechaInicio: now.toISOString(),
    fechaFin: oneHourLater.toISOString(),
    diasBloqueoDefiExtra: 0,
    porcentajeTipDev: 0,
    estado: 'draft',

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
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
    type: 'irl',

    promptIA: '',
    cidsEvidencia: [],
    horaObjetivo: now.toISOString(),
    diasActivos: buildDaySelection([]),
    tiempoMaximoReaccionSegundos: 120,
    appObjetivoId: installedApps[0].id,
    minutosMaximosSemana: 120,

    // Campos legacy (fuera del UML): se mantienen por compatibilidad.
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
