import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { PixelRatio, useWindowDimensions } from "react-native";

import type { PetMood } from "@/constants/pet-sprite";
import type { PixelIconName } from "@/constants/pixel-icons";
import { Palettes, ThemeId } from "@/constants/theme";
import {
  Balance,
  Dashboard,
  FeedEntry,
  Goal,
  GoalKind,
  NewCheckin,
  NewGoal,
  Pet,
  Settings,
  api,
} from "@/lib/api";
import { formatClock } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { cancelOnChain, lockStake } from "@/lib/chain";

export type { Goal, GoalKind } from "@/lib/api";
export type SettingKey = "haptics" | "seconds" | "reminders" | "vibration";
export type FeedTone = "lost" | "neutral" | "won" | "staked";

export const GOAL_ICONS: Record<GoalKind, PixelIconName> = {
  alarm: "alarm",
  appTimer: "apps",
  locator: "pin",
  ai: "spark",
};

export const MIN_STAKE = 1;
export const MAX_STAKE = 50;

export interface FeedItem {
  id: string;
  goalId: string | null;
  icon: PixelIconName;
  title: string;
  tone: FeedTone;
  amount: number;
  value: string;
}

/** The alarm on screen: a real one ringing natively, or a test. */
export interface AlarmState {
  goalId: string | null;
  title: string;
  /** HH:MM shown on the ringing screen. */
  time: string;
  stake: number;
  /** Reaction window in seconds, counted from `firedAt` (epoch ms). */
  total: number;
  firedAt: number;
  phase: "ringing" | "won" | "lost";
  test: boolean;
}

export interface AppState {
  theme: ThemeId;
  settings: Record<SettingKey, boolean>;
  goals: Goal[];
  feed: FeedItem[];
  balance: Balance;
  activeGoals: number;
  unread: number;
  pet: { name: string; mood: PetMood; energy: number; streak: number };
  sheet: { kind: GoalKind; stake: number } | null;
  alarm: AlarmState | null;
  /** Bumped whenever something worth celebrating happens (drives the burst). */
  celebrate: number;
  /** Bumped when a stake is locked (drives the "locked in" toast). */
  locked: number;
  /** State of the last sync with the backend. */
  sync: "idle" | "loading" | "ready" | "error";
  syncError: string | null;
}

export type AppAction =
  | { type: "hydrate"; dashboard: Dashboard; goals: Goal[]; settings: Settings }
  | { type: "syncing" }
  | { type: "syncFailed"; message: string }
  | { type: "reset" }
  | { type: "theme"; theme: ThemeId }
  | { type: "setting"; key: SettingKey; value: boolean }
  | { type: "goal"; goal: Goal }
  | { type: "removeGoal"; id: string }
  | { type: "pet"; pet: Pet }
  | { type: "petMood"; mood: PetMood; energy?: number }
  | { type: "unread"; count: number }
  | { type: "openSheet" }
  | { type: "closeSheet" }
  | { type: "sheetKind"; kind: GoalKind }
  | { type: "sheetStake"; delta: number }
  | { type: "alarm"; alarm: AlarmState | null }
  | { type: "alarmPhase"; phase: "won" | "lost" }
  | { type: "celebrate" }
  | { type: "locked" };

function toFeedItem(entry: FeedEntry): FeedItem {
  const goalIcon = entry.kind ? GOAL_ICONS[entry.kind] : "coin";
  return {
    id: entry.id,
    goalId: entry.goalId,
    icon: entry.tone === "staked" ? "lock" : entry.tone === "won" ? "check" : goalIcon,
    title: entry.title ?? "",
    tone: entry.tone,
    amount: entry.amount,
    value: formatClock(new Date(entry.occurredAt)),
  };
}

function fromSettings(settings: Settings): Record<SettingKey, boolean> {
  return {
    haptics: settings.haptics,
    seconds: settings.showSeconds,
    reminders: settings.reminders,
    vibration: settings.vibration,
  };
}

const SETTING_FIELDS: Record<SettingKey, keyof Omit<Settings, "theme">> = {
  haptics: "haptics",
  seconds: "showSeconds",
  reminders: "reminders",
  vibration: "vibration",
};

function createInitialState(): AppState {
  return {
    theme: "acid",
    settings: { haptics: true, seconds: true, reminders: true, vibration: true },
    goals: [],
    feed: [],
    balance: { available: 0, inEscrow: 0, penalized: 0, currency: "USDC" },
    activeGoals: 0,
    unread: 0,
    pet: { name: "Will", mood: "idle", energy: 68, streak: 0 },
    sheet: null,
    alarm: null,
    celebrate: 0,
    locked: 0,
    sync: "idle",
    syncError: null,
  };
}

