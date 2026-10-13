import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { AlarmOverlay } from "@/components/alarm/alarm-overlay";
import { NewGoalSheet } from "@/components/goals/new-goal-sheet";
import { AppHeader } from "@/components/layout/app-header";
import { Burst, LcdOverlay, LockedToast, RefreshSweep } from "@/components/pixel/effects";
import { AppSync } from "@/components/system/app-sync";
import { AppStoreProvider, useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { SessionProvider, useSession } from "@/hooks/use-session";
import { WalletSecurityProvider } from "@/hooks/use-wallet-security";
// Registers the geofencing background task; it must be defined before any screen mounts.
import "@/lib/native/location";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    VT323: require("../assets/fonts/VT323-Regular.ttf"),
    "MartianMono-SemiBold": require("../assets/fonts/MartianMono-Condensed-SemiBold.ttf"),
    "MartianMono-Bold": require("../assets/fonts/MartianMono-Condensed-Bold.ttf"),
    "MartianMono-ExtraBold": require("../assets/fonts/MartianMono-Condensed-ExtraBold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <AppStoreProvider>
      <WalletSecurityProvider>
        <SessionProvider>
          <RootLayoutContent />
        </SessionProvider>
      </WalletSecurityProvider>
    </AppStoreProvider>
  );
}

function RootLayoutContent() {
  const theme = usePixelTheme();
  const pathname = usePathname();
  const { state } = useAppStore();
  const { status, onboarded } = useSession();
  const covered = state.alarm !== null || state.sheet !== null;

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: theme.id === "void",
      colors: {
        ...DefaultTheme.colors,
        background: theme.bg,
        card: theme.bg,
        text: theme.fg,
        border: theme.fg,
        primary: theme.fg,
      },
    }),
    [theme.id, theme.bg, theme.fg],
  );

  // Until the stored session is read there is no telling which side of the gate to show.
  if (status === "loading") return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{ flex: 1 }}
          // Screens under a full-screen overlay stay out of the accessibility tree.
          importantForAccessibility={covered ? "no-hide-descendants" : "auto"}
          accessibilityElementsHidden={covered}
        >
          <Stack
            screenOptions={{
              header: () => <AppHeader />,
              contentStyle: { backgroundColor: theme.bg },
            }}
          >
            <Stack.Protected guard={onboarded}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="account" />
              <Stack.Screen name="friends" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="permissions" />
              <Stack.Screen name="wallet/index" />
              <Stack.Screen name="wallet/[transactionId]" />
              <Stack.Screen name="activity/new" />
              <Stack.Screen name="activity/[activityId]" />
              <Stack.Screen name="focus/[activityId]" />
              <Stack.Screen name="proof/[activityId]" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!onboarded}>
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        </View>
        <RefreshSweep trigger={pathname} />
        <NewGoalSheet />
        <AlarmOverlay />
        <LockedToast />
        <Burst />
        <LcdOverlay />
      </View>
      <AppSync />
      <StatusBar style={theme.id === "void" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
