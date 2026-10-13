import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { Btn, T } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { hasUsageAccess, minutesFor, usageOn } from "@/lib/native/usage";
import { WillfolksNative } from "@/modules/willfolks-native";

const CELLS = 12;
const REFRESH_MS = 20_000;

/** Live budget of an app-timer goal: minutes used today against the daily limit. */
export default function FocusSessionScreen() {
  const theme = usePixelTheme();
  const { state } = useAppStore();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const goal = state.goals.find((item) => item.id === activityId);
  const timer = goal?.appTimer;
  const [used, setUsed] = useState<number | null>(null);
  const [access, setAccess] = useState(hasUsageAccess);

  // Re-read on focus too: the user may be coming back from the Usage access settings.
  useFocusEffect(
    useCallback(() => {
      if (!timer) return;
      const read = () => {
        const granted = hasUsageAccess();
        setAccess(granted);
        if (granted) usageOn(new Date()).then((usage) => setUsed(minutesFor(usage, timer.appPackage)), () => {});
      };
      read();
      const interval = setInterval(read, REFRESH_MS);
      return () => clearInterval(interval);
    }, [timer]),
  );

  const paper = theme.fg;
  const ink = theme.bg;
  const limit = timer?.maxDailyMinutes ?? 0;
  const left = used === null ? null : limit - used;
  const lit = used === null || !limit ? 0 : Math.min(CELLS, Math.ceil((used / limit) * CELLS));

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.em(0.8), paddingHorizontal: theme.em(1.2), backgroundColor: paper }}>
      <T v="label" color={ink}>
        {timer?.appName ?? t("focus.session")}
      </T>
      <T v="h1" color={ink} style={{ textAlign: "center" }}>
        {goal?.title ?? t("activity.notFound")}
      </T>
      {timer && access ? (
        <>
          <T v="clock" color={ink} testID="focus-used">
            {used === null ? "--" : String(used)}
          </T>
          <T v="strong" color={ink}>
            {t("focus.ofLimit", { limit })}
          </T>
          <View style={{ flexDirection: "row", gap: theme.em(0.2), alignSelf: "stretch", height: theme.em(0.9) }}>
            {Array.from({ length: CELLS }, (_, index) => (
              <View key={index} style={{ flex: 1, borderWidth: theme.em(0.08), borderColor: ink, backgroundColor: index < lit ? ink : "transparent" }} />
            ))}
          </View>
          {left !== null ? (
            <T v="h2" color={ink}>
              {left >= 0 ? `▲ ${t("focus.left", { count: left })}` : `▼ ${t("focus.over", { count: -left })}`}
            </T>
          ) : null}
        </>
      ) : null}
      {timer && !access ? (
        <>
          <T v="note" color={ink} style={{ textAlign: "center" }}>
            {WillfolksNative ? t("form.app.needsAccess") : t("focus.unsupported")}
          </T>
          {WillfolksNative ? (
            <Btn label={t("perms.openSettings")} icon="apps" variant="line" color={ink} onPress={() => WillfolksNative?.openUsageAccessSettings()} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