const clampStake = (value: number) => Math.min(MAX_STAKE, Math.max(MIN_STAKE, value));

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        theme: action.settings.theme,
        settings: fromSettings(action.settings),
        goals: action.goals,
        feed: action.dashboard.feed.map(toFeedItem),
        balance: action.dashboard.balance,
        activeGoals: action.dashboard.activeGoals,
        unread: action.dashboard.unreadNotifications,
        // A pet mid-celebration keeps its face until the screen lets it rest.
        pet: { ...action.dashboard.pet, mood: state.pet.mood === "happy" ? "happy" : action.dashboard.pet.mood },
        sync: "ready",
        syncError: null,
      };

    case "syncing":
      return state.sync === "ready" ? state : { ...state, sync: "loading", syncError: null };

    case "syncFailed":
      return { ...state, sync: "error", syncError: action.message };

    case "reset":
      // The theme survives signing out; everything personal goes.
      return { ...createInitialState(), theme: state.theme };

    case "theme":
      return { ...state, theme: action.theme };

    case "setting":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };

    case "goal": {
      const known = state.goals.some((goal) => goal.id === action.goal.id);
      return {
        ...state,
        goals: known
          ? state.goals.map((goal) => (goal.id === action.goal.id ? action.goal : goal))
          : [action.goal, ...state.goals],
      };
    }

    case "removeGoal":
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.id) };

    case "pet":
      return { ...state, pet: action.pet };

    case "petMood":
      return { ...state, pet: { ...state.pet, mood: action.mood, energy: action.energy ?? state.pet.energy } };

    case "unread":
      return { ...state, unread: action.count };

    case "openSheet":
      return { ...state, sheet: { kind: "alarm", stake: 5 } };

    case "closeSheet":
      return { ...state, sheet: null };

    case "sheetKind":
      return state.sheet ? { ...state, sheet: { ...state.sheet, kind: action.kind } } : state;

    case "sheetStake":
      return state.sheet
        ? { ...state, sheet: { ...state.sheet, stake: clampStake(state.sheet.stake + action.delta) } }
        : state;

    case "alarm":
      // A ringing alarm is not replaced by another one.
      if (action.alarm && state.alarm?.phase === "ringing") return state;
      return { ...state, sheet: action.alarm ? null : state.sheet, alarm: action.alarm };

    case "alarmPhase":
      if (!state.alarm || state.alarm.phase !== "ringing") return state;
      return {
        ...state,
        alarm: { ...state.alarm, phase: action.phase },
        celebrate: action.phase === "won" ? state.celebrate + 1 : state.celebrate,
      };

    case "celebrate":
      return { ...state, celebrate: state.celebrate + 1 };

    case "locked":
      return { ...state, celebrate: state.celebrate + 1, locked: state.locked + 1 };

    default:
      return state;
  }
}

