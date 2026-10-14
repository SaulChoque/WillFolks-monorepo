import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Main, Row, SectionTitle, T } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { getDeviceLocaleTag, t } from "@/i18n";
import { api } from "@/lib/api";
import { nextAlarmLabel } from "@/lib/native/widget";

function clockIn(date: Date, timeZone: string | undefined, seconds: boolean): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: seconds ? "2-digit" : undefined,
      hour12: false,
      timeZone,
    }).format(date);
  } catch {
    return seconds ? "--:--:--" : "--:--";
  }
}

/** Whole hours a zone is ahead of the device's own clock. */
function hoursFromLocal(date: Date, timeZone: string): number {
  try {
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
  } catch {
    return 0;
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString(getDeviceLocaleTag(), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function TimeScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { state } = useAppStore();
  const friends = useApi(api.friends);
  const [now, setNow] = useState(() => new Date());
  const alarm = nextAlarmLabel(state.goals);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Screen onRefresh={friends.reload}>
      <SectionTitle>{t("pixel.time.title")}</SectionTitle>
      <Card contentStyle={{ paddingTop: theme.em(0.95), gap: theme.em(0.6) }}>
        <T v="clock" style={{ textAlign: "center" }}>
          {clockIn(now, undefined, state.settings.seconds)}
        </T>
        <Row>
          <T v="label">{formatDate(now)}</T>
          <T v="label">{t("pixel.time.local")}</T>
        </Row>
        <T v="label" testID="time-next-alarm">
          {alarm ? `▲ ${t("native.widget.alarm", { time: alarm })}` : `● ${t("native.widget.noAlarm")}`}
        </T>
      </Card>

      <SectionTitle>{t("pixel.time.friends")}</SectionTitle>
      {friends.data?.friends.length ? (
        <View style={{ gap: theme.em(0.35) }}>
          {friends.data.friends.map(({ id, user }) => {
            const diff = hoursFromLocal(now, user.timezone);
            return (
              <View
                key={id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.em(0.55),
                  paddingVertical: theme.em(0.45),
                  paddingHorizontal: theme.em(0.5),
                  borderWidth: theme.line,
                  borderColor: theme.fg,
                }}
              >
                <Main
                  title={user.displayName}
                  note={`${user.locationLabel ?? user.timezone} · ${diff >= 0 ? "+" : ""}${diff} ${t("pixel.time.hours")}`}
                />
                <T v="valueLg">{clockIn(now, user.timezone, false)}</T>
              </View>
            );
          })}
        </View>
      ) : (
        <>
          <T v="note">{friends.loading ? t("common.loading") : t("friendsScreen.empty")}</T>
          <Btn testID="time-add-friends" label={t("friendsScreen.find")} icon="plus" variant="line" onPress={() => router.push("/friends")} />
        </>
      )}
    </Screen>
  );
}
