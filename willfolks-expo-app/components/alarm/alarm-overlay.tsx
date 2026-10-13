import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Vibration, View } from "react-native";

import { Hatch } from "@/components/pixel/effects";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { Btn, T, textStyle } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { WillfolksNative } from "@/modules/willfolks-native";

/** Half-period of the ringing flash, in ms. */
const FLASH_MS = 450;
/** Cells in the countdown bar, whatever the reaction window is. */
const CELLS = 10;

/** Flips between the two inks while an alarm rings. */
export function useAlarmFlash(ringing: boolean) {
  const [inverted, setInverted] = useState(false);
  useEffect(() => {
    if (!ringing) {
      setInverted(false);
      return;
    }
    const timer = setInterval(() => setInverted((current) => !current), FLASH_MS);
    return () => clearInterval(timer);
  }, [ringing]);
  return inverted;
}

const secondsLeft = (firedAt: number, total: number) => Math.max(0, total - Math.floor((Date.now() - firedAt) / 1000));

/** Full-screen alarm: beat the countdown or the stake gets locked. */
export function AlarmOverlay() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state, dispatch } = useAppStore();
  const alarm = state.alarm;
  const ringing = alarm?.phase === "ringing";
  const inverted = useAlarmFlash(ringing);
  const [left, setLeft] = useState(0);
  const firedAt = alarm?.firedAt ?? 0;
  const total = alarm?.total ?? 0;
  // The native service rings and vibrates on its own; this only covers platforms without it.
  const selfRing = ringing && !WillfolksNative && state.settings.vibration;

  // The countdown follows the clock, not a tick counter, so it survives a backgrounded app.
  useEffect(() => {
    if (!ringing) return;
    const update = () => {
      const next = secondsLeft(firedAt, total);
      setLeft(next);
      // The native service announces the timeout itself; this is the fallback.
      if (next === 0 && (!WillfolksNative || Date.now() - firedAt > (total + 3) * 1000)) {
        dispatch({ type: "alarmPhase", phase: "lost" });
      }
    };
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [ringing, firedAt, total, dispatch]);

  useEffect(() => {
    if (!selfRing) return;
    Vibration.vibrate([0, 400, 500], true);
    return () => Vibration.cancel();
  }, [selfRing]);

  if (!alarm) return null;

  const awake = async () => {
    // Stopping the service stores the result and fires onAlarmFinished, which flips the phase.
    const stopped = await WillfolksNative?.dismissAlarm().catch(() => false);
    if (!stopped) dispatch({ type: "alarmPhase", phase: "won" });
  };

  // The overlay is inked: it swaps the two colours, and swaps back mid-flash.
  const paper = inverted ? theme.bg : theme.fg;
  const ink = inverted ? theme.fg : theme.bg;
  // Keep the system icons legible on whichever ink is showing.
  const statusBar = <StatusBar style={(theme.id === "acid") !== inverted ? "light" : "dark"} />;
  const frame = {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.em(0.6),
    paddingVertical: theme.em(1.2),
    paddingHorizontal: theme.em(1),
    backgroundColor: paper,
  };

  if (alarm.phase === "ringing") {
    const lit = Math.ceil((left / Math.max(1, alarm.total)) * CELLS);
    return (
      <View accessibilityViewIsModal style={[StyleSheet.absoluteFill, frame]}>
        {statusBar}
        <T v="label" color={ink}>
          {alarm.test ? t("pixel.alarm.testKicker") : t("pixel.alarm.kicker")}
        </T>
        <T v="clock" color={ink} style={{ fontSize: theme.em(5.4), lineHeight: theme.em(5) }}>
          {alarm.time}
        </T>
        <T v="h1" color={ink} style={{ textAlign: "center" }} numberOfLines={2}>
          {alarm.title || t("pixel.alarm.wake")}
        </T>
        <T v="strong" color={ink}>
          {t("pixel.alarm.atStake", { amount: alarm.stake })}
        </T>
        <View style={{ flexDirection: "row", gap: theme.em(0.2), alignSelf: "stretch", height: theme.em(0.9), marginTop: theme.em(0.4) }}>
          {Array.from({ length: CELLS }, (_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                borderWidth: theme.em(0.08),
                borderColor: ink,
                backgroundColor: index < lit ? ink : "transparent",
              }}
            />
          ))}
        </View>
        <T v="label" color={ink} accessibilityLiveRegion="polite">
          {t("pixel.alarm.left", { count: left })}
        </T>
        <Btn
          testID="alarm-awake"
          label={t("pixel.alarm.awake")}
          variant="line"
          size="xl"
          color={ink}
          style={{ alignSelf: "stretch", marginTop: theme.em(0.5) }}
          onPress={awake}
        />
      </View>
    );
  }

  const won = alarm.phase === "won";
  // A miss only costs the stake once the goal has no misses left.
  const missesLeft = state.goals.find((goal) => goal.id === alarm.goalId)?.progress.attemptsLeft ?? 0;
  const spared = !won && !alarm.test && missesLeft > 0;
  const body = alarm.test
    ? t(won ? "pixel.alarm.testWonBody" : "pixel.alarm.testLostBody")
    : won
      ? t("pixel.alarm.wonBody", { count: state.pet.streak, streak: state.pet.streak })
      : spared
        ? t("pixel.alarm.missBody", { count: missesLeft })
        : t("pixel.alarm.lostBody", { amount: alarm.stake });

  return (
    <View accessibilityViewIsModal style={[StyleSheet.absoluteFill, frame]}>
      {statusBar}
      {won ? null : <Hatch color="bg" alpha={0.16} />}
      <View
        style={{
          width: theme.em(4.4),
          height: theme.em(4.4),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.em(0.4),
          borderWidth: theme.em(0.16),
          borderColor: ink,
        }}
      >
        <PixelIcon name={won ? "check" : spared ? "close" : "lock"} size={theme.em(2.4)} color={ink} />
      </View>
      <T v="h1" color={ink}>
        {won ? t("pixel.alarm.wonTitle") : spared ? t("pixel.alarm.missTitle") : t("pixel.alarm.lostTitle")}
      </T>
      <T
        color={ink}
        style={[textStyle(theme, "strong"), { maxWidth: theme.em(16), textAlign: "center", lineHeight: theme.em(1) }]}
      >
        {body}
      </T>
      <Btn
        testID="alarm-close"
        label={t("pixel.alarm.back")}
        variant="line"
        size="xl"
        color={ink}
        style={{ alignSelf: "stretch", marginTop: theme.em(0.5) }}
        onPress={() => {
          dispatch({ type: "alarm", alarm: null });
          if (!alarm.test) router.navigate("/dashboard");
        }}
      />
    </View>
  );
}
