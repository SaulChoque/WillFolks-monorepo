import type { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type ActivityAmountKind = 'credit' | 'debit' | 'neutral';
export type WilliamEstado = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

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
  titulo: string;
  esGrupal: boolean;
  participantes: string[];
  montoStake: number;
  fechaInicio: string;
  fechaFin: string;
  diasBloqueoDefiExtra: number;
  porcentajeTipDev: number;
  estado: WilliamEstado;

  // Campos legacy (fuera del UML): se mantienen por compatibilidad.
  title: string;
  // repeatLabel: string;
  repeatLabel: string;
  // summaryLabel: string;
  summaryLabel: string;
  // amountLabel: string;
  amountLabel: string;
  // amountKind: ActivityAmountKind;
  amountKind: ActivityAmountKind;
  iconName: MaterialIconName;
  days: DaySelection[];
  isActive: boolean;
  notificationsEnabled: boolean;
  schedule: ActivitySchedule;
}

export type Activity =
  | (ActivityBase & {
      type: 'irl';
      promptIA: string;
      cidsEvidencia: string[];

      // Campos legacy (fuera del UML) para compatibilidad.
      alarmSettings: AlarmSettings;
      timerSettings: TimerSettings;
    })
  | (ActivityBase & {
      type: 'alarm';
      horaObjetivo: string;
      diasActivos: DaySelection[];
      tiempoMaximoReaccionSegundos: number;

      // Campo legacy (fuera del UML) para compatibilidad.
      alarmSettings: AlarmSettings;

      // Campo legacy (fuera del UML) para compatibilidad.
      timerSettings: TimerSettings;
    })
  | (ActivityBase & {
      type: 'timer';
      appObjetivoId: string;
      minutosMaximosSemana: number;

      // Campo legacy (fuera del UML) para compatibilidad.
      timerSettings: TimerSettings;

      // Campo legacy (fuera del UML) para compatibilidad.
      alarmSettings: AlarmSettings;
    });

export type HomeActivity = Activity;

export interface ActivityDraftState extends ActivityBase {
  type: 'irl' | 'alarm' | 'timer';
  promptIA: string;
  cidsEvidencia: string[];
  horaObjetivo: string;
  diasActivos: DaySelection[];
  tiempoMaximoReaccionSegundos: number;
  appObjetivoId: string;
  minutosMaximosSemana: number;

  // Campos legacy (fuera del UML): se mantienen por compatibilidad.
  alarmSettings: AlarmSettings;
  timerSettings: TimerSettings;
}
