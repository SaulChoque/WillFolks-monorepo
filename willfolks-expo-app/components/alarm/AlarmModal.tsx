import { t } from "@/i18n";
import type { HomeActivity } from "@/types/home";
import React, { useEffect, useRef } from "react";
import { Modal, Vibration, View } from "react-native";

import { Btn, T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { formatTime } from "@/utils/datetime";
import { useAlarmFlash } from "./alarm-overlay";

interface Props {
  visible: boolean;
  activity: HomeActivity | null;
  onSnooze: () => void;
  onStop: () => void;
}

export default function AlarmModal({
  visible,
  activity,
  onSnooze,
  onStop,
}: Props) {
  const soundRef = useRef<any | null>(null);
  const theme = usePixelTheme();
  const inverted = useAlarmFlash(visible);
  const paper = inverted ? theme.bg : theme.fg;
  const ink = inverted ? theme.fg : theme.bg;

  useEffect(() => {
    let mounted = true;

    async function startSoundAndVibrate() {
      // Dynamic require of expo-av to avoid runtime crash when native module isn't available
      try {
        const ExpoAV = await import("expo-av");
        const Audio = ExpoAV?.Audio;
        if (Audio && Audio.Sound) {
          try {
            const asset = require("../../assets/alarm.mp3");
            if (Audio.setAudioModeAsync) {
              Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
              }).catch(() => {});
            }
            const { sound } = await Audio.Sound.createAsync(asset, {
              shouldPlay: true,
              isLooping: true,
              volume: 1.0,
            });
            soundRef.current = sound;
          } catch {
            // audio file missing or playback failed
          }
        }
      } catch {
        // expo-av native module not available; ignore so the app can run.
      }

      // Start vibration if enabled on activity
      if (
        activity?.type === "alarm" &&
        activity.alarmSettings.vibrationEnabled
      ) {
        Vibration.vibrate([1000, 500], true);
      }
    }

    if (visible && activity && mounted) {
      // start sound and vibration (audio loaded dynamically inside function)
      startSoundAndVibrate();
    }

    return () => {
      mounted = false;
      // cleanup sound
      (async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch {
            // ignore
          }
          soundRef.current = null;
        }
        // stop vibration
        Vibration.cancel();
      })();
    };
  }, [visible, activity]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.em(0.6),
          paddingHorizontal: theme.em(1),
          backgroundColor: paper,
        }}
      >
        <T v="label" color={ink}>
          {t("alarmModal.defaultTitle")}
        </T>
        <T v="clock" color={ink} style={{ fontSize: theme.em(5.4), lineHeight: theme.em(5) }}>
          {activity && activity.type === "alarm"
            ? formatTime(activity.alarmSettings.alarmTime)
            : "--:--"}
        </T>
        <T v="h1" color={ink} style={{ textAlign: "center" }}>
          {activity?.title ?? t("alarmModal.defaultTitle")}
        </T>
        <View style={{ flexDirection: "row", gap: theme.em(0.45), alignSelf: "stretch", marginTop: theme.em(0.5) }}>
          <Btn
            label={t("pixel.alarm.snooze")}
            variant="line"
            color={ink}
            style={{ flex: 1 }}
            onPress={onSnooze}
          />
          <Btn
            label={t("pixel.alarm.stop")}
            color={ink}
            outside={paper}
            style={{ flex: 1 }}
            onPress={onStop}
          />
        </View>
        <T v="note" color={ink} style={{ textAlign: "center", marginTop: theme.em(0.4) }}>
          {t("alarmModal.hint")}
        </T>
      </View>
    </Modal>
  );
}
