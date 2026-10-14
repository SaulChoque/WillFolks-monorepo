import { Stack } from "expo-router";

import { usePixelTheme } from "@/hooks/use-app-store";

export default function OnboardingLayout() {
  const theme = usePixelTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />;
}
