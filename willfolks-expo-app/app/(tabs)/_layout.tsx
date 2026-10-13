import { Tabs } from "expo-router";
import React from "react";

import { PixelTabBar } from "@/components/layout/pixel-tab-bar";
import { usePixelTheme } from "@/hooks/use-app-store";
import { t } from "@/i18n";

export default function TabLayout() {
  const theme = usePixelTheme();

  return (
    <Tabs
      tabBar={(props) => <PixelTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("pixel.tabs.time") }} />
      <Tabs.Screen name="dashboard" options={{ title: t("pixel.tabs.home") }} />
      <Tabs.Screen name="home" options={{ title: t("pixel.tabs.pet") }} />
      <Tabs.Screen name="activities" options={{ title: t("pixel.tabs.goals") }} />
      <Tabs.Screen name="settings" options={{ title: t("pixel.tabs.settings") }} />
    </Tabs>
  );
}
