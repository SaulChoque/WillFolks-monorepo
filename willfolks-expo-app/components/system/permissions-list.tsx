import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, View } from "react-native";

import { Btn, Card, Chip, Main, T } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";
import { requestBackgroundLocation, requestForegroundLocation } from "@/lib/native/location";
import { requestNotifications } from "@/lib/native/notifications";
import { Permissions, readPermissions, requestCamera } from "@/lib/native/permissions";
import { WillfolksNative } from "@/modules/willfolks-native";

interface Row {
  id: string;
  icon: PixelIconName;
  granted: boolean;
  /** Opens the system dialog or the Settings page that grants it. */
  ask: () => Promise<unknown>;
  /** Shown instead of the default "allow" label. */
  askLabel?: string;
}

function rowsFor(permissions: Permissions): Row[] {
  const rows: Row[] = [
    { id: "notifications", icon: "bell", granted: permissions.notifications, ask: requestNotifications },
    { id: "camera", icon: "eye", granted: permissions.camera, ask: requestCamera },
    { id: "location", icon: "pin", granted: permissions.location !== "none", ask: requestForegroundLocation },
  ];
  if (permissions.location !== "none") {
    rows.push({ id: "background", icon: "pin", granted: permissions.location === "background", ask: requestBackgroundLocation });
  }
  const native = WillfolksNative;
  if (native) {
    rows.push(
      { id: "usage", icon: "apps", granted: permissions.usageAccess, ask: native.openUsageAccessSettings, askLabel: t("perms.openSettings") },
      { id: "exactAlarms", icon: "alarm", granted: permissions.exactAlarms, ask: native.openExactAlarmSettings, askLabel: t("perms.openSettings") },
      { id: "fullScreen", icon: "bolt", granted: permissions.fullScreenAlarm, ask: native.openFullScreenIntentSettings, askLabel: t("perms.openSettings") },
    );
  }
  return rows;
}

/** Every native capability the goals rely on, with its state and a way to grant it. */
export function PermissionsList() {
  const theme = usePixelTheme();
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const reload = useCallback(() => {
    readPermissions().then(setPermissions).catch(() => {});
  }, []);

  useFocusEffect(reload);

  // Some grants happen in Settings: re-read when the user comes back.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") reload();
    });
    return () => subscription.remove();
  }, [reload]);

  if (!permissions) return null;

  return (
    <Card contentStyle={{ gap: theme.em(0.75) }}>
      {rowsFor(permissions).map((row) => (
        <View key={row.id} style={{ gap: theme.em(0.35) }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
            <Chip icon={row.icon} solid={row.granted} />
            <Main title={t(`perms.items.${row.id}.title`)} note={t(`perms.items.${row.id}.body`)} />
          </View>
          {row.granted ? (
            <T v="label" testID={`perm-${row.id}-granted`}>{`▲ ${t("perms.granted")}`}</T>
          ) : (
            <Btn
              testID={`perm-${row.id}`}
              label={row.askLabel ?? t("perms.allow")}
              size="sm"
              variant="line"
              style={{ alignSelf: "flex-start" }}
              onPress={() => row.ask().then(reload, reload)}
            />
          )}
        </View>
      ))}
    </Card>
  );
}
