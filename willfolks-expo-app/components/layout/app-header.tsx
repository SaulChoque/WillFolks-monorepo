import { usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PixelIcon } from "@/components/pixel/pixel-icon";
import { T, useHaptic } from "@/components/pixel/ui";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useSession } from "@/hooks/use-session";
import { t } from "@/i18n";

const TAB_TITLES: Record<string, string> = {
  "/": "pixel.tabs.time",
  "/dashboard": "pixel.tabs.home",
  "/home": "pixel.tabs.pet",
  "/activities": "pixel.tabs.goals",
  "/settings": "pixel.tabs.settings",
};

const STACK_TITLES: [prefix: string, key: string][] = [
  ["/account", "pixel.screens.account"],
  ["/focus", "pixel.screens.focus"],
  ["/activity/new", "pixel.screens.newGoal"],
  ["/wallet", "pixel.screens.wallet"],
  ["/friends", "pixel.screens.friends"],
  ["/notifications", "pixel.screens.notifications"],
  ["/permissions", "pixel.screens.permissions"],
];

function stackTitle(pathname: string) {
  return STACK_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "pixel.screens.activity";
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const theme = usePixelTheme();
  const haptic = useHaptic();
  const { user } = useSession();
  const { state } = useAppStore();

  const tabTitle = TAB_TITLES[pathname];
  const box = theme.em(1.7);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.em(0.6),
        paddingTop: insets.top + theme.em(0.35),
        paddingBottom: theme.em(0.5),
        paddingHorizontal: theme.em(0.8),
        borderBottomWidth: theme.line,
        borderColor: theme.fg,
        backgroundColor: theme.bg,
      }}
    >
      {tabTitle ? (
        <Pressable
          testID="header-account"
          accessibilityRole="button"
          accessibilityLabel={t("header.goToAccount")}
          hitSlop={theme.em(0.4)}
          onPress={() => {
            haptic();
            router.push("/account");
          }}
          style={{
            width: box,
            height: box,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.fg,
          }}
        >
          <T v="strong" color={theme.bg}>
            {(user?.displayName.charAt(0) || "?").toUpperCase()}
          </T>
        </Pressable>
      ) : (
        <Pressable
          testID="header-back"
          accessibilityRole="button"
          accessibilityLabel={t("pixel.screens.back")}
          hitSlop={theme.em(0.4)}
          onPress={() => {
            haptic();
            router.back();
          }}
          style={{
            width: box,
            height: box,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.fg,
          }}
        >
          <PixelIcon name="arrow" size={theme.em(0.95)} color={theme.bg} style={{ transform: [{ scaleX: -1 }] }} />
        </Pressable>
      )}

      <T v="stat" style={{ flex: 1, letterSpacing: theme.em(0.05) }} numberOfLines={1}>
        {t(tabTitle ?? stackTitle(pathname))}
      </T>

      <Pressable
        accessibilityRole="button"
        testID="header-notifications"
        accessibilityLabel={t("pixel.screens.notifications")}
        hitSlop={theme.em(0.4)}
        onPress={() => {
          haptic();
          if (!pathname.startsWith("/notifications")) router.push("/notifications");
        }}
        style={{
          width: box,
          height: box,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: theme.line,
          borderColor: theme.fg,
        }}
      >
        <PixelIcon name="bell" size={theme.em(0.95)} color={theme.fg} />
        {state.unread > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -theme.em(0.2),
              right: -theme.em(0.2),
              width: theme.em(0.55),
              height: theme.em(0.55),
              backgroundColor: theme.fg,
              borderWidth: theme.line,
              borderColor: theme.bg,
            }}
          />
        ) : null}
      </Pressable>
    </View>
  );
}
