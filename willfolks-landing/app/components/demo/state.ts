import type { PetMood } from "@/lib/pet-sprite";
import type { PixelIconName } from "@/lib/pixel-icons";

export type TabId = "time" | "home" | "pet" | "goals" | "settings";
export type GoalKind = "alarm" | "appTimer" | "locator" | "ai";
export type ThemeId = "acid" | "void";
export type SettingKey = "haptics" | "seconds" | "reminders" | "vibration";
export type ActivityTone = "lost" | "neutral" | "won" | "staked";

export const TABS: { id: TabId; icon: PixelIconName }[] = [
  { id: "time", icon: "clock" },
  { id: "home", icon: "home" },
  { id: "pet", icon: "smile" },
  { id: "goals", icon: "grid" },
  { id: "settings", icon: "gear" },
];

export const GOAL_ICONS: Record<GoalKind, PixelIconName> = {
  alarm: "alarm",
  appTimer: "apps",
  locator: "pin",
  ai: "spark",
};

export const ALARM_SECONDS = 10;
export const ALARM_STAKE = 2;
const MIN_STAKE = 1;
const MAX_STAKE = 50;

export interface Goal {
  id: number;
  kind: GoalKind;
  stake: number;
  active: boolean;
}

export interface Activity {
  id: number;
  icon: PixelIconName;
  /** Message key under `demo.activity`. */
  label: string;
  tone: ActivityTone;
  amount: number;
  /** Right-hand figure: a time, a quota, etc. */
  value: string;
}

export interface DemoState {
  tab: TabId;
  theme: ThemeId;
  settings: Record<SettingKey, boolean>;
  goals: Goal[];
  activity: Activity[];
  escrow: number;
  sheet: { kind: GoalKind; stake: number } | null;
  alarm: { phase: "ringing" | "won" | "lost"; left: number } | null;
  pet: { mood: PetMood; energy: number; streak: number };
  unlocked: boolean;
  /** Bumped whenever something worth celebrating happens (drives the burst). */
  celebrate: number;
  /** Bumped when a stake is locked (drives the "locked in" toast). */
  locked: number;
  nextId: number;
}

export const INITIAL_STATE: DemoState = {
  tab: "home",
  theme: "acid",
  settings: { haptics: true, seconds: true, reminders: true, vibration: true },
  goals: [
    { id: 1, kind: "alarm", stake: ALARM_STAKE, active: true },
    { id: 2, kind: "appTimer", stake: 3, active: true },
    { id: 3, kind: "ai", stake: 5, active: true },
  ],
  activity: [
    { id: 1, icon: "alarm", label: "missedAlarm", tone: "lost", amount: -2, value: "07:41" },
    { id: 2, icon: "apps", label: "instagram", tone: "neutral", amount: 0, value: "180" },
    { id: 3, icon: "check", label: "testFirst", tone: "won", amount: 5, value: "15:41" },
  ],
  escrow: 10,
  sheet: null,
  alarm: null,
  pet: { mood: "idle", energy: 68, streak: 7 },
  unlocked: false,
  celebrate: 0,
  locked: 0,
  nextId: 10,
};

export type DemoAction =
  | { type: "tab"; tab: TabId }
  | { type: "theme"; theme: ThemeId }
  | { type: "toggleSetting"; key: SettingKey }
  | { type: "toggleGoal"; id: number }
  | { type: "openSheet" }
  | { type: "closeSheet" }
  | { type: "sheetKind"; kind: GoalKind }
  | { type: "sheetStake"; delta: number }
  | { type: "confirmGoal" }
  | { type: "alarmStart" }
  | { type: "alarmTick" }
  | { type: "alarmAwake" }
  | { type: "alarmClose" }
  | { type: "pet"; action: "feed" | "play" | "poke" }
  | { type: "petRest" }
  | { type: "unlock" };

const clampEnergy = (value: number) => Math.min(100, Math.max(0, value));

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "tab":
      return { ...state, tab: action.tab, sheet: null };

    case "theme":
      return { ...state, theme: action.theme };

    case "toggleSetting":
      return {
        ...state,
        settings: { ...state.settings, [action.key]: !state.settings[action.key] },
      };

    case "toggleGoal":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.id ? { ...goal, active: !goal.active } : goal,
        ),
      };

    case "openSheet":
      return { ...state, tab: "goals", sheet: { kind: "alarm", stake: 5 } };

    case "closeSheet":
      return { ...state, sheet: null };

    case "sheetKind":
      return state.sheet ? { ...state, sheet: { ...state.sheet, kind: action.kind } } : state;

    case "sheetStake":
      return state.sheet
        ? {
            ...state,
            sheet: {
              ...state.sheet,
              stake: Math.min(MAX_STAKE, Math.max(MIN_STAKE, state.sheet.stake + action.delta)),
            },
          }
        : state;

    case "confirmGoal": {
      if (!state.sheet) return state;
      const { kind, stake } = state.sheet;
      const id = state.nextId;
      return {
        ...state,
        sheet: null,
        goals: [{ id, kind, stake, active: true }, ...state.goals],
        activity: [
          { id, icon: "lock", label: `staked.${kind}`, tone: "staked", amount: stake, value: "" },
          ...state.activity,
        ],
        escrow: state.escrow + stake,
        pet: { ...state.pet, mood: "happy", energy: clampEnergy(state.pet.energy + 6) },
        celebrate: state.celebrate + 1,
        locked: state.locked + 1,
        nextId: id + 1,
      };
    }

    case "alarmStart":
      return state.alarm ? state : { ...state, sheet: null, alarm: { phase: "ringing", left: ALARM_SECONDS } };

    case "alarmTick": {
      if (!state.alarm || state.alarm.phase !== "ringing") return state;
      const left = state.alarm.left - 1;
      if (left > 0) return { ...state, alarm: { phase: "ringing", left } };
      // Time is up: the stake is locked.
      const id = state.nextId;
      return {
        ...state,
        alarm: { phase: "lost", left: 0 },
        activity: [
          { id, icon: "alarm", label: "missedAlarm", tone: "lost", amount: -ALARM_STAKE, value: "07:41" },
          ...state.activity,
        ],
        pet: { mood: "sad", energy: clampEnergy(state.pet.energy - 25), streak: 0 },
        nextId: id + 1,
      };
    }

    case "alarmAwake": {
      if (!state.alarm || state.alarm.phase !== "ringing") return state;
      const id = state.nextId;
      return {
        ...state,
        alarm: { phase: "won", left: state.alarm.left },
        activity: [
          { id, icon: "check", label: "beatAlarm", tone: "won", amount: 0, value: "07:41" },
          ...state.activity,
        ],
        pet: {
          mood: "happy",
          energy: clampEnergy(state.pet.energy + 12),
          streak: state.pet.streak + 1,
        },
        celebrate: state.celebrate + 1,
        nextId: id + 1,
      };
    }

    case "alarmClose":
      return { ...state, alarm: null, tab: "home" };

    case "pet": {
      const gain = action.action === "feed" ? 14 : action.action === "play" ? 9 : 3;
      return {
        ...state,
        pet: { ...state.pet, mood: "happy", energy: clampEnergy(state.pet.energy + gain) },
        celebrate: action.action === "poke" ? state.celebrate : state.celebrate + 1,
      };
    }

    case "petRest":
      return state.pet.mood === "happy" || state.pet.mood === "blink"
        ? { ...state, pet: { ...state.pet, mood: state.pet.energy < 35 ? "sad" : "idle" } }
        : state;

    case "unlock":
      return { ...state, unlocked: true };

    default:
      return state;
  }
}
