"use client";

import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import { useLocale, useTranslations } from "next-intl";
import { animate, steps } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import type { PixelIconName } from "@/lib/pixel-icons";
import { PixelIcon } from "../ui/PixelIcon";
import { PetSprite } from "./PetSprite";
import {
  ALARM_SECONDS,
  ALARM_STAKE,
  GOAL_ICONS,
  type Activity,
  type DemoAction,
  type DemoState,
  type GoalKind,
  type SettingKey,
} from "./state";

interface ScreenProps {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
}

type Translate = ReturnType<typeof useTranslations>;

// ---------- small shared pieces ----------

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="app-toggle"
      onClick={onChange}
    >
      <i />
    </button>
  );
}

function Fact({ icon, label, value }: { icon: PixelIconName; label: string; value: string }) {
  return (
    <div className="app-fact">
      <span className="app-chip">
        <PixelIcon name={icon} size={16} />
      </span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

function activityNote(item: Activity, t: Translate): string {
  switch (item.tone) {
    case "lost":
      return `▼ ${item.amount} USDC · ${t("notes.locked")}`;
    case "won":
      return item.amount > 0
        ? `▲ +${item.amount} USDC · ${t("notes.won")}`
        : `▲ ${t("notes.safe")}`;
    case "staked":
      return `◆ ${item.amount} USDC · ${t("notes.staked")}`;
    default:
      return `● 0 USDC · ${t("notes.onTrack")}`;
  }
}

// ---------- HOME ----------

export function HomeScreen({ state }: ScreenProps) {
  const t = useTranslations("demo.app");
  const activeGoals = state.goals.filter((goal) => goal.active).length;

  return (
    <div className="app-screen">
      <header className="app-greet">
        <p className="app-label">{t("home.welcome")}</p>
        <h3 className="app-h1">
          {t("home.user")}
          <span className="blink" aria-hidden="true">
            _
          </span>
        </h3>
      </header>

      <section className="app-card app-card--solid">
        <p className="app-label">{t("home.inEscrow")}</p>
        <p className="app-big">
          {state.escrow.toFixed(2)}
          <small>USDC</small>
        </p>
        <div className="app-meter" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} className={i < Math.min(12, Math.round(state.escrow / 2.5)) ? "is-on" : ""} />
          ))}
        </div>
        <p className="app-label app-row">
          <span>{t("home.activeGoals", { count: activeGoals })}</span>
          <span>▲ +0.42 {t("home.yield")}</span>
        </p>
      </section>

      <h4 className="app-h2">
        {t("home.recent")}
        <i />
      </h4>
      <ul className="app-list">
        {state.activity.slice(0, 4).map((item) => (
          <li key={item.id} className={`app-item app-item--${item.tone}`}>
            <span className="app-chip">
              <PixelIcon name={item.icon} size={16} />
            </span>
            <div className="app-item__main">
              <strong>{t(`activity.${item.label}`)}</strong>
              <span>{activityNote(item, t)}</span>
            </div>
            <span className="app-item__value">
              {item.label === "instagram" ? t("activity.instagramValue") : item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- TIME ----------

const FRIEND_ZONES = [
  { city: "Ciudad de México", zone: "America/Mexico_City" },
  { city: "Buenos Aires", zone: "America/Argentina/Buenos_Aires" },
  { city: "Xela", zone: "America/Guatemala" },
  { city: "Asunción", zone: "America/Asuncion" },
];

function clockIn(date: Date, timeZone: string | undefined, seconds: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: false,
    timeZone,
  }).format(date);
}

/** Whole hours a zone is ahead of the visitor's own clock. */
function hoursFromLocal(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  const zoneOffset = Math.round((asUtc - date.getTime()) / 60000);
  return Math.round((zoneOffset + date.getTimezoneOffset()) / 60);
}

export function TimeScreen({ state, now }: ScreenProps & { now: Date | null }) {
  const t = useTranslations("demo.app");
  const locale = useLocale();
  const withSeconds = state.settings.seconds;

  const date = now
    ? new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }).format(now)
    : "———";

  return (
    <div className="app-screen">
      <h3 className="app-h2">
        {t("time.title")}
        <i />
      </h3>
      <section className="app-card app-clock">
        <p className="app-clock__time" aria-live="off">
          {now ? clockIn(now, undefined, withSeconds) : withSeconds ? "--:--:--" : "--:--"}
        </p>
        <p className="app-label app-row">
          <span>{date}</span>
          <span>{t("time.local")}</span>
        </p>
      </section>

      <h4 className="app-h2">
        {t("time.friends")}
        <i />
      </h4>
      <ul className="app-list">
        {FRIEND_ZONES.map(({ city, zone }) => {
          const diff = now ? hoursFromLocal(now, zone) : 0;
          return (
            <li key={zone} className="app-item">
              <div className="app-item__main">
                <strong>{city}</strong>
                <span>
                  {diff >= 0 ? "+" : ""}
                  {diff} {t("time.hours")}
                </span>
              </div>
              <span className="app-item__value app-item__value--lg">
                {now ? clockIn(now, zone, false) : "--:--"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- PET ----------

export function PetScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations("demo.app");
  const petRef = useRef<HTMLDivElement>(null);
  const { mood, energy, streak } = state.pet;

  // Idle bob in two hard steps, like a sprite sheet.
  useEffect(() => {
    const pet = petRef.current;
    if (!pet || prefersReducedMotion()) return;
    const bob = animate(pet, {
      y: [0, -4],
      duration: 900,
      ease: steps(2),
      loop: true,
      alternate: true,
    });
    return () => {
      bob.revert();
    };
  }, []);

  // A happy pet hops, then settles back to its resting face.
  useEffect(() => {
    if (mood !== "happy") return;
    const pet = petRef.current?.firstElementChild;
    const hop =
      pet && !prefersReducedMotion()
        ? animate(pet, {
            y: [0, -22, 0, -10, 0],
            scaleY: [1, 1.08, 0.9, 1.03, 1],
            duration: 760,
            ease: "outQuad",
          })
        : null;
    const rest = setTimeout(() => dispatch({ type: "petRest" }), 1500);
    return () => {
      clearTimeout(rest);
      hop?.revert();
    };
  }, [mood, state.celebrate, dispatch]);

  const line = mood === "sad" ? "sad" : mood === "happy" ? "happy" : energy > 85 ? "full" : "idle";

  return (
    <div className="app-screen">
      <div className="app-pet-stats">
        <div className="app-ring" style={{ ["--value" as string]: energy }}>
          <PixelIcon name={mood === "sad" ? "eye" : "smile"} size={18} />
        </div>
        <div>
          <p className="app-label">{t("pet.mood")}</p>
          <p className="app-stat">{energy}%</p>
        </div>
        <div className="app-pet-stats__streak">
          <PixelIcon name="flame" size={20} />
          <div>
            <p className="app-label">{t("pet.streak")}</p>
            <p className="app-stat">{t("pet.days", { count: streak })}</p>
          </div>
        </div>
      </div>

      <section className="app-card app-pet">
        <p className="app-label">{t("pet.title")}</p>
        <p className="app-pet__say" aria-live="polite">
          &gt; {t(`pet.lines.${line}`)}
        </p>
        <button
          type="button"
          className="app-pet__stage"
          aria-label={t("pet.poke")}
          onClick={() => dispatch({ type: "pet", action: "poke" })}
        >
          <div ref={petRef} className="app-pet__bob">
            <PetSprite mood={mood} className="app-pet__sprite" />
          </div>
          <span className="app-pet__ground" aria-hidden="true" />
        </button>
      </section>

      <div className="app-actions">
        <button type="button" className="app-btn" onClick={() => dispatch({ type: "pet", action: "feed" })}>
          <PixelIcon name="heart" size={14} />
          {t("pet.feed")}
        </button>
        <button
          type="button"
          className="app-btn app-btn--line"
          onClick={() => dispatch({ type: "pet", action: "play" })}
        >
          <PixelIcon name="play" size={14} />
          {t("pet.play")}
        </button>
      </div>
    </div>
  );
}

// ---------- GOALS ----------

/** The seeded wake-up goal is the only one with the full detail sheet. */
const SEED_ALARM_ID = 1;

export function GoalsScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations("demo.app");

  return (
    <div className="app-screen app-screen--scroll" data-lenis-prevent>
      <h3 className="app-h2">
        {t("goals.title")}
        <i />
      </h3>

      {state.goals.map((goal) => (
        <section key={goal.id} className={`app-card app-goal ${goal.active ? "" : "is-paused"}`}>
          <header className="app-goal__head">
            <span className="app-chip app-chip--solid">
              <PixelIcon name={GOAL_ICONS[goal.kind]} size={16} />
            </span>
            <div className="app-item__main">
              <strong>{t(`goals.kinds.${goal.kind}.name`)}</strong>
              <span>
                {t(`goals.kinds.${goal.kind}.detail`)} · {goal.active ? t("goals.active") : t("goals.paused")}
              </span>
            </div>
            <Toggle
              checked={goal.active}
              label={t(`goals.kinds.${goal.kind}.name`)}
              onChange={() => dispatch({ type: "toggleGoal", id: goal.id })}
            />
          </header>

          <dl className="app-facts">
            <Fact icon="coin" label={t("goals.stake")} value={`${goal.stake} USDC`} />
            <Fact icon="lock" label={t("goals.lockDays")} value={t("goals.lockValue")} />
            {goal.id === SEED_ALARM_ID ? (
              <>
                <Fact icon="group" label={t("goals.participants")} value="@baluchop" />
                <Fact icon="calendar" label={t("goals.days")} value={t("goals.daysValue")} />
                <Fact icon="hourglass" label={t("goals.reaction")} value="120s" />
                <Fact icon="percent" label={t("goals.tip")} value="5%" />
              </>
            ) : null}
          </dl>

          {goal.kind === "alarm" && goal.active ? (
            <button type="button" className="app-btn app-btn--sm" onClick={() => dispatch({ type: "alarmStart" })}>
              <PixelIcon name="play" size={12} />
              {t("goals.testAlarm")}
            </button>
          ) : null}
        </section>
      ))}

      <button
        type="button"
        className="app-fab"
        aria-label={t("goals.add")}
        onClick={() => dispatch({ type: "openSheet" })}
      >
        <PixelIcon name="plus" size={22} />
      </button>
    </div>
  );
}

const GOAL_KINDS: GoalKind[] = ["alarm", "appTimer", "locator", "ai"];

export function NewGoalSheet({ state, dispatch }: ScreenProps) {
  const t = useTranslations("demo.app");
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheet = state.sheet;

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !sheet || prefersReducedMotion()) return;
    const rise = animate(el, { y: ["100%", "0%"], duration: 420, ease: "outExpo" });
    return () => {
      rise.revert();
    };
    // Only replay when the sheet opens, not on every stake/kind change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet === null]);

  if (!sheet) return null;

  return (
    <div className="app-sheet" role="dialog" aria-label={t("sheet.title")}>
      <button
        type="button"
        className="app-sheet__scrim"
        aria-label={t("sheet.cancel")}
        onClick={() => dispatch({ type: "closeSheet" })}
      />
      <div className="app-sheet__panel" ref={sheetRef}>
        <header className="app-row">
          <h3 className="app-h1 app-h1--sm">{t("sheet.title")}</h3>
          <button
            type="button"
            className="app-icon-btn"
            aria-label={t("sheet.cancel")}
            onClick={() => dispatch({ type: "closeSheet" })}
          >
            <PixelIcon name="close" size={16} />
          </button>
        </header>

        <p className="app-label">{t("sheet.pick")}</p>
        <div className="app-kinds" role="radiogroup" aria-label={t("sheet.pick")}>
          {GOAL_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={sheet.kind === kind}
              className="app-kind"
              onClick={() => dispatch({ type: "sheetKind", kind })}
            >
              <PixelIcon name={GOAL_ICONS[kind]} size={20} />
              <span>{t(`goals.kinds.${kind}.short`)}</span>
            </button>
          ))}
        </div>

        <p className="app-label">{t("sheet.stake")}</p>
        <div className="app-stepper">
          <button
            type="button"
            aria-label={t("sheet.less")}
            onClick={() => dispatch({ type: "sheetStake", delta: -1 })}
          >
            −
          </button>
          <output className="app-big" aria-live="polite">
            {sheet.stake}
            <small>USDC</small>
          </output>
          <button
            type="button"
            aria-label={t("sheet.more")}
            onClick={() => dispatch({ type: "sheetStake", delta: 1 })}
          >
            +
          </button>
        </div>

        <p className="app-sheet__warn">▼ {t("sheet.ifMiss")}</p>
        <button type="button" className="app-btn app-btn--wide" onClick={() => dispatch({ type: "confirmGoal" })}>
          <PixelIcon name="lock" size={14} />
          {t("sheet.confirm")}
        </button>
      </div>
    </div>
  );
}

// ---------- SETTINGS ----------

const SETTING_GROUPS: { title: string; items: { key: SettingKey; icon: PixelIconName }[] }[] = [
  {
    title: "experience",
    items: [
      { key: "haptics", icon: "vibrate" },
      { key: "seconds", icon: "hourglass" },
    ],
  },
  {
    title: "alarmFocus",
    items: [
      { key: "reminders", icon: "bell" },
      { key: "vibration", icon: "bolt" },
    ],
  },
];

export function SettingsScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations("demo.app");
  const fillRef = useRef<HTMLElement>(null);
  const holdRef = useRef<ReturnType<typeof animate> | null>(null);

  // Hold-to-unlock: the bar fills while pressed and snaps back on release.
  const startHold = () => {
    const fill = fillRef.current;
    if (!fill || state.unlocked) return;
    if (prefersReducedMotion()) {
      dispatch({ type: "unlock" });
      return;
    }
    holdRef.current?.cancel();
    holdRef.current = animate(fill, {
      scaleX: [0, 1],
      duration: 900,
      ease: "linear",
      onComplete: () => dispatch({ type: "unlock" }),
    });
  };
  const cancelHold = () => {
    const fill = fillRef.current;
    if (!fill || state.unlocked) return;
    holdRef.current?.cancel();
    animate(fill, { scaleX: 0, duration: 200, ease: "outQuad" });
  };

  useEffect(() => () => void holdRef.current?.cancel(), []);

  return (
    <div className="app-screen app-screen--scroll" data-lenis-prevent>
      <h3 className="app-h2">
        {t("settings.title")}
        <i />
      </h3>

      <section className="app-card">
        <p className="app-label">{t("settings.display")}</p>
        <div className="app-seg" role="radiogroup" aria-label={t("settings.display")}>
          {(["acid", "void"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={state.theme === theme}
              onClick={() => dispatch({ type: "theme", theme })}
            >
              {t(`settings.theme.${theme}`)}
            </button>
          ))}
        </div>
      </section>

      {SETTING_GROUPS.map((group) => (
        <section className="app-card" key={group.title}>
          <p className="app-label">{t(`settings.${group.title}`)}</p>
          {group.items.map(({ key, icon }) => (
            <div className="app-setting" key={key}>
              <span className="app-chip">
                <PixelIcon name={icon} size={16} />
              </span>
              <div className="app-item__main">
                <strong>{t(`settings.items.${key}.title`)}</strong>
                <span>{t(`settings.items.${key}.body`)}</span>
              </div>
              <Toggle
                checked={state.settings[key]}
                label={t(`settings.items.${key}.title`)}
                onChange={() => dispatch({ type: "toggleSetting", key })}
              />
            </div>
          ))}
        </section>
      ))}

      <section className="app-card">
        <p className="app-label">{t("settings.wallet")}</p>
        <p className="app-mono-line">0x71B4…A0D6…4E94</p>
        <div className="app-item__main">
          <strong>{state.unlocked ? t("settings.unlockedTitle") : t("settings.hiddenTitle")}</strong>
          <span>{state.unlocked ? t("settings.unlockedBody") : t("settings.hiddenBody")}</span>
        </div>
        <button
          type="button"
          className="app-btn app-btn--wide app-hold"
          disabled={state.unlocked}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !event.repeat) startHold();
          }}
          onKeyUp={cancelHold}
        >
          <i ref={fillRef} className="app-hold__fill" />
          <span>
            <PixelIcon name={state.unlocked ? "check" : "lock"} size={14} />
            {state.unlocked ? t("settings.unlocked") : t("settings.unlock")}
          </span>
        </button>
      </section>
    </div>
  );
}

