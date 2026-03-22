import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import "react-native-reanimated";

import AlarmModal from "@/components/alarm/AlarmModal";
import { AppHeader } from "@/components/layout/app-header";
import { BiometricOnboardingModal } from "@/components/security/biometric-onboarding-modal";
import useAlarm from "@/hooks/use-alarm";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useWalletSecurity,
  WalletSecurityProvider,
} from "@/hooks/use-wallet-security";
import { t } from "@/i18n";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <WalletSecurityProvider>
      <RootLayoutContent />
    </WalletSecurityProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { activeAlarm, snooze, stop } = useAlarm();
  const {
    firstLaunchBiometricRequired,
    biometricAvailable,
    biometricError,
    authenticateToReveal,
  } = useWalletSecurity();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await authenticateToReveal();
    } finally {
      setIsAuthenticating(false);
    }
  }, [authenticateToReveal, isAuthenticating]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ header: () => <AppHeader /> }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: t("navigation.modal") }}
        />
      </Stack>
      <AlarmModal
        visible={Boolean(activeAlarm)}
        activity={activeAlarm}
        onSnooze={snooze}
        onStop={stop}
      />
      <BiometricOnboardingModal
        visible={firstLaunchBiometricRequired}
        isAuthenticating={isAuthenticating}
        biometricAvailable={biometricAvailable}
        errorMessage={biometricError}
        onAuthenticate={handleAuthenticate}
      />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