/** Everything that talks to the backend and folds the answer into the store. */
function createActions(dispatch: Dispatch<AppAction>, getState: () => AppState) {
  /** Pulls everything from the backend; resolves to the goals, or null when it could not. */
  const refresh = async (): Promise<Goal[] | null> => {
    dispatch({ type: "syncing" });
    try {
      // The dashboard goes first: reading it settles goals that just expired.
      const dashboard = await api.dashboard();
      const [goals, settings] = await Promise.all([api.goals(), api.settings()]);
      dispatch({ type: "hydrate", dashboard, goals, settings });
      return goals;
    } catch (error) {
      dispatch({ type: "syncFailed", message: errorMessage(error) });
      return null;
    }
  };

  return {
    refresh,

    setTheme(theme: ThemeId) {
      dispatch({ type: "theme", theme });
      api.updateSettings({ theme }).catch(() => {});
    },

    toggleSetting(key: SettingKey) {
      const value = !getState().settings[key];
      dispatch({ type: "setting", key, value });
      api.updateSettings({ [SETTING_FIELDS[key]]: value }).catch(() => dispatch({ type: "setting", key, value: !value }));
    },

    async createGoal(input: NewGoal): Promise<Goal> {
      let goal = await api.createGoal(input);
      if (goal.escrowParams) {
        // With the on-chain escrow the stake is locked by the device wallet; the backend
        // then verifies the receipt before the goal becomes active.
        try {
          const txHash = await lockStake(goal.escrowParams);
          goal = await api.confirmEscrow(goal.id, txHash);
        } catch (failure) {
          // Nothing was locked: the draft would only clutter the history.
          api.cancelGoal(goal.id).catch(() => {});
          throw failure;
        }
      }
      dispatch({ type: "goal", goal });
      dispatch({ type: "petMood", mood: "happy" });
      dispatch({ type: "locked" });
      await refresh();
      return goal;
    },

    async updateGoal(id: string, patch: Parameters<typeof api.updateGoal>[1]): Promise<Goal> {
      const goal = await api.updateGoal(id, patch);
      dispatch({ type: "goal", goal });
      return goal;
    },

    async cancelGoal(id: string): Promise<void> {
      const current = getState().goals.find((item) => item.id === id);
      const escrow = current?.escrow;
      if (escrow?.state === "active" && escrow.contract && escrow.goalId && escrow.startAt && Date.now() < Date.parse(escrow.startAt)) {
        // The stake sits in the contract: only the wallet can take it back, before the goal starts.
        const txHash = await cancelOnChain(escrow.contract, escrow.goalId);
        await api.confirmEscrowCancel(id, txHash);
        dispatch({ type: "removeGoal", id });
        await refresh();
        return;
      }
      await api.cancelGoal(id);
      dispatch({ type: "removeGoal", id });
      await refresh();
    },

    async respondInvite(id: string, accept: boolean): Promise<void> {
      await api.respondInvite(id, accept);
      if (accept) dispatch({ type: "locked" });
      await refresh();
    },

    /** Records a check and folds its consequences (balance, pet, feed) back in. */
    async checkin(goalId: string, body: NewCheckin) {
      const outcome = await api.checkin(goalId, body);
      dispatch({ type: "goal", goal: outcome.goal });
      if (outcome.checkin.result === "success") dispatch({ type: "celebrate" });
      await refresh();
      return outcome;
    },

    async submitProof(goalId: string, uri: string, fields: { note?: string; scheduledFor: string }) {
      const outcome = await api.submitProof(goalId, uri, fields);
      dispatch({ type: "goal", goal: outcome.goal });
      if (outcome.proof.status === "approved") dispatch({ type: "celebrate" });
      await refresh();
      return outcome;
    },

    async petAction(action: "feed" | "play" | "poke") {
      // The face reacts at once; the server's numbers follow.
      dispatch({ type: "petMood", mood: "happy" });
      if (action !== "poke") dispatch({ type: "celebrate" });
      try {
        const pet = await api.petAction(action);
        dispatch({ type: "pet", pet: { ...pet, mood: "happy" } });
      } catch {
        // Offline: the pet still got its moment.
      }
    },

    petRest() {
      const { pet } = getState();
      if (pet.mood !== "happy" && pet.mood !== "blink") return;
      dispatch({ type: "petMood", mood: pet.energy < 35 ? "sad" : "idle" });
      api.petAction("rest").catch(() => {});
    },

    async deposit(amount: number, method: "crypto" | "fiat") {
      const transaction = await api.deposit(amount, method);
      dispatch({ type: "celebrate" });
      await refresh();
      return transaction;
    },

    async withdraw(amount: number) {
      const transaction = await api.withdraw(amount);
      await refresh();
      return transaction;
    },
  };
}

export type AppActions = ReturnType<typeof createActions>;

const AppStoreContext = createContext<
  { state: AppState; dispatch: Dispatch<AppAction>; actions: AppActions } | undefined
>(undefined);

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const actions = useMemo(() => createActions(dispatch, () => latest.current), []);
  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return context;
}

/** The landing's phone screen is 19.8em wide; every size in the UI is in those ems. */
const SCREEN_EMS = 19.8;

export interface PixelTheme {
  id: ThemeId;
  bg: string;
  fg: string;
  /** `fg` / `bg` at a given alpha. */
  fgA: (alpha: number) => string;
  bgA: (alpha: number) => string;
  /** Converts design ems to device-pixel-aligned dp. */
  em: (value: number) => number;
  /** Hairline used for every outline. */
  line: number;
}

export function usePixelTheme(): PixelTheme {
  const { state } = useAppStore();
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const palette = Palettes[state.theme];
    const unit = Math.min(24, Math.max(16, width / SCREEN_EMS));
    const em = (value: number) => PixelRatio.roundToNearestPixel(value * unit);
    return {
      id: state.theme,
      bg: palette.bg,
      fg: palette.fg,
      fgA: (alpha: number) => `rgba(${palette.fgRgb},${alpha})`,
      bgA: (alpha: number) => `rgba(${palette.bgRgb},${alpha})`,
      em,
      line: Math.max(1.5, em(0.09)),
    };
  }, [state.theme, width]);
}