// ---------- ALARM OVERLAY ----------

export function AlarmOverlay({ state, dispatch }: ScreenProps) {
  const t = useTranslations("demo.app");
  const alarm = state.alarm;

  // One-second countdown while the alarm is ringing.
  useEffect(() => {
    if (alarm?.phase !== "ringing") return;
    const timer = setInterval(() => dispatch({ type: "alarmTick" }), 1000);
    return () => clearInterval(timer);
  }, [alarm?.phase, dispatch]);

  if (!alarm) return null;

  if (alarm.phase === "ringing") {
    return (
      <div className="app-alarm app-alarm--ringing" role="alertdialog" aria-label={t("alarm.wake")}>
        <p className="app-label">{t("alarm.kicker")}</p>
        <p className="app-alarm__time">07:41</p>
        <h3 className="app-h1">{t("alarm.wake")}</h3>
        <p className="app-alarm__stake">{t("alarm.atStake", { amount: ALARM_STAKE })}</p>
        <div className="app-alarm__bar" aria-hidden="true">
          {Array.from({ length: ALARM_SECONDS }, (_, i) => (
            <i key={i} className={i < alarm.left ? "is-on" : ""} />
          ))}
        </div>
        <p className="app-label" aria-live="polite">
          {t("alarm.left", { count: alarm.left })}
        </p>
        <button type="button" className="app-btn app-btn--wide app-btn--xl" onClick={() => dispatch({ type: "alarmAwake" })}>
          {t("alarm.awake")}
        </button>
      </div>
    );
  }

  const won = alarm.phase === "won";
  return (
    <div className={`app-alarm ${won ? "app-alarm--won" : "app-alarm--lost"}`} role="alertdialog">
      <span className="app-alarm__badge">
        <PixelIcon name={won ? "check" : "lock"} size={34} />
      </span>
      <h3 className="app-h1">{won ? t("alarm.wonTitle") : t("alarm.lostTitle")}</h3>
      <p className="app-alarm__stake">
        {won ? t("alarm.wonBody", { streak: state.pet.streak }) : t("alarm.lostBody", { amount: ALARM_STAKE })}
      </p>
      <button type="button" className="app-btn app-btn--wide" onClick={() => dispatch({ type: "alarmClose" })}>
        {t("alarm.back")}
      </button>
    </div>
  );
}
